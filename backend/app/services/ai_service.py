"""Servicio de IA usando Groq para generar resumenes de negocios."""

import logging

from groq import Groq

from app.core.config import settings

logger = logging.getLogger(__name__)


def generate_business_summary(
    name: str,
    category: str | None,
    subcategory: str | None,
    address: str | None,
    website: str | None,
    services_text: str | None,
    tech_stack: list[str] | None,
    has_booking: bool,
    has_chatbot: bool,
    seo_score: int | None,
    social_links: dict | None,
) -> str | None:
    """Genera un resumen inteligente de un negocio usando Groq."""
    if not settings.GROQ_API_KEY:
        logger.warning("GROQ_API_KEY no configurada, saltando resumen IA")
        return None

    prompt = f"""Analiza este negocio y genera un resumen ejecutivo breve (3-4 oraciones) en espanol.
Enfocate en: que ofrece, nivel de digitalizacion, y oportunidad para venderle servicios digitales.

Datos del negocio:
- Nombre: {name}
- Categoria: {category}/{subcategory}
- Direccion: {address or 'No disponible'}
- Website: {website or 'No tiene'}
- Servicios detectados: {services_text[:300] if services_text else 'No detectados'}
- Tecnologia web: {', '.join(tech_stack) if tech_stack else 'Ninguna detectada'}
- Agenda online: {'Si' if has_booking else 'No'}
- Chatbot: {'Si' if has_chatbot else 'No'}
- SEO Score: {seo_score or 'N/A'}/100
- Redes sociales: {social_links or 'No detectadas'}

Resumen:"""

    try:
        client = Groq(api_key=settings.GROQ_API_KEY)
        response = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=300,
            temperature=0.3,
        )
        summary = response.choices[0].message.content.strip()
        logger.info(f"Resumen IA generado para '{name}'")
        return summary
    except Exception as e:
        logger.error(f"Error generando resumen IA para '{name}': {e}")
        return None
