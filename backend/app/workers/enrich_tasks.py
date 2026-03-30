import asyncio
import logging
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy import func

from app.core.config import settings
from app.models.business import Business
from app.models.business_profile import BusinessProfile
from app.scrapers.web_scraper import scrape_website
from app.scrapers.gmaps_scraper import GMapsScraper
from app.models.business_embedding import BusinessEmbedding
from app.services.ai_service import generate_business_summary
from app.services.embeddings import build_business_text, generate_embedding
from app.services.scoring import calculate_opportunity_score, classify_lead
from app.workers.celery_app import celery_app

logger = logging.getLogger(__name__)


def _make_session():
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    return async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def _enrich_with_gmaps(business: Business, profile: BusinessProfile, db: AsyncSession):
    """Enriquece un negocio usando Google Maps (rating, reviews, horarios, telefono, web)."""
    try:
        scraper = GMapsScraper(headless=True)
        # Determinar ciudad desde address o usar nombre del territorio
        city = ""
        if business.address:
            parts = business.address.split(",")
            city = parts[-1].strip() if len(parts) > 1 else parts[0].strip()
        if not city or len(city) < 3:
            # Fallback: obtener ciudad del territorio
            t_result = await db.execute(
                select(Business.territory_id).where(Business.id == business.id)
            )
            from app.models.territory import Territory
            t_id = t_result.scalar()
            if t_id:
                t = await db.execute(select(Territory).where(Territory.id == t_id))
                terr = t.scalar_one_or_none()
                if terr and terr.city:
                    city = terr.city

        if not city:
            city = "Peru"

        result = await scraper.search_single(business.name, city)
        if not result:
            logger.info(f"GMaps enrich: no result for '{business.name}' in '{city}'")
            return False

        # Store GMaps data in tech_stack JSON
        gmaps_data = {
            "rating": result.get("rating"),
            "reviews_count": result.get("reviews_count"),
            "hours": result.get("hours"),
            "gmaps_category": result.get("category"),
            "gmaps_url": result.get("gmaps_url"),
        }

        existing_tech = profile.tech_stack or {}
        existing_tech["gmaps"] = gmaps_data
        profile.tech_stack = existing_tech

        # Update business fields if we got better data
        if result.get("phone") and not business.phone:
            business.phone = result["phone"]
        if result.get("website") and not business.website:
            business.website = result["website"]
        if result.get("address") and not business.address:
            business.address = result["address"]

        logger.info(f"GMaps enrich OK: '{business.name}' rating={result.get('rating')} reviews={result.get('reviews_count')}")
        return True

    except Exception as e:
        logger.warning(f"GMaps enrich failed for '{business.name}': {e}")
        return False


async def _run_enrich(business_id: int):
    async with _make_session()() as db:
        result = await db.execute(
            select(Business).where(Business.id == business_id)
        )
        business = result.scalar_one_or_none()
        if not business:
            logger.error(f"Business {business_id} no encontrado")
            return

        # Verificar si ya tiene perfil
        result = await db.execute(
            select(BusinessProfile).where(BusinessProfile.business_id == business_id)
        )
        profile = result.scalar_one_or_none()
        if not profile:
            profile = BusinessProfile(business_id=business_id)
            db.add(profile)

        # === FASE 1: Google Maps enrichment (siempre intentar) ===
        await _enrich_with_gmaps(business, profile, db)

        # === FASE 2: Web scraping (si tiene website) ===
        if business.website:
            try:
                scrape_data = await scrape_website(business.website)
                if scrape_data:
                    existing_tech = profile.tech_stack or {}
                    existing_tech["detected"] = scrape_data["tech_stack"]
                    profile.tech_stack = existing_tech
                    profile.has_online_booking = scrape_data["has_online_booking"]
                    profile.has_chatbot = scrape_data["has_chatbot"]
                    profile.services = scrape_data["services_text"]

                    # SEO
                    seo = scrape_data["seo"]
                    seo_score = 0
                    if seo.get("title"):
                        seo_score += 30
                    if seo.get("meta_description"):
                        seo_score += 30
                    if seo.get("h1"):
                        seo_score += 20
                    if business.website.startswith("https"):
                        seo_score += 20
                    profile.seo_score = seo_score

                    # Redes sociales
                    social = scrape_data["social_links"]
                    if social.get("facebook"):
                        profile.facebook_url = social["facebook"]
                    if social.get("instagram"):
                        profile.instagram_url = social["instagram"]
                    if social.get("tiktok"):
                        profile.tiktok_url = social["tiktok"]
            except Exception as e:
                logger.warning(f"Web scraping failed for {business_id}: {e}")
        else:
            if not profile.seo_score:
                profile.seo_score = 0
            if not profile.tech_stack:
                profile.tech_stack = {"detected": []}

        # === FASE 3: Scoring ===
        density_result = await db.execute(
            select(func.count(Business.id)).where(
                Business.territory_id == business.territory_id,
                Business.category == business.category,
            )
        )
        territory_density = density_result.scalar() or 0

        score = calculate_opportunity_score(business, profile, territory_density)
        profile.opportunity_score = score
        profile.lead_status = classify_lead(score)

        # === FASE 4: AI Summary ===
        tech = profile.tech_stack or {}
        gmaps = tech.get("gmaps", {})
        social = {
            "facebook": profile.facebook_url,
            "instagram": profile.instagram_url,
            "tiktok": profile.tiktok_url,
        }

        # Build richer context for AI
        extra_context = ""
        if gmaps.get("rating"):
            extra_context += f" Rating Google Maps: {gmaps['rating']}/5"
            if gmaps.get("reviews_count"):
                extra_context += f" ({gmaps['reviews_count']} reviews)."
        if gmaps.get("hours"):
            extra_context += f" Horario: {gmaps['hours']}."
        if gmaps.get("gmaps_category"):
            extra_context += f" Categoria GMaps: {gmaps['gmaps_category']}."

        try:
            profile.ai_summary = generate_business_summary(
                name=business.name,
                category=business.category,
                subcategory=business.subcategory,
                address=business.address,
                website=business.website,
                services_text=(profile.services or "") + extra_context,
                tech_stack=tech.get("detected", []),
                has_booking=profile.has_online_booking,
                has_chatbot=profile.has_chatbot,
                seo_score=profile.seo_score,
                social_links=social,
            )
        except Exception as e:
            logger.warning(f"AI summary failed for {business_id}: {e}")
            # Fallback: generate basic summary without AI
            profile.ai_summary = f"{business.name} es un negocio de {business.category or 'general'}"
            if business.subcategory:
                profile.ai_summary += f" ({business.subcategory})"
            if business.address:
                profile.ai_summary += f" ubicado en {business.address}."
            if gmaps.get("rating"):
                profile.ai_summary += f" Tiene un rating de {gmaps['rating']}/5 en Google Maps"
                if gmaps.get("reviews_count"):
                    profile.ai_summary += f" con {gmaps['reviews_count']} opiniones"
                profile.ai_summary += "."
            if not business.website:
                profile.ai_summary += " No tiene sitio web, lo que representa una oportunidad de digitalizacion."

        profile.enriched_at = datetime.now(timezone.utc)
        await db.commit()

        # === FASE 5: Embedding ===
        try:
            text = build_business_text(
                name=business.name,
                category=business.category,
                subcategory=business.subcategory,
                address=business.address,
                services=profile.services,
            )
            emb = generate_embedding(text)

            existing_emb = await db.execute(
                select(BusinessEmbedding).where(BusinessEmbedding.business_id == business_id)
            )
            emb_record = existing_emb.scalar_one_or_none()
            if emb_record:
                emb_record.embedding = emb
            else:
                db.add(BusinessEmbedding(business_id=business_id, embedding=emb))
            await db.commit()
        except Exception as e:
            logger.warning(f"Error generando embedding para {business_id}: {e}")

        logger.info(f"Business {business_id} enriquecido: score={score} lead={profile.lead_status}")


@celery_app.task(name="enrich_business", bind=True, max_retries=1)
def enrich_business(self, business_id: int):
    """Enriquecer un negocio individual."""
    logger.info(f"Enriqueciendo business {business_id}")
    asyncio.run(_run_enrich(business_id))


async def _run_enrich_territory(territory_id: int):
    async with _make_session()() as db:
        result = await db.execute(
            select(Business.id).where(Business.territory_id == territory_id)
        )
        business_ids = [row[0] for row in result.all()]

    logger.info(f"Enriqueciendo {len(business_ids)} negocios del territorio {territory_id}")
    for bid in business_ids:
        enrich_business.delay(bid)


@celery_app.task(name="enrich_territory")
def enrich_territory(territory_id: int):
    """Lanzar enriquecimiento masivo de todos los negocios de un territorio."""
    asyncio.run(_run_enrich_territory(territory_id))


async def _run_enrich_batch(filters: dict):
    """Enriquece negocios en lote segun filtros."""
    async with _make_session()() as db:
        query = select(Business.id).outerjoin(
            BusinessProfile, Business.id == BusinessProfile.business_id
        ).where(BusinessProfile.id.is_(None))  # Solo no enriquecidos

        if filters.get("territory_id"):
            query = query.where(Business.territory_id == filters["territory_id"])
        if filters.get("category"):
            query = query.where(Business.category == filters["category"])

        result = await db.execute(query.limit(200))  # Max 200 por batch
        business_ids = [row[0] for row in result.all()]

    logger.info(f"Enrich batch: {len(business_ids)} negocios pendientes")
    for bid in business_ids:
        enrich_business.delay(bid)
    return len(business_ids)


@celery_app.task(name="enrich_batch")
def enrich_batch(filters: dict):
    """Enriquecer negocios en lote segun filtros."""
    return asyncio.run(_run_enrich_batch(filters))
