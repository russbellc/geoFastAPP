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
from app.models.business_embedding import BusinessEmbedding
from app.services.ai_service import generate_business_summary
from app.services.embeddings import build_business_text, generate_embedding
from app.services.scoring import calculate_opportunity_score, classify_lead
from app.workers.celery_app import celery_app

logger = logging.getLogger(__name__)

_engine = create_async_engine(settings.DATABASE_URL, echo=False)
_async_session = async_sessionmaker(_engine, class_=AsyncSession, expire_on_commit=False)


async def _run_enrich(business_id: int):
    async with _async_session() as db:
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

        # Scrapear website si existe
        if business.website:
            scrape_data = await scrape_website(business.website)
            if scrape_data:
                profile.tech_stack = {"detected": scrape_data["tech_stack"]}
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
        else:
            # Sin website: perfil basico
            profile.seo_score = 0
            profile.tech_stack = {"detected": []}

        # Scoring
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

        # Resumen IA (Groq)
        tech = profile.tech_stack or {}
        social = {
            "facebook": profile.facebook_url,
            "instagram": profile.instagram_url,
            "tiktok": profile.tiktok_url,
        }
        profile.ai_summary = generate_business_summary(
            name=business.name,
            category=business.category,
            subcategory=business.subcategory,
            address=business.address,
            website=business.website,
            services_text=profile.services,
            tech_stack=tech.get("detected", []),
            has_booking=profile.has_online_booking,
            has_chatbot=profile.has_chatbot,
            seo_score=profile.seo_score,
            social_links=social,
        )

        profile.enriched_at = datetime.now(timezone.utc)
        await db.commit()

        # Generar embedding para busqueda semantica
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
                select(BusinessEmbedding).where(
                    BusinessEmbedding.business_id == business_id
                )
            )
            emb_record = existing_emb.scalar_one_or_none()
            if emb_record:
                emb_record.embedding = emb
            else:
                db.add(BusinessEmbedding(business_id=business_id, embedding=emb))
            await db.commit()
        except Exception as e:
            logger.warning(f"Error generando embedding para {business_id}: {e}")

        logger.info(
            f"Business {business_id} enriquecido: score={score} lead={profile.lead_status}"
        )


@celery_app.task(name="enrich_business", bind=True, max_retries=1)
def enrich_business(self, business_id: int):
    """Enriquecer un negocio individual."""
    logger.info(f"Enriqueciendo business {business_id}")
    asyncio.run(_run_enrich(business_id))


async def _run_enrich_territory(territory_id: int):
    async with _async_session() as db:
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
