import asyncio
import logging
import math
import unicodedata
import re
from datetime import datetime, timezone

from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from geoalchemy2.shape import to_shape

from app.core.config import settings
from app.models.business import Business
from app.models.business_profile import BusinessProfile
from app.models.scan_job import ScanJob
from app.models.territory import Territory
from app.services.osm_categories import categorize_osm_tags
from app.services.overpass import OverpassClient
from app.scrapers.doctoralia_scraper import DoctoraliaClient
from app.scrapers.gmaps_scraper import GMapsScraper
from app.workers.celery_app import celery_app

logger = logging.getLogger(__name__)


def _normalize_name(name: str) -> str:
    """Normaliza nombre para comparacion: lowercase, sin acentos, sin puntuacion extra."""
    name = name.strip().lower()
    # Remove accents
    name = unicodedata.normalize("NFD", name)
    name = "".join(c for c in name if unicodedata.category(c) != "Mn")
    # Remove extra punctuation and whitespace
    name = re.sub(r"[^\w\s]", "", name)
    name = re.sub(r"\s+", " ", name).strip()
    return name


def _haversine_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calcula distancia en metros entre dos puntos usando formula de Haversine."""
    R = 6371000  # radio de la tierra en metros
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


async def _is_duplicate(
    db: AsyncSession,
    name: str,
    lat: float | None,
    lng: float | None,
    osm_id: str | None = None,
    territory_id: int | None = None,
    check_all_territories: bool = False,
) -> bool:
    """Verifica si un negocio es duplicado por osm_id O por nombre+coordenadas cercanas (<200m).

    Args:
        check_all_territories: Si True, busca duplicados en TODOS los territorios (para GMaps).
    """
    # 1. Check by osm_id
    if osm_id:
        existing = await db.execute(
            select(Business.id).where(Business.osm_id == osm_id).limit(1)
        )
        if existing.scalar_one_or_none():
            return True

    # 2. Check by normalized name + nearby coordinates
    normalized = _normalize_name(name)
    if not normalized:
        return False

    # Search by name similarity
    query = select(Business.id, Business.lat, Business.lng).where(
        func.lower(Business.name).ilike(f"%{normalized[:30]}%")
    )
    if not check_all_territories and territory_id:
        query = query.where(Business.territory_id == territory_id)

    result = await db.execute(query)
    candidates = result.all()

    for _id, blat, blng in candidates:
        if lat and lng and blat and blng:
            dist = _haversine_distance(lat, lng, blat, blng)
            if dist < 200:  # menos de 200 metros
                return True
        elif not lat or not lng:
            # Sin coordenadas, nombre coincide => duplicado
            return True

    return False


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

            # 4. Query Overpass API (non-fatal si falla)
            raw_businesses = []
            try:
                client = OverpassClient()
                if territory.geometry is not None:
                    shapely_geom = to_shape(territory.geometry)
                    coords = [[y, x] for x, y in shapely_geom.exterior.coords[:-1]]
                    raw_businesses = await client.query_by_polygon(coords)
                else:
                    raw_businesses = await client.query_by_radius(
                        lat=territory.lat,
                        lng=territory.lng,
                        radius_m=territory.radius_m or 1000,
                    )
            except Exception as e:
                logger.warning(f"Overpass API failed (non-fatal): {e}")

            # 5. Deduplicar e insertar
            inserted = 0
            for biz in raw_businesses:
                # Dedup: osm_id OR nombre+coordenadas cercanas
                if await _is_duplicate(
                    db, biz["name"], biz["lat"], biz["lng"],
                    osm_id=biz["osm_id"], territory_id=territory.id
                ):
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
                    bad_cities = {"mi ubicacion", "auto", "mi ubicación", "mobile scan", "unknown", ""}
                    if city.lower().strip() in bad_cities:
                        city = territory.name.split("-")[0].strip() if "-" in territory.name else "Lima"
                    doctoralia_results = await doctoralia.search_by_city(city, max_pages=2)
                    logger.info(f"Doctoralia: {len(doctoralia_results)} resultados para {city}")

                    for doc_biz in doctoralia_results:
                        # Dedup: nombre+coordenadas cercanas en territorio actual
                        if await _is_duplicate(
                            db, doc_biz["name"], doc_biz.get("lat"), doc_biz.get("lng"),
                            territory_id=territory.id
                        ):
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

            # 5c. Google Maps scraping (si hay nicho definido)
            if job.nicho:
                try:
                    gmaps = GMapsScraper(headless=True, max_results=20)
                    # Usar ciudad real, o coordenadas si la ciudad no es util
                    city = territory.city or "Lima"
                    bad_cities = {"mi ubicacion", "auto", "mi ubicación", "mobile scan", "unknown", ""}
                    if city.lower().strip() in bad_cities:
                        # Usar coordenadas como ubicacion
                        city = f"{territory.lat},{territory.lng}" if territory.lat else "Peru"
                    search_query = job.nicho if job.nicho.lower() != "salud" else "clinicas consultorios medicos"
                    gmaps_results = await gmaps.search(search_query, city)
                    logger.info(f"GMaps: {len(gmaps_results)} resultados para '{search_query}' en {city}")

                    for gm_biz in gmaps_results:
                        if not gm_biz.get("name"):
                            continue
                        # Dedup: nombre+coordenadas en TODOS los territorios (global)
                        if await _is_duplicate(
                            db, gm_biz["name"], gm_biz.get("lat"), gm_biz.get("lng"),
                            territory_id=territory.id, check_all_territories=True
                        ):
                            continue

                        # Map GMaps category to internal
                        cat, subcat = _map_gmaps_category(gm_biz.get("category", ""), job.nicho)

                        business = Business(
                            territory_id=territory.id,
                            name=gm_biz["name"],
                            category=cat,
                            subcategory=subcat,
                            lat=gm_biz.get("lat"),
                            lng=gm_biz.get("lng"),
                            address=gm_biz.get("address"),
                            phone=gm_biz.get("phone"),
                            website=gm_biz.get("website"),
                            source="google_maps",
                        )
                        db.add(business)
                        inserted += 1

                    await db.commit()
                except Exception as e:
                    logger.warning(f"GMaps scraping failed (non-fatal): {e}")

            # 6. Actualizar scan_job
            job.status = "done"
            job.total_found = inserted
            job.finished_at = datetime.now(timezone.utc)
            await db.commit()

            # 7. Actualizar territory
            territory.last_scan_at = datetime.now(timezone.utc)
            await db.commit()

            logger.info(f"ScanJob {job_id}: {inserted} negocios insertados")

            # 8. Auto-enrich: trigger enrichment for first 20 businesses without profiles
            try:
                from app.workers.enrich_tasks import enrich_business as enrich_business_task

                unenriched = await db.execute(
                    select(Business.id)
                    .outerjoin(BusinessProfile, Business.id == BusinessProfile.business_id)
                    .where(
                        Business.territory_id == territory.id,
                        BusinessProfile.id.is_(None),
                    )
                    .limit(20)
                )
                biz_ids = [row[0] for row in unenriched.all()]
                for biz_id in biz_ids:
                    enrich_business_task.delay(biz_id)
                if biz_ids:
                    logger.info(f"ScanJob {job_id}: auto-enrich triggered for {len(biz_ids)} businesses")
            except Exception as e:
                logger.warning(f"Auto-enrich dispatch failed (non-fatal): {e}")

        except Exception as e:
            logger.error(f"ScanJob {job_id} fallo: {e}")
            job.status = "failed"
            job.finished_at = datetime.now(timezone.utc)
            await db.commit()
            raise


def _map_gmaps_category(gmaps_cat: str, nicho: str) -> tuple[str, str]:
    """Mapea categoria de Google Maps a categoria interna."""
    cat_lower = gmaps_cat.lower() if gmaps_cat else ""

    health_keywords = ["médic", "clinic", "hospital", "farmacia", "dental", "doctor",
                       "salud", "laboratorio", "óptic", "veterinar", "fisioter",
                       "psicólog", "nutrici", "rehabilit", "consultorio"]
    food_keywords = ["restaur", "café", "comida", "cevich", "pollería", "bar", "heladería"]
    shop_keywords = ["tienda", "mercado", "bodega", "ferretería", "librería"]
    edu_keywords = ["colegio", "universidad", "instituto", "escuela", "academia"]

    for kw in health_keywords:
        if kw in cat_lower:
            subcat = "clinica"
            if "farmacia" in cat_lower or "botica" in cat_lower:
                subcat = "farmacia"
            elif "dental" in cat_lower or "odonto" in cat_lower:
                subcat = "dentista"
            elif "hospital" in cat_lower:
                subcat = "hospital"
            elif "laboratorio" in cat_lower:
                subcat = "laboratorio"
            elif "veterinar" in cat_lower:
                subcat = "veterinaria"
            elif "óptic" in cat_lower:
                subcat = "optica"
            return ("salud", subcat)

    for kw in food_keywords:
        if kw in cat_lower:
            return ("gastronomia", "restaurante")

    for kw in shop_keywords:
        if kw in cat_lower:
            return ("comercio", cat_lower[:30])

    for kw in edu_keywords:
        if kw in cat_lower:
            return ("educacion", "colegio")

    # Default: use niche as category
    if nicho.lower() in ("salud", "health"):
        return ("salud", "consultorio")
    return ("otro", cat_lower[:30] if cat_lower else "desconocido")


@celery_app.task(name="scan_territory", bind=True, max_retries=2)
def scan_territory(self, job_id: int):
    """Celery task que ejecuta el escaneo de un territorio."""
    logger.info(f"Iniciando escaneo ScanJob {job_id}")
    asyncio.run(_run_scan(job_id))


async def _run_rescan_stale():
    """Encuentra territorios sin escanear en 30+ dias y lanza re-escaneos."""
    from datetime import timedelta

    session_factory = _make_session()
    async with session_factory() as db:
        threshold = datetime.now(timezone.utc) - timedelta(days=30)
        result = await db.execute(
            select(Territory).where(
                (Territory.last_scan_at < threshold) | (Territory.last_scan_at.is_(None))
            )
        )
        stale_territories = result.scalars().all()

        for territory in stale_territories:
            # Create a new scan job for each stale territory
            scan_job = ScanJob(
                territory_id=territory.id,
                status="pending",
            )
            db.add(scan_job)
            await db.flush()
            scan_territory.delay(scan_job.id)
            logger.info(
                f"Re-scan scheduled for territory {territory.id} ({territory.name}), "
                f"last scanned: {territory.last_scan_at}"
            )

        await db.commit()
        logger.info(f"Rescan check: {len(stale_territories)} stale territories queued")


@celery_app.task(name="rescan_stale_territories")
def rescan_stale_territories():
    """Celery Beat task: re-scan territories not scanned in 30+ days."""
    asyncio.run(_run_rescan_stale())
