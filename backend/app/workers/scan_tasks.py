import asyncio
import logging
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.models.business import Business
from app.models.scan_job import ScanJob
from app.models.territory import Territory
from app.services.osm_categories import categorize_osm_tags
from app.services.overpass import OverpassClient
from app.workers.celery_app import celery_app

logger = logging.getLogger(__name__)

# Engine sincrono para Celery (cada task crea su propia session)
_engine = create_async_engine(settings.DATABASE_URL, echo=False)
_async_session = async_sessionmaker(_engine, class_=AsyncSession, expire_on_commit=False)


async def _run_scan(job_id: int):
    async with _async_session() as db:
        # 1. Obtener scan_job
        result = await db.execute(select(ScanJob).where(ScanJob.id == job_id))
        job = result.scalar_one_or_none()
        if not job:
            logger.error(f"ScanJob {job_id} no encontrado")
            return

        # 2. Marcar como running
        job.status = "running"
        job.started_at = datetime.now(timezone.utc)
        await db.commit()

        try:
            # 3. Obtener territorio
            result = await db.execute(
                select(Territory).where(Territory.id == job.territory_id)
            )
            territory = result.scalar_one()

            # 4. Query Overpass API
            client = OverpassClient()
            raw_businesses = await client.query_by_radius(
                lat=territory.lat,
                lng=territory.lng,
                radius_m=territory.radius_m or 1000,
            )

            # 5. Deduplicar e insertar
            inserted = 0
            for biz in raw_businesses:
                # Verificar si ya existe por osm_id
                existing = await db.execute(
                    select(Business).where(Business.osm_id == biz["osm_id"])
                )
                if existing.scalar_one_or_none():
                    continue

                category, subcategory = categorize_osm_tags(biz["tags"])

                business = Business(
                    territory_id=territory.id,
                    name=biz["name"],
                    category=category,
                    subcategory=subcategory,
                    lat=biz["lat"],
                    lng=biz["lng"],
                    address=biz["address"],
                    phone=biz["phone"],
                    website=biz["website"],
                    email=biz["email"],
                    source="osm",
                    osm_id=biz["osm_id"],
                )
                db.add(business)
                inserted += 1

            await db.commit()

            # 6. Actualizar scan_job
            job.status = "done"
            job.total_found = inserted
            job.finished_at = datetime.now(timezone.utc)
            await db.commit()

            # 7. Actualizar territory
            territory.last_scan_at = datetime.now(timezone.utc)
            await db.commit()

            logger.info(f"ScanJob {job_id}: {inserted} negocios insertados")

        except Exception as e:
            logger.error(f"ScanJob {job_id} fallo: {e}")
            job.status = "failed"
            job.finished_at = datetime.now(timezone.utc)
            await db.commit()
            raise


@celery_app.task(name="scan_territory", bind=True, max_retries=2)
def scan_territory(self, job_id: int):
    """Celery task que ejecuta el escaneo de un territorio."""
    logger.info(f"Iniciando escaneo ScanJob {job_id}")
    asyncio.run(_run_scan(job_id))
