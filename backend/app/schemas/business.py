from datetime import datetime

from pydantic import BaseModel


class BusinessResponse(BaseModel):
    id: int
    territory_id: int
    name: str
    category: str | None
    subcategory: str | None
    lat: float | None
    lng: float | None
    address: str | None
    phone: str | None
    website: str | None
    email: str | None
    source: str
    osm_id: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class BusinessListResponse(BaseModel):
    items: list[BusinessResponse]
    total: int
    page: int
    per_page: int
