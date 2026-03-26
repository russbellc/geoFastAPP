from pydantic import BaseModel


class TerritoryCreate(BaseModel):
    name: str
    city: str
    country: str
    lat: float
    lng: float
    radius_km: float = 1.0  # radio en kilometros
