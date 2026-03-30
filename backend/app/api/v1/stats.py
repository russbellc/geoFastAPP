from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.business import Business
from app.models.business_profile import BusinessProfile
from app.models.territory import Territory
from app.models.user import User

router = APIRouter(prefix="/stats", tags=["Stats"])


class CategoryCount(BaseModel):
    category: str
    count: int


class LeadCount(BaseModel):
    status: str
    count: int


class TerritoryStatsResponse(BaseModel):
    territory_id: int
    territory_name: str
    total_businesses: int
    total_enriched: int
    categories: list[CategoryCount]
    lead_distribution: list[LeadCount]
    avg_opportunity_score: float | None


@router.get("/territory/{territory_id}", response_model=TerritoryStatsResponse)
async def get_territory_stats(
    territory_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Obtener metricas y estadisticas de un territorio."""
    # Territorio
    result = await db.execute(select(Territory).where(Territory.id == territory_id))
    territory = result.scalar_one_or_none()
    if not territory:
        raise HTTPException(status_code=404, detail="Territorio no encontrado")

    # Total negocios
    total_result = await db.execute(
        select(func.count(Business.id)).where(Business.territory_id == territory_id)
    )
    total = total_result.scalar()

    # Categorias
    cat_result = await db.execute(
        select(Business.category, func.count(Business.id))
        .where(Business.territory_id == territory_id)
        .group_by(Business.category)
        .order_by(func.count(Business.id).desc())
    )
    categories = [
        CategoryCount(category=row[0] or "sin_categoria", count=row[1])
        for row in cat_result.all()
    ]

    # Enriquecidos y lead distribution
    enriched_result = await db.execute(
        select(func.count(BusinessProfile.id))
        .join(Business, Business.id == BusinessProfile.business_id)
        .where(Business.territory_id == territory_id)
    )
    total_enriched = enriched_result.scalar()

    lead_result = await db.execute(
        select(BusinessProfile.lead_status, func.count(BusinessProfile.id))
        .join(Business, Business.id == BusinessProfile.business_id)
        .where(Business.territory_id == territory_id)
        .group_by(BusinessProfile.lead_status)
    )
    lead_distribution = [
        LeadCount(status=row[0], count=row[1]) for row in lead_result.all()
    ]

    # Promedio score
    avg_result = await db.execute(
        select(func.avg(BusinessProfile.opportunity_score))
        .join(Business, Business.id == BusinessProfile.business_id)
        .where(Business.territory_id == territory_id)
    )
    avg_score = avg_result.scalar()

    return TerritoryStatsResponse(
        territory_id=territory_id,
        territory_name=territory.name,
        total_businesses=total,
        total_enriched=total_enriched,
        categories=categories,
        lead_distribution=lead_distribution,
        avg_opportunity_score=round(avg_score, 1) if avg_score else None,
    )


@router.get("/subcategories")
async def get_subcategories_global(
    category: str | None = None,
    territory_id: int | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Obtener subcategorias, opcionalmente filtradas por categoria y/o territorio."""
    query = select(Business.category, Business.subcategory, func.count(Business.id))
    if territory_id:
        query = query.where(Business.territory_id == territory_id)
    if category:
        query = query.where(Business.category == category)
    query = query.group_by(Business.category, Business.subcategory).order_by(func.count(Business.id).desc())
    result = await db.execute(query)
    return [{"category": r[0], "subcategory": r[1], "count": r[2]} for r in result.all()]


@router.get("/territory/{territory_id}/subcategories")
async def get_subcategories(
    territory_id: int,
    category: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Obtener subcategorias de un territorio, opcionalmente filtradas por categoria."""
    query = select(Business.category, Business.subcategory, func.count(Business.id)).where(
        Business.territory_id == territory_id
    )
    if category:
        query = query.where(Business.category == category)
    query = query.group_by(Business.category, Business.subcategory).order_by(func.count(Business.id).desc())
    result = await db.execute(query)
    return [{"category": r[0], "subcategory": r[1], "count": r[2]} for r in result.all()]


class GlobalStatsResponse(BaseModel):
    total_territories: int
    total_businesses: int
    total_enriched: int
    categories: list[CategoryCount]
    lead_distribution: list[LeadCount]
    avg_opportunity_score: float | None


@router.get("/global", response_model=GlobalStatsResponse)
async def get_global_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Obtener estadisticas globales de todos los territorios."""
    # Total territories
    territory_count = await db.execute(select(func.count(Territory.id)))
    total_territories = territory_count.scalar()

    # Total businesses
    biz_count = await db.execute(select(func.count(Business.id)))
    total_businesses = biz_count.scalar()

    # Categories
    cat_result = await db.execute(
        select(Business.category, func.count(Business.id))
        .group_by(Business.category)
        .order_by(func.count(Business.id).desc())
    )
    categories = [
        CategoryCount(category=row[0] or "sin_categoria", count=row[1])
        for row in cat_result.all()
    ]

    # Enriched count
    enriched_result = await db.execute(select(func.count(BusinessProfile.id)))
    total_enriched = enriched_result.scalar()

    # Lead distribution
    lead_result = await db.execute(
        select(BusinessProfile.lead_status, func.count(BusinessProfile.id))
        .group_by(BusinessProfile.lead_status)
    )
    lead_distribution = [
        LeadCount(status=row[0], count=row[1]) for row in lead_result.all()
    ]

    # Average opportunity score
    avg_result = await db.execute(
        select(func.avg(BusinessProfile.opportunity_score))
    )
    avg_score = avg_result.scalar()

    return GlobalStatsResponse(
        total_territories=total_territories,
        total_businesses=total_businesses,
        total_enriched=total_enriched,
        categories=categories,
        lead_distribution=lead_distribution,
        avg_opportunity_score=round(avg_score, 1) if avg_score else None,
    )


class SubcategoryCount(BaseModel):
    subcategory: str
    count: int


class HealthStatsResponse(BaseModel):
    total_health: int
    total_enriched: int
    subcategories: list[SubcategoryCount]
    lead_distribution: list[LeadCount]
    avg_opportunity_score: float | None
    sources: list[CategoryCount]


@router.get("/health", response_model=HealthStatsResponse)
async def get_health_stats(
    territory_id: int | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Estadisticas especificas del nicho salud."""
    base_filter = Business.category == "salud"
    if territory_id:
        base_filter = base_filter & (Business.territory_id == territory_id)

    # Total salud
    total_result = await db.execute(
        select(func.count(Business.id)).where(base_filter)
    )
    total_health = total_result.scalar()

    # Subcategorias
    sub_result = await db.execute(
        select(Business.subcategory, func.count(Business.id))
        .where(base_filter)
        .group_by(Business.subcategory)
        .order_by(func.count(Business.id).desc())
    )
    subcategories = [
        SubcategoryCount(subcategory=row[0] or "otro", count=row[1])
        for row in sub_result.all()
    ]

    # Enriched
    enriched_result = await db.execute(
        select(func.count(BusinessProfile.id))
        .join(Business, Business.id == BusinessProfile.business_id)
        .where(base_filter)
    )
    total_enriched = enriched_result.scalar()

    # Leads
    lead_result = await db.execute(
        select(BusinessProfile.lead_status, func.count(BusinessProfile.id))
        .join(Business, Business.id == BusinessProfile.business_id)
        .where(base_filter)
        .group_by(BusinessProfile.lead_status)
    )
    lead_distribution = [
        LeadCount(status=row[0], count=row[1]) for row in lead_result.all()
    ]

    # Avg score
    avg_result = await db.execute(
        select(func.avg(BusinessProfile.opportunity_score))
        .join(Business, Business.id == BusinessProfile.business_id)
        .where(base_filter)
    )
    avg_score = avg_result.scalar()

    # Sources
    source_result = await db.execute(
        select(Business.source, func.count(Business.id))
        .where(base_filter)
        .group_by(Business.source)
        .order_by(func.count(Business.id).desc())
    )
    sources = [
        CategoryCount(category=row[0] or "unknown", count=row[1])
        for row in source_result.all()
    ]

    return HealthStatsResponse(
        total_health=total_health,
        total_enriched=total_enriched,
        subcategories=subcategories,
        lead_distribution=lead_distribution,
        avg_opportunity_score=round(avg_score, 1) if avg_score else None,
        sources=sources,
    )
