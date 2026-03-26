"""Mapeo de tags OSM a categorias internas de GeoIntel."""

# Mapeo: (tag_key, tag_value) -> (category, subcategory)
OSM_CATEGORY_MAP: dict[tuple[str, str], tuple[str, str]] = {
    # Salud — categorias ampliadas (Sprint 8: Nicho Salud)
    ("amenity", "clinic"): ("salud", "clinica"),
    ("amenity", "hospital"): ("salud", "hospital"),
    ("amenity", "pharmacy"): ("salud", "farmacia"),
    ("amenity", "dentist"): ("salud", "dentista"),
    ("amenity", "doctors"): ("salud", "consultorio"),
    ("amenity", "veterinary"): ("salud", "veterinaria"),
    ("amenity", "nursing_home"): ("salud", "residencia_geriatrica"),
    ("amenity", "social_facility"): ("salud", "centro_social"),
    ("healthcare", "doctor"): ("salud", "consultorio"),
    ("healthcare", "clinic"): ("salud", "clinica"),
    ("healthcare", "hospital"): ("salud", "hospital"),
    ("healthcare", "laboratory"): ("salud", "laboratorio"),
    ("healthcare", "pharmacy"): ("salud", "farmacia"),
    ("healthcare", "physiotherapist"): ("salud", "fisioterapia"),
    ("healthcare", "psychotherapist"): ("salud", "psicologia"),
    ("healthcare", "optometrist"): ("salud", "optica"),
    ("healthcare", "dentist"): ("salud", "dentista"),
    ("healthcare", "rehabilitation"): ("salud", "rehabilitacion"),
    ("healthcare", "midwife"): ("salud", "obstetricia"),
    ("healthcare", "speech_therapist"): ("salud", "terapia_lenguaje"),
    ("healthcare", "occupational_therapist"): ("salud", "terapia_ocupacional"),
    ("healthcare", "podiatrist"): ("salud", "podologia"),
    ("healthcare", "nutrition_counselling"): ("salud", "nutricion"),
    ("healthcare", "alternative"): ("salud", "medicina_alternativa"),
    ("healthcare", "centre"): ("salud", "centro_medico"),
    # Gastronomia
    ("amenity", "restaurant"): ("gastronomia", "restaurante"),
    ("amenity", "cafe"): ("gastronomia", "cafe"),
    ("amenity", "fast_food"): ("gastronomia", "comida_rapida"),
    ("amenity", "bar"): ("gastronomia", "bar"),
    ("amenity", "pub"): ("gastronomia", "pub"),
    ("amenity", "ice_cream"): ("gastronomia", "heladeria"),
    # Comercio
    ("shop", "supermarket"): ("comercio", "supermercado"),
    ("shop", "convenience"): ("comercio", "bodega"),
    ("shop", "clothes"): ("comercio", "ropa"),
    ("shop", "electronics"): ("comercio", "electronica"),
    ("shop", "hardware"): ("comercio", "ferreteria"),
    ("shop", "bakery"): ("comercio", "panaderia"),
    ("shop", "butcher"): ("comercio", "carniceria"),
    ("shop", "beauty"): ("comercio", "belleza"),
    ("shop", "hairdresser"): ("comercio", "peluqueria"),
    ("shop", "mobile_phone"): ("comercio", "celulares"),
    # Educacion
    ("amenity", "school"): ("educacion", "colegio"),
    ("amenity", "university"): ("educacion", "universidad"),
    ("amenity", "kindergarten"): ("educacion", "jardin_infantes"),
    ("amenity", "language_school"): ("educacion", "idiomas"),
    # Servicios
    ("amenity", "bank"): ("servicios", "banco"),
    ("amenity", "atm"): ("servicios", "cajero"),
    ("office", "lawyer"): ("servicios", "abogado"),
    ("office", "accountant"): ("servicios", "contador"),
    ("office", "insurance"): ("servicios", "seguros"),
    ("office", "estate_agent"): ("servicios", "inmobiliaria"),
    # Turismo
    ("tourism", "hotel"): ("turismo", "hotel"),
    ("tourism", "hostel"): ("turismo", "hostel"),
    ("tourism", "guest_house"): ("turismo", "hospedaje"),
    ("tourism", "museum"): ("turismo", "museo"),
    ("tourism", "attraction"): ("turismo", "atraccion"),
    # Entretenimiento
    ("leisure", "fitness_centre"): ("entretenimiento", "gimnasio"),
    ("leisure", "sports_centre"): ("entretenimiento", "centro_deportivo"),
    ("amenity", "cinema"): ("entretenimiento", "cine"),
    ("amenity", "nightclub"): ("entretenimiento", "discoteca"),
}

# Tags OSM que indican negocio (para detectar la categoria)
BUSINESS_TAG_KEYS = ["amenity", "shop", "healthcare", "office", "tourism", "craft", "leisure"]


def categorize_osm_tags(tags: dict) -> tuple[str, str]:
    """Determina categoria y subcategoria a partir de tags OSM.

    Returns:
        (category, subcategory) — si no hay match, retorna ("otro", valor del tag)
    """
    for key in BUSINESS_TAG_KEYS:
        value = tags.get(key)
        if value:
            result = OSM_CATEGORY_MAP.get((key, value))
            if result:
                return result
            return ("otro", value)
    return ("otro", "desconocido")


# Todas las subcategorias de salud conocidas
HEALTH_SUBCATEGORIES = {
    "clinica", "hospital", "farmacia", "dentista", "consultorio", "veterinaria",
    "laboratorio", "fisioterapia", "psicologia", "optica", "rehabilitacion",
    "obstetricia", "terapia_lenguaje", "terapia_ocupacional", "podologia",
    "nutricion", "medicina_alternativa", "centro_medico", "residencia_geriatrica",
    "centro_social", "ginecologia", "dermatologia", "pediatria", "oftalmologia",
    "traumatologia", "cardiologia", "urologia", "otorrinolaringologia",
    "neurologia", "endocrinologia",
}


def is_health_business(category: str | None, subcategory: str | None) -> bool:
    """Determina si un negocio pertenece al nicho salud."""
    return category == "salud" or (subcategory or "") in HEALTH_SUBCATEGORIES
