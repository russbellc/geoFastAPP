"""Google Maps Scraper — extrae negocios via URL directa de busqueda.

Estrategia: navegar a google.com/maps/search/{query} en vez de usar el input box.
Esto es mas confiable y evita problemas con selectores del search box.
"""

import asyncio
import logging
import random
import re
from urllib.parse import quote

from playwright.async_api import async_playwright, Page

logger = logging.getLogger(__name__)

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
]

async def human_delay(min_s: float = 1.0, max_s: float = 3.0):
    await asyncio.sleep(random.uniform(min_s, max_s))

async def rate_limit_delay():
    delay = random.uniform(8, 15)
    logger.info(f"GMaps: rate limit delay {delay:.1f}s")
    await asyncio.sleep(delay)


class GMapsScraper:
    def __init__(self, headless: bool = True, max_results: int = 20):
        self.headless = headless
        self.max_results = max_results

    async def search(self, query: str, location: str) -> list[dict]:
        """Busca negocios en Google Maps via URL directa."""
        search_term = f"{query} en {location}"
        search_url = f"https://www.google.com/maps/search/{quote(search_term)}"
        results: list[dict] = []

        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=self.headless,
                args=["--no-sandbox", "--disable-blink-features=AutomationControlled"],
            )
            context = await browser.new_context(
                user_agent=random.choice(USER_AGENTS),
                viewport={"width": random.choice([1366, 1920, 1536]), "height": random.choice([768, 1080, 864])},
                locale="es-PE",
                timezone_id="America/Lima",
            )
            await context.add_init_script("Object.defineProperty(navigator, 'webdriver', { get: () => undefined });")
            page = await context.new_page()

            try:
                logger.info(f"GMaps: navigating to search '{search_term}'")
                await page.goto(search_url, wait_until="domcontentloaded", timeout=30000)
                await human_delay(3, 5)

                # Check: did we land on a single result or a list?
                url = page.url
                if "/maps/place/" in url:
                    # Single result - extract directly
                    logger.info("GMaps: single result detected")
                    result = await self._extract_from_place_page(page)
                    if result:
                        results.append(result)
                else:
                    # List of results
                    results = await self._extract_from_list(page)

            except Exception as e:
                logger.error(f"GMaps scrape error: {e}")
            finally:
                await context.close()
                await browser.close()

        logger.info(f"GMaps: found {len(results)} results for '{search_term}'")
        return results

    async def search_single(self, business_name: str, location: str) -> dict | None:
        """Busca un negocio especifico por nombre."""
        search_url = f"https://www.google.com/maps/search/{quote(f'{business_name} {location}')}"

        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=self.headless,
                args=["--no-sandbox", "--disable-blink-features=AutomationControlled"],
            )
            context = await browser.new_context(
                user_agent=random.choice(USER_AGENTS),
                locale="es-PE",
            )
            await context.add_init_script("Object.defineProperty(navigator, 'webdriver', { get: () => undefined });")
            page = await context.new_page()

            try:
                await page.goto(search_url, wait_until="domcontentloaded", timeout=30000)
                await human_delay(4, 6)

                if "/maps/place/" in page.url:
                    return await self._extract_from_place_page(page)
                else:
                    # Click first result from list
                    links = await page.locator('a[href*="/maps/place/"]').all()
                    if links:
                        await links[0].click()
                        await human_delay(3, 5)
                        return await self._extract_from_place_page(page)
            except Exception as e:
                logger.error(f"GMaps single search error: {e}")
            finally:
                await context.close()
                await browser.close()
        return None

    async def _extract_from_list(self, page: Page) -> list[dict]:
        """Extrae negocios de la lista de resultados."""
        results: list[dict] = []
        seen: set[str] = set()

        for scroll_round in range(3):
            if len(results) >= self.max_results:
                break

            links = await page.locator('a[href*="/maps/place/"]').all()
            logger.info(f"GMaps: scroll {scroll_round}, found {len(links)} links")

            for link in links:
                if len(results) >= self.max_results:
                    break
                try:
                    name = await link.get_attribute("aria-label")
                    if not name or name in seen:
                        continue
                    seen.add(name)

                    href = await link.get_attribute("href") or ""

                    # Extract coords from href
                    lat, lng = None, None
                    coords = self._extract_coords(href)
                    if coords:
                        lat, lng = coords

                    # Extract basic info from the card (without clicking)
                    result = {
                        "name": name,
                        "lat": lat,
                        "lng": lng,
                        "gmaps_url": href if href.startswith("http") else None,
                        "source": "google_maps",
                        "address": None,
                        "phone": None,
                        "website": None,
                        "rating": None,
                        "reviews_count": None,
                        "category": None,
                    }

                    # Try to get more info by clicking (with rate limit)
                    try:
                        await link.click()
                        await human_delay(2, 4)
                        detail = await self._extract_from_place_page(page)
                        if detail:
                            detail["name"] = name  # keep original name
                            result = detail
                    except Exception:
                        pass

                    results.append(result)
                    logger.info(f"GMaps: extracted '{name}' ({len(results)}/{self.max_results})")
                    await rate_limit_delay()

                except Exception as e:
                    logger.debug(f"GMaps: error on item: {e}")

            # Scroll to load more
            try:
                feed = page.locator('div[role="feed"]')
                if await feed.count() > 0:
                    await feed.evaluate("el => el.scrollTop = el.scrollHeight")
                    await human_delay(2, 3)
            except Exception:
                break

        return results

    async def _extract_from_place_page(self, page: Page) -> dict | None:
        """Extrae toda la info de la pagina de un lugar."""
        result = {
            "name": None, "address": None, "phone": None, "website": None,
            "rating": None, "reviews_count": None, "category": None,
            "lat": None, "lng": None, "hours": None, "gmaps_url": None,
            "source": "google_maps",
        }

        try:
            # URL + coords
            result["gmaps_url"] = page.url
            coords = self._extract_coords(page.url)
            if coords:
                result["lat"], result["lng"] = coords

            # Name
            try:
                h1s = await page.locator("h1").all()
                if h1s:
                    result["name"] = await h1s[0].inner_text()
            except Exception:
                pass

            # Get all text to parse
            body = await page.inner_text("body")

            # Address
            try:
                addr_buttons = await page.locator('button[data-item-id="address"]').all()
                if addr_buttons:
                    text = (await addr_buttons[0].text_content() or "").strip()
                    # Remove leading newlines/whitespace
                    lines = [l.strip() for l in text.split("\n") if l.strip()]
                    result["address"] = lines[-1] if lines else None
                if not result["address"]:
                    plus_match = re.search(r"([A-Z0-9]{4}\+[A-Z0-9]+,\s*[^\n]+)", body)
                    if plus_match:
                        result["address"] = plus_match.group(1)
            except Exception:
                pass

            # Phone
            try:
                phone_buttons = await page.locator('button[data-item-id*="phone"]').all()
                if phone_buttons:
                    text = await phone_buttons[0].inner_text()
                    cleaned = re.sub(r"[^\d+\s()-]", "", text).strip()
                    if len(cleaned) >= 7:
                        result["phone"] = cleaned
            except Exception:
                pass

            # Website
            try:
                web_links = await page.locator('a[data-item-id="authority"]').all()
                if web_links:
                    href = await web_links[0].get_attribute("href")
                    if href:
                        result["website"] = href
                else:
                    # Fallback
                    web_buttons = await page.locator('button:has-text("Sitio web"), a:has-text("Sitio web")').all()
                    if web_buttons:
                        text = await web_buttons[0].inner_text()
                        if "." in text:
                            result["website"] = f"https://{text.strip()}" if not text.startswith("http") else text
            except Exception:
                pass

            # Rating
            try:
                rating_match = re.search(r"(\d[.,]\d)\s*estrellas?\b", body)
                if not rating_match:
                    rating_el = page.locator('div.fontDisplayLarge, span.fontDisplayLarge')
                    if await rating_el.count() > 0:
                        text = await rating_el.first.inner_text()
                        rating_match = re.match(r"(\d[.,]\d)", text)
                if rating_match:
                    result["rating"] = float(rating_match.group(1).replace(",", "."))
            except Exception:
                pass

            # Reviews count
            try:
                rev_match = re.search(r"([\d.,]+)\s*(?:opinion|review|reseña)", body, re.IGNORECASE)
                if rev_match:
                    result["reviews_count"] = int(rev_match.group(1).replace(".", "").replace(",", ""))
            except Exception:
                pass

            # Category
            try:
                cat_btn = page.locator('button[jsaction*="category"]')
                if await cat_btn.count() > 0:
                    result["category"] = await cat_btn.first.inner_text()
            except Exception:
                pass

            # Hours
            try:
                hours_el = page.locator('[data-item-id*="oh"] .fontBodyMedium, [aria-label*="horario"]')
                if await hours_el.count() > 0:
                    result["hours"] = await hours_el.first.inner_text()
            except Exception:
                pass

            if result["name"]:
                return result

        except Exception as e:
            logger.debug(f"GMaps: place extract error: {e}")

        return None

    def _extract_coords(self, url: str) -> tuple[float, float] | None:
        match = re.search(r"@(-?\d+\.\d+),(-?\d+\.\d+)", url)
        if match:
            return float(match.group(1)), float(match.group(2))
        match = re.search(r"!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)", url)
        if match:
            return float(match.group(1)), float(match.group(2))
        return None
