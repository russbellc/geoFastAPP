import asyncio
import logging
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from geoalchemy2.shape import to_shape

from app.core.config import settings
from app.models.business import Business
from app.models.scan_job import ScanJob
from app.models.territory import Territory
from app.services.osm_categories import categorize_osm_tags
from app.services.overpass import OverpassClient
from app.scrapers.doctoralia_scraper import DoctoraliaClient
from app.workers.celery_app import celery_app

logger = logging.getLogger(__name__)


def _make_session():
    """Crea engine + session fresco por cada invocacion (evita event loop conflicts con Celery)."""
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    return async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def _run_scan(job_id: int):
    session_factory = _make_session()
    async with session_factory() as db:
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
            if territory.geometry is not None:
                # Modo poligono: usar filtro poly de Overpass
                shapely_geom = to_shape(territory.geometry)
                coords = [[y, x] for x, y in shapely_geom.exterior.coords[:-1]]
                raw_businesses = await client.query_by_polygon(coords)
            else:
                # Modo radio
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

            # 5b. Si nicho es salud, escanear Doctoralia tambien
            if job.nicho and job.nicho.lower() in ("salud", "health", "clinica", "medico"):
                try:
                    doctoralia = DoctoraliaClient()
                    city = territory.city or "Lima"
                    doctoralia_results = await doctoralia.search_by_city(city, max_pages=2)
                    logger.info(f"Doctoralia: {len(doctoralia_results)} resultados para {city}")

                    for doc_biz in doctoralia_results:
                        # Deduplicar por nombre normalizado en misma ciudad
                        name_normalized = doc_biz["name"].strip().lower()
                        existing = await db.execute(
                            select(Business).where(
                                Business.territory_id == territory.id,
                                Business.name.ilike(f"%{name_normalized[:30]}%"),
                            )
                        )
                        if existing.scalar_one_or_none():
                            continue

                        business = Business(
                            territory_id=territory.id,
                            name=doc_biz["name"],
                            category="salud",
                            subcategory=doc_biz.get("subcategory", "consultorio"),
                            lat=doc_biz.get("lat"),
                            lng=doc_biz.get("lng"),
                            address=doc_biz.get("address"),
                            phone=doc_biz.get("phone"),
                            website=doc_biz.get("website"),
                            email=doc_biz.get("email"),
                            source="doctoralia",
                        )
                        db.add(business)
                        inserted += 1

                    await db.commit()
                except Exception as e:
                    logger.warning(f"Doctoralia scraping failed (non-fatal): {e}")

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
