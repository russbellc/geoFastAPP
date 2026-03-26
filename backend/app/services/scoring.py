"""Sistema de scoring de oportunidad (0-100) para negocios."""

from datetime import datetime, timedelta, timezone

from app.models.business import Business
from app.models.business_profile import BusinessProfile


def calculate_opportunity_score(
    business: Business,
    profile: BusinessProfile,
    territory_density: int = 0,
) -> int:
    """Calcula el opportunity_score basado en reglas fijas.

    Reglas:
        +30 pts → No tiene sistema de gestion detectado
        +20 pts → Activo en redes sociales (ultimos 30 dias)
        +15 pts → Web desactualizada o sin web
        +12 pts → Zona de alta densidad del nicho
        +10 pts → Sector salud (nicho prioritario)
        + 8 pts → Sin agenda online
        + 5 pts → Sin chatbot ni WhatsApp link
    """
    score = 0

    # +30: No tiene sistema de gestion detectado
    tech = profile.tech_stack or {}
    detected = tech.get("detected", [])
    management_systems = {"wordpress", "shopify", "wix", "squarespace", "joomla", "drupal"}
    if not any(t in management_systems for t in detected):
        score += 30

    # +20: Activo en redes sociales (ultimos 30 dias)
    if profile.last_post_date:
        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
        if profile.last_post_date > thirty_days_ago:
            score += 20
    elif profile.facebook_url or profile.instagram_url or profile.tiktok_url:
        # Tiene redes pero no pudimos verificar actividad -> damos puntos parciales
        score += 10

    # +15: Web desactualizada o sin web
    if not business.website:
        score += 15
    elif profile.seo_score is not None and profile.seo_score < 40:
        score += 15

    # +12: Zona de alta densidad del nicho
    if territory_density > 20:
        score += 12

    # +10: Sector salud
    if business.category == "salud":
        score += 10

    # +8: Sin agenda online
    if not profile.has_online_booking:
        score += 8

    # +5: Sin chatbot ni WhatsApp
    if not profile.has_chatbot:
        score += 5

    return min(score, 100)


def classify_lead(score: int) -> str:
    """Clasifica un lead segun su score.

    80-100 → hot  (contactar esta semana)
    50-79  → warm (nutrir con contenido)
    0-49   → cold (monitorear)
    """
    if score >= 80:
        return "hot"
    elif score >= 50:
        return "warm"
    return "cold"
