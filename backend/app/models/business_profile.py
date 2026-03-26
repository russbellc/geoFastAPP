from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class BusinessProfile(Base):
    __tablename__ = "business_profiles"

    id: Mapped[int] = mapped_column(primary_key=True)
    business_id: Mapped[int] = mapped_column(
        ForeignKey("businesses.id"), unique=True, nullable=False
    )

    # Servicios y tech
    services: Mapped[str | None] = mapped_column(Text, nullable=True)
    tech_stack: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Deteccion web
    has_online_booking: Mapped[bool] = mapped_column(Boolean, default=False)
    has_chatbot: Mapped[bool] = mapped_column(Boolean, default=False)
    seo_score: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Redes sociales
    facebook_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    instagram_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    tiktok_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    facebook_followers: Mapped[int | None] = mapped_column(Integer, nullable=True)
    instagram_followers: Mapped[int | None] = mapped_column(Integer, nullable=True)
    tiktok_followers: Mapped[int | None] = mapped_column(Integer, nullable=True)
    last_post_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # IA y scoring
    ai_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    opportunity_score: Mapped[int | None] = mapped_column(Integer, nullable=True)  # 0-100
    lead_status: Mapped[str] = mapped_column(
        String(10), default="cold"
    )  # cold / warm / hot

    enriched_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    business = relationship("Business", back_populates="profile")
