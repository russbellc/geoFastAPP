from datetime import datetime, timezone

from sqlalchemy import DateTime, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Competitor(Base):
    __tablename__ = "competitors"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(String(50), default="saas_salud")
    country: Mapped[str | None] = mapped_column(String(100))
    markets: Mapped[dict | None] = mapped_column(JSON)  # ["peru", "colombia", ...]
    website: Mapped[str | None] = mapped_column(String(500))
    instagram_url: Mapped[str | None] = mapped_column(String(500))
    tiktok_url: Mapped[str | None] = mapped_column(String(500))
    facebook_url: Mapped[str | None] = mapped_column(String(500))
    linkedin_url: Mapped[str | None] = mapped_column(String(500))
    followers: Mapped[int | None] = mapped_column(Integer)
    engagement_rate: Mapped[float | None] = mapped_column()
    posting_frequency: Mapped[str | None] = mapped_column(String(50))  # daily, weekly, etc.
    content_strategy: Mapped[dict | None] = mapped_column(JSON)
    target_markets: Mapped[dict | None] = mapped_column(JSON)
    ai_analysis: Mapped[str | None] = mapped_column(Text)
    gap_vs_liaflow: Mapped[str | None] = mapped_column(Text)
    last_scanned_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
