from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.business import Business
from app.models.business_profile import BusinessProfile
from app.models.user import User
from app.schemas.business import BusinessListResponse, BusinessResponse
from app.schemas.profile import BusinessProfileResponse
from app.workers.enrich_tasks import enrich_business, enrich_territory

router = APIRouter(prefix="/businesses", tags=["Businesses"])


@router.get("", response_model=BusinessListResponse)
async def list_businesses(
    territory_id: int | None = Query(None, description="Filtrar por territorio"),
    category: str | None = Query(None, description="Filtrar por categoria"),
    subcategory: str | None = Query(None, description="Filtrar por subcategoria"),
    search: str | None = Query(None, description="Buscar por nombre"),
    page: int = Query(1, ge=1, description="Pagina"),
    per_page: int = Query(20, ge=1, le=1000, description="Resultados por pagina"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Listar negocios con filtros, busqueda y paginacion."""
    query = select(Business)
    count_query = select(func.count(Business.id))

    if territory_id:
        query = query.where(Business.territory_id == territory_id)
        count_query = count_query.where(Business.territory_id == territory_id)

    if category:
        query = query.where(Business.category == category)
        count_query = count_query.where(Business.category == category)

    if subcategory:
        query = query.where(Business.subcategory == subcategory)
        count_query = count_query.where(Business.subcategory == subcategory)

    if search:
        query = query.where(Business.name.ilike(f"%{search}%"))
        count_query = count_query.where(Business.name.ilike(f"%{search}%"))

    # Total
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Paginacion
    offset = (page - 1) * per_page
    query = query.offset(offset).limit(per_page).order_by(Business.id)

    result = await db.execute(query)
    businesses = result.scalars().all()

    return BusinessListResponse(
        items=businesses,
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get("/{business_id}/profile", response_model=BusinessProfileResponse)
async def get_business_profile(
    business_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Obtener perfil enriquecido de un negocio."""
    result = await db.execute(
        select(BusinessProfile).where(BusinessProfile.business_id == business_id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Perfil no encontrado. Lanza el enriquecimiento primero.",
        )
    return profile


@router.post("/{business_id}/enrich", status_code=status.HTTP_202_ACCEPTED)
async def enrich_single_business(
    business_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lanzar enriquecimiento de un negocio individual."""
    result = await db.execute(select(Business).where(Business.id == business_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Negocio no encontrado")
    enrich_business.delay(business_id)
    return {"message": "Enriquecimiento lanzado", "business_id": business_id}


@router.post("/enrich/territory/{territory_id}", status_code=status.HTTP_202_ACCEPTED)
async def enrich_all_territory(
    territory_id: int,
    current_user: User = Depends(get_current_user),
):
    """Lanzar enriquecimiento masivo de todos los negocios de un territorio."""
    enrich_territory.delay(territory_id)
    return {"message": "Enriquecimiento masivo lanzado", "territory_id": territory_id}
