"""Google Maps Scraper — extrae negocios con precauciones anti-deteccion.

Precauciones:
- Rate limit 8-15s aleatorio entre requests
- Rotacion de User-Agents reales
- Viewport aleatorio
- Delays humanos (scroll, espera)
- Sesiones cortas (max 30 resultados)
- Playwright con contexto limpio por sesion
"""

import asyncio
import logging
import random
import re

from playwright.async_api import async_playwright, Page, BrowserContext

logger = logging.getLogger(__name__)

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
]

VIEWPORTS = [
    {"width": 1366, "height": 768},
    {"width": 1920, "height": 1080},
    {"width": 1536, "height": 864},
    {"width": 1440, "height": 900},
    {"width": 1280, "height": 720},
]

# Delay humano aleatorio
async def human_delay(min_s: float = 1.0, max_s: float = 3.0):
    await asyncio.sleep(random.uniform(min_s, max_s))

# Delay entre requests (rate limit)
async def rate_limit_delay():
    delay = random.uniform(8, 15)
    logger.info(f"GMaps: rate limit delay {delay:.1f}s")
    await asyncio.sleep(delay)


class GMapsResult:
    """Resultado parseado de un negocio de Google Maps."""
    def __init__(self):
        self.name: str | None = None
        self.address: str | None = None
        self.phone: str | None = None
        self.website: str | None = None
        self.rating: float | None = None
        self.reviews_count: int | None = None
        self.category: str | None = None
        self.lat: float | None = None
        self.lng: float | None = None
        self.hours: str | None = None
        self.photo_url: str | None = None
        self.plus_code: str | None = None
        self.gmaps_url: str | None = None

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "address": self.address,
            "phone": self.phone,
            "website": self.website,
            "rating": self.rating,
            "reviews_count": self.reviews_count,
            "category": self.category,
            "lat": self.lat,
            "lng": self.lng,
            "hours": self.hours,
            "gmaps_url": self.gmaps_url,
            "source": "google_maps",
        }


class GMapsScraper:
    """Scraper de Google Maps con precauciones anti-deteccion."""

    def __init__(self, headless: bool = True, max_results: int = 30):
        self.headless = headless
        self.max_results = max_results

    async def search(self, query: str, location: str) -> list[dict]:
        """Busca negocios en Google Maps.

        Args:
            query: Tipo de negocio (ej. "clinicas", "farmacias")
            location: Ciudad/zona (ej. "Cusco Wanchaq")

        Returns:
            Lista de negocios encontrados
        """
        search_term = f"{query} en {location}"
        results: list[dict] = []

        async with async_playwright() as p:
            ua = random.choice(USER_AGENTS)
            vp = random.choice(VIEWPORTS)

            browser = await p.chromium.launch(
                headless=self.headless,
                args=[
                    "--disable-blink-features=AutomationControlled",
                    "--disable-dev-shm-usage",
                    "--no-sandbox",
                ]
            )

            context = await browser.new_context(
                user_agent=ua,
                viewport=vp,
                locale="es-PE",
                timezone_id="America/Lima",
                geolocation={"latitude": -13.52, "longitude": -71.97},
                permissions=["geolocation"],
            )

            # Anti-detection: remove webdriver flag
            await context.add_init_script("""
                Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
                Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
                window.chrome = { runtime: {} };
            """)

            page = await context.new_page()

            try:
                # Navigate to Google Maps
                logger.info(f"GMaps: searching '{search_term}'")
                await page.goto("https://www.google.com/maps", wait_until="networkidle", timeout=30000)
                await human_delay(2, 4)

                # Accept cookies if shown
                try:
                    accept_btn = page.locator("button:has-text('Aceptar todo'), button:has-text('Accept all')")
                    if await accept_btn.count() > 0:
                        await accept_btn.first.click()
                        await human_delay(1, 2)
                except Exception:
                    pass

                # Type search query
                search_box = page.locator("#searchboxinput")
                await search_box.click()
                await human_delay(0.5, 1)

                # Type like a human (character by character with small delays)
                for char in search_term:
                    await search_box.type(char, delay=random.randint(50, 150))

                await human_delay(0.5, 1)
                await page.keyboard.press("Enter")
                await human_delay(3, 5)

                # Wait for results to load
                await page.wait_for_load_state("networkidle", timeout=15000)
                await human_delay(2, 3)

                # Scroll through results panel to load more
                results_panel = page.locator('div[role="feed"]')
                if await results_panel.count() > 0:
                    results = await self._extract_list_results(page, results_panel)
                else:
                    # Single result (direct to place page)
                    single = await self._extract_single_result(page)
                    if single:
                        results = [single]

            except Exception as e:
                logger.error(f"GMaps scrape error: {e}")
            finally:
                await context.close()
                await browser.close()

        logger.info(f"GMaps: found {len(results)} results for '{search_term}'")
        return results

    async def _extract_list_results(self, page: Page, feed) -> list[dict]:
        """Extrae resultados de la lista de busqueda."""
        results: list[dict] = []
        seen_names: set[str] = set()

        # Scroll to load results
        for scroll_i in range(5):  # max 5 scrolls
            if len(results) >= self.max_results:
                break

            # Get all result links
            items = await feed.locator('a[href*="/maps/place/"]').all()

            for item in items:
                if len(results) >= self.max_results:
                    break

                try:
                    name = await item.get_attribute("aria-label")
                    if not name or name in seen_names:
                        continue
                    seen_names.add(name)

                    # Click to open detail panel
                    await item.click()
                    await human_delay(2, 4)

                    result = await self._extract_detail_from_panel(page, name)
                    if result:
                        results.append(result)
                        logger.info(f"GMaps: extracted '{name}' ({len(results)}/{self.max_results})")

                    # Rate limit between each detail extraction
                    await rate_limit_delay()

                except Exception as e:
                    logger.debug(f"GMaps: error extracting item: {e}")
                    continue

            # Scroll down in results panel
            try:
                await feed.evaluate("el => el.scrollTop = el.scrollHeight")
                await human_delay(2, 3)
            except Exception:
                break

        return results

    async def _extract_detail_from_panel(self, page: Page, name: str) -> dict | None:
        """Extrae datos del panel de detalle de un negocio."""
        result = GMapsResult()
        result.name = name

        try:
            # URL (contains coordinates)
            url = page.url
            result.gmaps_url = url
            coords = self._extract_coords_from_url(url)
            if coords:
                result.lat, result.lng = coords

            # Address
            try:
                addr_el = page.locator('button[data-item-id="address"] div.fontBodyMedium, [data-item-id="address"]')
                if await addr_el.count() > 0:
                    result.address = await addr_el.first.inner_text()
            except Exception:
                pass

            # Phone
            try:
                phone_el = page.locator('button[data-item-id*="phone"] div.fontBodyMedium, [data-tooltip="Copiar el numero de telefono"]')
                if await phone_el.count() > 0:
                    text = await phone_el.first.inner_text()
                    result.phone = self._clean_phone(text)
            except Exception:
                pass

            # Website
            try:
                web_el = page.locator('a[data-item-id="authority"] div.fontBodyMedium, [data-tooltip="Abrir el sitio web"]')
                if await web_el.count() > 0:
                    result.website = await web_el.first.inner_text()
                    if result.website and not result.website.startswith("http"):
                        result.website = f"https://{result.website}"
            except Exception:
                pass

            # Category
            try:
                cat_el = page.locator('button[jsaction*="category"] span')
                if await cat_el.count() > 0:
                    result.category = await cat_el.first.inner_text()
            except Exception:
                pass

            # Rating
            try:
                rating_el = page.locator('div.fontDisplayLarge')
                if await rating_el.count() > 0:
                    text = await rating_el.first.inner_text()
                    try:
                        result.rating = float(text.replace(",", "."))
                    except ValueError:
                        pass
            except Exception:
                pass

            # Reviews count
            try:
                reviews_el = page.locator('span:has-text("opinion"), span:has-text("review")')
                if await reviews_el.count() > 0:
                    text = await reviews_el.first.inner_text()
                    nums = re.findall(r"[\d.,]+", text.replace("\u00a0", ""))
                    if nums:
                        result.reviews_count = int(nums[0].replace(".", "").replace(",", ""))
            except Exception:
                pass

            # Hours
            try:
                hours_el = page.locator('[data-item-id*="oh"] div.fontBodyMedium')
                if await hours_el.count() > 0:
                    result.hours = await hours_el.first.inner_text()
            except Exception:
                pass

            if result.name:
                return result.to_dict()

        except Exception as e:
            logger.debug(f"GMaps: error extracting detail: {e}")

        return None

    async def _extract_single_result(self, page: Page) -> dict | None:
        """Extrae datos cuando la busqueda lleva directo a un lugar."""
        try:
            name_el = page.locator("h1")
            if await name_el.count() > 0:
                name = await name_el.first.inner_text()
                return await self._extract_detail_from_panel(page, name)
        except Exception:
            pass
        return None

    def _extract_coords_from_url(self, url: str) -> tuple[float, float] | None:
        """Extrae coordenadas de la URL de Google Maps."""
        # Pattern: @-13.5245942,-71.9514898,17z
        match = re.search(r"@(-?\d+\.\d+),(-?\d+\.\d+)", url)
        if match:
            return float(match.group(1)), float(match.group(2))

        # Pattern in data parameter: !3d-13.5245942!4d-71.9514898
        match = re.search(r"!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)", url)
        if match:
            return float(match.group(1)), float(match.group(2))

        return None

    def _clean_phone(self, phone: str | None) -> str | None:
        if not phone:
            return None
        cleaned = re.sub(r"[^\d+\s()-]", "", phone).strip()
        return cleaned if len(cleaned) >= 7 else None
