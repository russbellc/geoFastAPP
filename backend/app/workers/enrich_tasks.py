import asyncio
import logging
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.models.business import Business
from app.models.business_profile import BusinessProfile
from app.scrapers.web_scraper import scrape_website
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

        profile.enriched_at = datetime.now(timezone.utc)
        await db.commit()

        logger.info(f"Business {business_id} enriquecido (website: {business.website})")


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
