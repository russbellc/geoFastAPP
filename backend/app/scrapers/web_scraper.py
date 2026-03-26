import logging
import re

from bs4 import BeautifulSoup
from playwright.async_api import async_playwright

logger = logging.getLogger(__name__)

# Patrones para detectar tecnologias
TECH_PATTERNS = {
    "wordpress": [r"wp-content", r"wp-includes", r"wordpress"],
    "wix": [r"wix\.com", r"wixsite\.com", r"_wix_browser_sess"],
    "shopify": [r"cdn\.shopify\.com", r"shopify\.com"],
    "squarespace": [r"squarespace\.com", r"sqsp\.net"],
    "joomla": [r"/media/jui/", r"joomla"],
    "drupal": [r"drupal\.js", r"sites/default/files"],
    "react": [r"react\.production", r"__NEXT_DATA__", r"_next/"],
    "angular": [r"ng-version", r"angular\.js"],
    "vue": [r"vue\.js", r"__vue__"],
    "bootstrap": [r"bootstrap\.min\.(css|js)"],
    "tailwind": [r"tailwindcss", r"tw-"],
}

# Patrones para detectar agenda online
BOOKING_PATTERNS = [
    r"calendly\.com",
    r"booksy\.com",
    r"reservio\.com",
    r"acuityscheduling\.com",
    r"simplybook\.me",
    r"appointy\.com",
    r"agendar|reservar|book\s*(?:now|online|appointment|cita)",
    r"agenda\s*(?:online|virtual|digital)",
]

# Patrones para detectar chatbot
CHATBOT_PATTERNS = [
    r"tawk\.to",
    r"crisp\.chat",
    r"intercom\.io",
    r"drift\.com",
    r"hubspot\.com/conversations",
    r"zendesk\.com",
    r"livechat",
    r"tidio\.co",
    r"chat-widget",
    r"chatbot",
]

# Patrones para WhatsApp
WHATSAPP_PATTERNS = [
    r"wa\.me/",
    r"api\.whatsapp\.com",
    r"whatsapp\.com/send",
    r"whatsapp",
]

# Redes sociales
SOCIAL_PATTERNS = {
    "facebook": r"(?:facebook\.com|fb\.com)/[\w\.\-]+",
    "instagram": r"instagram\.com/[\w\.\-]+",
    "tiktok": r"tiktok\.com/@[\w\.\-]+",
}


async def scrape_website(url: str) -> dict | None:
    """Scrapea un sitio web y extrae informacion del negocio.

    Returns:
        Dict con tech_stack, has_booking, has_chatbot, has_whatsapp,
        social_links, seo_data, services_text. None si falla.
    """
    if not url:
        return None

    if not url.startswith("http"):
        url = f"https://{url}"

    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            await page.set_extra_http_headers({"Accept-Language": "es-PE,es;q=0.9"})

            try:
                await page.goto(url, wait_until="domcontentloaded", timeout=30000)
                await page.wait_for_timeout(2000)  # esperar JS
            except Exception as e:
                logger.warning(f"Error navegando a {url}: {e}")
                await browser.close()
                return None

            html = await page.content()
            await browser.close()

        soup = BeautifulSoup(html, "html.parser")
        html_lower = html.lower()

        result = {
            "tech_stack": _detect_tech(html_lower),
            "has_online_booking": _detect_pattern(html_lower, BOOKING_PATTERNS),
            "has_chatbot": _detect_pattern(html_lower, CHATBOT_PATTERNS),
            "has_whatsapp": _detect_pattern(html_lower, WHATSAPP_PATTERNS),
            "social_links": _extract_social_links(html),
            "seo": _extract_seo(soup),
            "services_text": _extract_services(soup),
        }

        logger.info(f"Scrapeado {url}: tech={result['tech_stack']}")
        return result

    except Exception as e:
        logger.error(f"Error scraping {url}: {e}")
        return None


def _detect_tech(html_lower: str) -> list[str]:
    detected = []
    for tech, patterns in TECH_PATTERNS.items():
        for pattern in patterns:
            if re.search(pattern, html_lower):
                detected.append(tech)
                break
    return detected


def _detect_pattern(html_lower: str, patterns: list[str]) -> bool:
    for pattern in patterns:
        if re.search(pattern, html_lower):
            return True
    return False


def _extract_social_links(html: str) -> dict[str, str | None]:
    links = {}
    for platform, pattern in SOCIAL_PATTERNS.items():
        match = re.search(pattern, html, re.IGNORECASE)
        links[platform] = f"https://{match.group(0)}" if match else None
    return links


def _extract_seo(soup: BeautifulSoup) -> dict:
    title = soup.find("title")
    meta_desc = soup.find("meta", attrs={"name": "description"})
    h1 = soup.find("h1")

    return {
        "title": title.get_text(strip=True) if title else None,
        "meta_description": meta_desc.get("content", "") if meta_desc else None,
        "h1": h1.get_text(strip=True) if h1 else None,
    }


def _extract_services(soup: BeautifulSoup) -> str | None:
    """Extrae texto que podria describir servicios."""
    texts = []
    for tag in soup.find_all(["p", "li", "h2", "h3"], limit=50):
        text = tag.get_text(strip=True)
        if len(text) > 20 and len(text) < 500:
            texts.append(text)
    return "\n".join(texts[:20]) if texts else None
