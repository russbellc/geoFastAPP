"""Mapeo de tags OSM a categorias internas de GeoIntel."""

# Mapeo: (tag_key, tag_value) -> (category, subcategory)
OSM_CATEGORY_MAP: dict[tuple[str, str], tuple[str, str]] = {
    # Salud
    ("amenity", "clinic"): ("salud", "clinica"),
    ("amenity", "hospital"): ("salud", "hospital"),
    ("amenity", "pharmacy"): ("salud", "farmacia"),
    ("amenity", "dentist"): ("salud", "dentista"),
    ("amenity", "doctors"): ("salud", "consultorio"),
    ("amenity", "veterinary"): ("salud", "veterinaria"),
    ("healthcare", "doctor"): ("salud", "consultorio"),
    ("healthcare", "clinic"): ("salud", "clinica"),
    ("healthcare", "laboratory"): ("salud", "laboratorio"),
    ("healthcare", "pharmacy"): ("salud", "farmacia"),
    ("healthcare", "physiotherapist"): ("salud", "fisioterapia"),
    ("healthcare", "psychotherapist"): ("salud", "psicologia"),
    ("healthcare", "optometrist"): ("salud", "optica"),
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
