"""Scraper para Doctoralia Peru — extrae profesionales y centros de salud."""

import logging
import re

import httpx
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

DOCTORALIA_BASE = "https://www.doctoralia.pe"

# Especialidades a escanear
HEALTH_SPECIALTIES = [
    "medico-general",
    "ginecologo",
    "dermatologo",
    "psicologo",
    "dentista",
    "pediatra",
    "oftalmologo",
    "traumatologo",
    "cardiologo",
    "nutricionista",
    "fisioterapeuta",
    "urologo",
    "otorrinolaringologo",
    "neurologo",
    "endocrinologo",
]

# Mapeo de especialidad Doctoralia -> subcategoria interna
SPECIALTY_TO_SUBCATEGORY: dict[str, str] = {
    "medico-general": "consultorio",
    "ginecologo": "ginecologia",
    "dermatologo": "dermatologia",
    "psicologo": "psicologia",
    "dentista": "dentista",
    "pediatra": "pediatria",
    "oftalmologo": "oftalmologia",
    "traumatologo": "traumatologia",
    "cardiologo": "cardiologia",
    "nutricionista": "nutricion",
    "fisioterapeuta": "fisioterapia",
    "urologo": "urologia",
    "otorrinolaringologo": "otorrinolaringologia",
    "neurologo": "neurologia",
    "endocrinologo": "endocrinologia",
}


class DoctoraliaClient:
    """Scraper para Doctoralia Peru."""

    def __init__(self):
        self._headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                          "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept-Language": "es-PE,es;q=0.9",
        }

    async def search_by_city(
        self, city: str, specialties: list[str] | None = None, max_pages: int = 3
    ) -> list[dict]:
        """Busca profesionales/centros en una ciudad.

        Returns:
            Lista de dicts con: name, specialty, subcategory, address, phone, website, lat, lng
        """
        specs = specialties or HEALTH_SPECIALTIES
        all_results: list[dict] = []

        async with httpx.AsyncClient(timeout=30.0, headers=self._headers, follow_redirects=True) as client:
            for specialty in specs:
                city_slug = city.lower().replace(" ", "-")
                for page in range(1, max_pages + 1):
                    try:
                        url = f"{DOCTORALIA_BASE}/{specialty}/{city_slug}"
                        if page > 1:
                            url += f"?page={page}"

                        logger.info(f"Doctoralia: scraping {url}")
                        response = await client.get(url)

                        if response.status_code != 200:
                            logger.warning(f"Doctoralia: {response.status_code} for {url}")
                            break

                        results = self._parse_listing(
                            response.text,
                            specialty,
                            city,
                        )

                        if not results:
                            break

                        all_results.extend(results)
                        logger.info(f"Doctoralia: {len(results)} results from {url}")

                    except Exception as e:
                        logger.error(f"Doctoralia error: {e}")
                        break

        logger.info(f"Doctoralia: total {len(all_results)} results for {city}")
        return all_results

    def _parse_listing(self, html: str, specialty: str, city: str) -> list[dict]:
        """Parsea la pagina de resultados de Doctoralia."""
        soup = BeautifulSoup(html, "html.parser")
        results: list[dict] = []

        # Doctoralia usa data-doctor-name o similar selectors
        cards = soup.select('[data-id]')
        if not cards:
            # Fallback: buscar por estructura comun
            cards = soup.select('.card, .search-result, [itemtype*="Physician"]')

        for card in cards:
            try:
                # Nombre
                name_el = card.select_one('h3, h2, [data-doctor-name], [itemprop="name"]')
                if not name_el:
                    continue
                name = name_el.get_text(strip=True)
                if not name or len(name) < 3:
                    continue

                # Direccion
                addr_el = card.select_one('[itemprop="address"], .address, .text-muted')
                address = addr_el.get_text(strip=True) if addr_el else None

                # Telefono
                phone_el = card.select_one('[itemprop="telephone"], a[href^="tel:"]')
                phone = None
                if phone_el:
                    phone = phone_el.get("href", "").replace("tel:", "") or phone_el.get_text(strip=True)

                # Website / perfil
                link_el = card.select_one('a[href*="/doctor/"], a[href*="/clinica/"]')
                profile_url = None
                if link_el and link_el.get("href"):
                    href = link_el["href"]
                    if href.startswith("/"):
                        profile_url = f"{DOCTORALIA_BASE}{href}"
                    elif href.startswith("http"):
                        profile_url = href

                subcategory = SPECIALTY_TO_SUBCATEGORY.get(specialty, specialty)

                results.append({
                    "name": name,
                    "category": "salud",
                    "subcategory": subcategory,
                    "address": address,
                    "phone": self._clean_phone(phone),
                    "website": profile_url,
                    "email": None,
                    "source": "doctoralia",
                    "source_specialty": specialty,
                    "city": city,
                    "lat": None,
                    "lng": None,
                })

            except Exception as e:
                logger.debug(f"Doctoralia parse error: {e}")
                continue

        return results

    def _clean_phone(self, phone: str | None) -> str | None:
        if not phone:
            return None
        cleaned = re.sub(r"[^\d+]", "", phone)
        return cleaned if len(cleaned) >= 7 else None
