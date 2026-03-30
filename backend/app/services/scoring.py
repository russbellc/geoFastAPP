"""Sistema de scoring de oportunidad (0-100) para negocios."""

from datetime import datetime, timedelta, timezone

from app.models.business import Business
from app.models.business_profile import BusinessProfile
from app.services.osm_categories import is_health_business

# Subcategorias de salud con mayor demanda digital (LiaFlow target)
LIAFLOW_HIGH_PRIORITY = {
    "clinica", "consultorio", "dentista", "psicologia", "fisioterapia",
    "ginecologia", "dermatologia", "pediatria", "oftalmologia", "nutricion",
    "centro_medico",
}


def calculate_opportunity_score(
    business: Business,
    profile: BusinessProfile,
    territory_density: int = 0,
) -> int:
    """Calcula el opportunity_score basado en reglas fijas.

    Reglas generales:
        +30 pts -> No tiene sistema de gestion detectado
        +20 pts -> Activo en redes sociales (ultimos 30 dias)
        +15 pts -> Web desactualizada o sin web
        +12 pts -> Zona de alta densidad del nicho
        +10 pts -> Sector salud (nicho prioritario)
        + 8 pts -> Sin agenda online
        + 5 pts -> Sin chatbot ni WhatsApp link

    Bonus LiaFlow (salud):
        + 5 pts -> Subcategoria salud de alta prioridad (clinica, consultorio, etc.)
        + 3 pts -> Tiene web pero NO tiene sistema de gestion clinica
    """
    score = 0

    # +30: No tiene sistema de gestion detectado
    tech = profile.tech_stack or {}
    detected = tech.get("detected", [])
    management_systems = {"wordpress", "shopify", "wix", "squarespace", "joomla", "drupal"}
    has_management = any(t.lower() in management_systems for t in detected)
    if not has_management:
        score += 30

    # +20: Activo en redes sociales (ultimos 30 dias)
    if profile.last_post_date:
        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
        if profile.last_post_date > thirty_days_ago:
            score += 20
    elif profile.facebook_url or profile.instagram_url or profile.tiktok_url:
        # Tiene redes pero no pudimos verificar actividad -> puntos parciales
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
    is_health = is_health_business(business.category, business.subcategory)
    if is_health:
        score += 10

    # +8: Sin agenda online
    if not profile.has_online_booking:
        score += 8

    # +5: Sin chatbot ni WhatsApp
    if not profile.has_chatbot:
        score += 5

    # --- Bonus LiaFlow para salud ---
    if is_health:
        # +5: Subcategoria de alta prioridad para digitalizacion
        if (business.subcategory or "") in LIAFLOW_HIGH_PRIORITY:
            score += 5

        # +3: Tiene web pero NO tiene sistema clinico especializado
        clinical_systems = {
            "medilink", "doctoralia", "medicloud", "cliniccloud",
            "doctoranytime", "nubimed", "dentalink", "medesk",
            "simplepractice", "jane", "cliniko", "practice better",
        }
        detected_lower = {t.lower() for t in detected}
        if business.website and not detected_lower.intersection(clinical_systems):
            score += 3

    # --- Bonus GMaps (negocios sin web tambien se benefician) ---
    gmaps = tech.get("gmaps", {})
    if gmaps:
        rating = gmaps.get("rating")
        reviews = gmaps.get("reviews_count")

        # +5: Tiene telefono pero no website (facil de contactar, necesita digitalizacion)
        if business.phone and not business.website:
            score += 5

        # +3: Rating bajo en GMaps (< 4.0 = oportunidad de mejora)
        if rating and rating < 4.0:
            score += 3

        # +5: Pocas reviews (< 10 = poca presencia digital)
        if reviews is not None and reviews < 10:
            score += 5

        # +3: No tiene horario publicado en GMaps
        if not gmaps.get("hours"):
            score += 3

    return min(score, 100)


def classify_lead(score: int) -> str:
    """Clasifica un lead segun su score.

    80-100 -> hot  (contactar esta semana)
    50-79  -> warm (nutrir con contenido)
    0-49   -> cold (monitorear)
    """
    if score >= 80:
        return "hot"
    elif score >= 50:
        return "warm"
    return "cold"
