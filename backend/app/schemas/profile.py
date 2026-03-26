from datetime import datetime

from pydantic import BaseModel


class BusinessProfileResponse(BaseModel):
    id: int
    business_id: int
    services: str | None
    tech_stack: dict | None
    has_online_booking: bool
    has_chatbot: bool
    seo_score: int | None
    facebook_url: str | None
    instagram_url: str | None
    tiktok_url: str | None
    facebook_followers: int | None
    instagram_followers: int | None
    tiktok_followers: int | None
    last_post_date: datetime | None
    ai_summary: str | None
    opportunity_score: int | None
    lead_status: str
    enriched_at: datetime | None

    model_config = {"from_attributes": True}
