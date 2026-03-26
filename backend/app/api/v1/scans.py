from fastapi import APIRouter, Depends, HTTPException, status
from geoalchemy2.shape import from_shape
from shapely.geometry import Polygon as ShapelyPolygon
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.scan_job import ScanJob
from app.models.territory import Territory
from app.models.user import User
from app.schemas.scan import ScanJobResponse, ScanRequest
from app.workers.scan_tasks import scan_territory

router = APIRouter(prefix="/scans", tags=["Scans"])


@router.post("/territory", response_model=ScanJobResponse, status_code=status.HTTP_201_CREATED)
async def create_scan(
    data: ScanRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lanzar escaneo de un territorio (por radio o por poligono)."""
    territory = Territory(
        name=data.name,
        city=data.city,
        country=data.country,
    )

    if data.polygon and len(data.polygon) >= 3:
        # Modo poligono: guardar geometry y calcular centroide
        # Convertir [lat, lng] a [lng, lat] para Shapely/PostGIS
        coords = [(p[1], p[0]) for p in data.polygon]
        coords.append(coords[0])  # cerrar poligono
        shapely_poly = ShapelyPolygon(coords)
        territory.geometry = from_shape(shapely_poly, srid=4326)
        centroid = shapely_poly.centroid
        territory.lat = centroid.y
        territory.lng = centroid.x
    elif data.lat is not None and data.lng is not None:
        # Modo radio
        territory.lat = data.lat
        territory.lng = data.lng
        territory.radius_m = int((data.radius_km or 1.0) * 1000)

    db.add(territory)
    await db.flush()

    job = ScanJob(
        territory_id=territory.id,
        nicho=data.nicho,
        status="pending",
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)

    scan_territory.delay(job.id)

    return job


@router.get("/{scan_id}/status", response_model=ScanJobResponse)
async def get_scan_status(
    scan_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Obtener estado de un escaneo."""
    result = await db.execute(select(ScanJob).where(ScanJob.id == scan_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Escaneo no encontrado",
        )
    return job
