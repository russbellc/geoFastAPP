from pydantic import BaseModel


class TerritoryCreate(BaseModel):
    name: str
    city: str
    country: str
    lat: float | None = None
    lng: float | None = None
    radius_km: float | None = None
