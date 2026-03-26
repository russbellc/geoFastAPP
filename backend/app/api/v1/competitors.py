from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.competitor import Competitor
from app.models.user import User
from app.workers.competitor_tasks import scan_competitors

router = APIRouter(prefix="/competitors", tags=["Competitors"])


class CompetitorResponse(BaseModel):
    id: int
    name: str
    type: str
    country: str | None
    markets: list[str] | None
    website: str | None
    instagram_url: str | None
    tiktok_url: str | None
    facebook_url: str | None
    linkedin_url: str | None
    followers: int | None
    engagement_rate: float | None
    posting_frequency: str | None
    content_strategy: dict | None
    target_markets: list[str] | None
    ai_analysis: str | None
    gap_vs_liaflow: str | None
    last_scanned_at: datetime | None

    model_config = {"from_attributes": True}


class CompetitorCreate(BaseModel):
    name: str
    type: str = "saas_salud"
    country: str | None = None
    markets: list[str] | None = None
    website: str | None = None
    instagram_url: str | None = None
    tiktok_url: str | None = None
    facebook_url: str | None = None
    linkedin_url: str | None = None


@router.get("", response_model=list[CompetitorResponse])
async def list_competitors(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Listar radar de competencia."""
    result = await db.execute(
        select(Competitor).order_by(Competitor.followers.desc().nullslast())
    )
    return result.scalars().all()


@router.get("/{competitor_id}", response_model=CompetitorResponse)
async def get_competitor(
    competitor_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Perfil detallado de competidor."""
    result = await db.execute(select(Competitor).where(Competitor.id == competitor_id))
    comp = result.scalar_one_or_none()
    if not comp:
        raise HTTPException(status_code=404, detail="Competitor not found")
    return comp


@router.post("", response_model=CompetitorResponse, status_code=status.HTTP_201_CREATED)
async def create_competitor(
    data: CompetitorCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Agregar competidor al radar."""
    comp = Competitor(
        name=data.name,
        type=data.type,
        country=data.country,
        markets=data.markets,
        website=data.website,
        instagram_url=data.instagram_url,
        tiktok_url=data.tiktok_url,
        facebook_url=data.facebook_url,
        linkedin_url=data.linkedin_url,
    )
    db.add(comp)
    await db.commit()
    await db.refresh(comp)
    return comp


@router.post("/scan", status_code=status.HTTP_202_ACCEPTED)
async def trigger_competitor_scan(
    current_user: User = Depends(get_current_user),
):
    """Lanzar escaneo de competidores SaaS salud en redes."""
    scan_competitors.delay()
    return {"message": "Competitor scan launched"}
