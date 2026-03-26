from fastapi import APIRouter, Depends, HTTPException, status
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
    """Lanzar escaneo de un territorio."""
    # Crear territorio
    territory = Territory(
        name=data.name,
        city=data.city,
        country=data.country,
        lat=data.lat,
        lng=data.lng,
        radius_m=int(data.radius_km * 1000),
    )
    db.add(territory)
    await db.flush()

    # Crear scan job
    job = ScanJob(
        territory_id=territory.id,
        nicho=data.nicho,
        status="pending",
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)

    # Lanzar Celery task
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
