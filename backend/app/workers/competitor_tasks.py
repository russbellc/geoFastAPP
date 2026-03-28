"""Celery tasks para escaneo de competidores SaaS salud en redes sociales."""

import asyncio
import logging
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.models.competitor import Competitor
from app.workers.celery_app import celery_app

logger = logging.getLogger(__name__)


def _make_session():
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    return async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# Competidores SaaS salud conocidos en LATAM para seed inicial
KNOWN_COMPETITORS = [
    {
        "name": "Doctoralia",
        "country": "Mexico",
        "markets": ["mexico", "peru", "colombia", "chile", "brasil"],
        "website": "https://www.doctoralia.com",
        "type": "saas_salud",
    },
    {
        "name": "Medilink",
        "country": "Peru",
        "markets": ["peru"],
        "website": "https://www.medilink.pe",
        "type": "saas_salud",
    },
    {
        "name": "Nubimed",
        "country": "Espana",
        "markets": ["espana", "mexico", "colombia"],
        "website": "https://www.nubimed.com",
        "type": "saas_salud",
    },
    {
        "name": "Dentalink",
        "country": "Chile",
        "markets": ["chile", "peru", "colombia", "mexico"],
        "website": "https://www.dentalink.com",
        "type": "saas_salud",
    },
    {
        "name": "Huli",
        "country": "Costa Rica",
        "markets": ["costa_rica", "panama", "colombia"],
        "website": "https://www.huli.io",
        "type": "saas_salud",
    },
    {
        "name": "Nimbo",
        "country": "Mexico",
        "markets": ["mexico", "colombia"],
        "website": "https://www.nimbo.com",
        "type": "saas_salud",
    },
    {
        "name": "Siku",
        "country": "Argentina",
        "markets": ["argentina", "uruguay"],
        "website": "https://www.siku.com",
        "type": "saas_salud",
    },
    {
        "name": "SimplePractice",
        "country": "USA",
        "markets": ["usa", "canada", "latam"],
        "website": "https://www.simplepractice.com",
        "type": "saas_salud",
    },
]

# Keywords para detectar competidores en redes sociales
SEARCH_KEYWORDS = [
    "sistema medico",
    "gestion clinica",
    "historia clinica digital",
    "software medico",
    "agenda medica online",
    "telemedicina plataforma",
    "expediente clinico electronico",
    "software dental",
    "gestion consultorio",
]


async def _run_competitor_scan():
    """Ejecuta escaneo de competidores: seed conocidos + analisis basico."""
    async with _make_session()() as db:
        # 1. Seed competidores conocidos si no existen
        for comp_data in KNOWN_COMPETITORS:
            existing = await db.execute(
                select(Competitor).where(Competitor.name == comp_data["name"])
            )
            if existing.scalar_one_or_none():
                continue

            comp = Competitor(
                name=comp_data["name"],
                type=comp_data["type"],
                country=comp_data.get("country"),
                markets=comp_data.get("markets"),
                website=comp_data.get("website"),
                last_scanned_at=datetime.now(timezone.utc),
            )
            db.add(comp)
            logger.info(f"Seeded competitor: {comp_data['name']}")

        await db.commit()

        # 2. Para cada competidor, generar analisis AI basico
        result = await db.execute(
            select(Competitor).where(Competitor.ai_analysis.is_(None))
        )
        competitors = result.scalars().all()

        for comp in competitors:
            try:
                # Generar analisis basico sin llamar API externa
                markets_str = ", ".join(comp.markets) if comp.markets else "unknown"
                comp.ai_analysis = (
                    f"{comp.name} is a {comp.type} platform operating in {markets_str}. "
                    f"Based in {comp.country or 'unknown location'}. "
                    f"Website: {comp.website or 'not available'}."
                )
                comp.gap_vs_liaflow = _generate_gap_analysis(comp)
                comp.content_strategy = {
                    "focus": "healthcare management",
                    "platforms": [
                        p for p in ["instagram", "facebook", "linkedin", "tiktok"]
                        if getattr(comp, f"{p}_url", None)
                    ] or ["website"],
                }
                comp.last_scanned_at = datetime.now(timezone.utc)
            except Exception as e:
                logger.warning(f"Failed to analyze {comp.name}: {e}")

        await db.commit()
        logger.info(f"Competitor scan complete: {len(competitors)} analyzed")


def _generate_gap_analysis(comp: Competitor) -> str:
    """Genera analisis de gaps vs LiaFlow basado en datos disponibles."""
    gaps = []
    markets = comp.markets or []

    if "peru" not in markets:
        gaps.append("No presence in Peru (LiaFlow primary market)")
    if not comp.instagram_url and not comp.tiktok_url:
        gaps.append("Weak social media presence — opportunity for LiaFlow content strategy")
    if comp.followers and comp.followers < 5000:
        gaps.append("Low follower count — LiaFlow can outperform in brand awareness")
    if not comp.website:
        gaps.append("No web presence detected")

    if not gaps:
        gaps.append("Strong competitor — monitor closely for market movements")

    return " | ".join(gaps)


@celery_app.task(name="scan_competitors", bind=True, max_retries=1)
def scan_competitors(self):
    """Celery task para escaneo de competidores."""
    logger.info("Starting competitor scan")
    asyncio.run(_run_competitor_scan())
