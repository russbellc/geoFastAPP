import asyncio
import logging

import httpx

logger = logging.getLogger(__name__)

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

# Tags OSM que representan negocios/establecimientos
BUSINESS_TAGS = [
    "amenity",
    "shop",
    "healthcare",
    "office",
    "tourism",
    "craft",
    "leisure",
]


class OverpassClient:
    """Cliente para Overpass API (OpenStreetMap)."""

    def __init__(self):
        self._last_request_time = 0.0
        self._min_interval = 2.0  # segundos entre requests

    async def _rate_limit(self):
        now = asyncio.get_event_loop().time()
        elapsed = now - self._last_request_time
        if elapsed < self._min_interval:
            await asyncio.sleep(self._min_interval - elapsed)
        self._last_request_time = asyncio.get_event_loop().time()

    async def _execute_query(self, query: str) -> dict:
        max_retries = 3
        backoff_times = [5, 15, 45]  # exponential backoff in seconds

        for attempt in range(max_retries):
            try:
                await self._rate_limit()
                async with httpx.AsyncClient(timeout=90.0) as client:
                    response = await client.post(
                        OVERPASS_URL,
                        data={"data": query},
                    )
                    response.raise_for_status()
                    return response.json()
            except (httpx.HTTPStatusError, httpx.RequestError, httpx.TimeoutException) as e:
                if attempt < max_retries - 1:
                    wait_time = backoff_times[attempt]
                    logger.warning(
                        f"Overpass query failed (attempt {attempt + 1}/{max_retries}): {e}. "
                        f"Retrying in {wait_time}s..."
                    )
                    await asyncio.sleep(wait_time)
                else:
                    logger.error(
                        f"Overpass query failed after {max_retries} attempts: {e}"
                    )
                    raise

    def _build_query(self, area_filter: str) -> str:
        """Construye query Overpass para extraer negocios."""
        tag_filters = ""
        for tag in BUSINESS_TAGS:
            tag_filters += f'  node["{tag}"]{area_filter};\n'
            tag_filters += f'  way["{tag}"]{area_filter};\n'

        return f"""
[out:json][timeout:60];
(
{tag_filters});
out center meta;
"""

    async def query_by_radius(
        self, lat: float, lng: float, radius_m: int
    ) -> list[dict]:
        """Escanea negocios en un radio desde un punto."""
        area_filter = f"(around:{radius_m},{lat},{lng})"
        query = self._build_query(area_filter)
        logger.info(f"Overpass query: radio {radius_m}m desde ({lat}, {lng})")
        data = await self._execute_query(query)
        return self._parse_elements(data.get("elements", []))

    async def query_by_bbox(
        self, south: float, west: float, north: float, east: float
    ) -> list[dict]:
        """Escanea negocios en un bounding box."""
        area_filter = f"({south},{west},{north},{east})"
        query = self._build_query(area_filter)
        logger.info(f"Overpass query: bbox ({south},{west},{north},{east})")
        data = await self._execute_query(query)
        return self._parse_elements(data.get("elements", []))

    async def query_by_polygon(self, coords: list[list[float]]) -> list[dict]:
        """Escanea negocios dentro de un poligono.

        Args:
            coords: Lista de [lat, lng] que forman el poligono.
        """
        # Formato Overpass poly: "lat1 lng1 lat2 lng2 ..."
        poly_str = " ".join(f"{c[0]} {c[1]}" for c in coords)
        area_filter = f'(poly:"{poly_str}")'
        query = self._build_query(area_filter)
        logger.info(f"Overpass query: poligono con {len(coords)} puntos")
        data = await self._execute_query(query)
        return self._parse_elements(data.get("elements", []))

    def _parse_elements(self, elements: list[dict]) -> list[dict]:
        """Parsea elementos OSM crudos a formato normalizado."""
        businesses = []
        for el in elements:
            tags = el.get("tags", {})
            name = tags.get("name")
            if not name:
                continue  # ignorar elementos sin nombre

            # Coordenadas: nodos tienen lat/lon directo, ways tienen center
            lat = el.get("lat") or el.get("center", {}).get("lat")
            lng = el.get("lon") or el.get("center", {}).get("lon")
            if not lat or not lng:
                continue

            businesses.append({
                "osm_id": f"{el['type']}/{el['id']}",
                "name": name,
                "lat": lat,
                "lng": lng,
                "address": self._build_address(tags),
                "phone": tags.get("phone") or tags.get("contact:phone"),
                "website": tags.get("website") or tags.get("contact:website"),
                "email": tags.get("email") or tags.get("contact:email"),
                "tags": tags,
            })

        logger.info(f"Overpass: {len(elements)} elementos -> {len(businesses)} negocios con nombre")
        return businesses

    def _build_address(self, tags: dict) -> str | None:
        parts = []
        if tags.get("addr:street"):
            street = tags["addr:street"]
            if tags.get("addr:housenumber"):
                street += f" {tags['addr:housenumber']}"
            parts.append(street)
        if tags.get("addr:city"):
            parts.append(tags["addr:city"])
        return ", ".join(parts) if parts else None
