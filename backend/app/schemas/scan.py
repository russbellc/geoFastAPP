from datetime import datetime

from pydantic import BaseModel

from app.schemas.territory import TerritoryCreate


class ScanRequest(TerritoryCreate):
    nicho: str | None = None


class ScanJobResponse(BaseModel):
    id: int
    territory_id: int
    nicho: str | None
    status: str
    total_found: int
    total_enriched: int
    started_at: datetime | None
    finished_at: datetime | None

    model_config = {"from_attributes": True}
