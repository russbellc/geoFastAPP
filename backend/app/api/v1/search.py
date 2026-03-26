from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.business import Business
from app.models.business_embedding import BusinessEmbedding
from app.models.user import User
from app.schemas.business import BusinessResponse
from app.services.embeddings import generate_embedding

router = APIRouter(prefix="/search", tags=["Search"])


class SemanticSearchRequest(BaseModel):
    query: str
    limit: int = 10


class SemanticSearchResponse(BaseModel):
    query: str
    results: list[BusinessResponse]


@router.post("/semantic", response_model=SemanticSearchResponse)
async def semantic_search(
    data: SemanticSearchRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Buscar negocios en lenguaje natural usando embeddings."""
    query_embedding = generate_embedding(data.query)

    # Busqueda por distancia coseno con pgvector
    result = await db.execute(
        select(Business)
        .join(BusinessEmbedding, Business.id == BusinessEmbedding.business_id)
        .order_by(BusinessEmbedding.embedding.cosine_distance(query_embedding))
        .limit(data.limit)
    )
    businesses = result.scalars().all()

    return SemanticSearchResponse(query=data.query, results=businesses)
