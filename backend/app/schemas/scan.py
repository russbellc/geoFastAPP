from datetime import datetime

from pydantic import BaseModel, model_validator


class ScanRequest(BaseModel):
    name: str
    city: str
    country: str
    # Modo radio
    lat: float | None = None
    lng: float | None = None
    radius_km: float | None = None
    # Modo poligono
    polygon: list[list[float]] | None = None  # [[lat, lng], ...]
    nicho: str | None = None

    @model_validator(mode="after")
    def validate_mode(self):
        has_radio = self.lat is not None and self.lng is not None and self.radius_km is not None
        has_polygon = self.polygon is not None and len(self.polygon) >= 3
        if not has_radio and not has_polygon:
            raise ValueError("Debe especificar lat/lng/radius_km o polygon con al menos 3 puntos")
        return self


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
