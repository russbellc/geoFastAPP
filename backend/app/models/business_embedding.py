from pgvector.sqlalchemy import Vector
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class BusinessEmbedding(Base):
    __tablename__ = "business_embeddings"

    id: Mapped[int] = mapped_column(primary_key=True)
    business_id: Mapped[int] = mapped_column(
        ForeignKey("businesses.id"), unique=True, nullable=False
    )
    embedding = mapped_column(Vector(384), nullable=False)  # paraphrase-multilingual-MiniLM-L12-v2
