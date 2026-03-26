from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.business import Business
from app.models.user import User
from app.schemas.business import BusinessListResponse, BusinessResponse

router = APIRouter(prefix="/businesses", tags=["Businesses"])


@router.get("", response_model=BusinessListResponse)
async def list_businesses(
    territory_id: int | None = Query(None, description="Filtrar por territorio"),
    category: str | None = Query(None, description="Filtrar por categoria"),
    page: int = Query(1, ge=1, description="Pagina"),
    per_page: int = Query(20, ge=1, le=100, description="Resultados por pagina"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Listar negocios con filtros y paginacion."""
    query = select(Business)
    count_query = select(func.count(Business.id))

    if territory_id:
        query = query.where(Business.territory_id == territory_id)
        count_query = count_query.where(Business.territory_id == territory_id)

    if category:
        query = query.where(Business.category == category)
        count_query = count_query.where(Business.category == category)

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
