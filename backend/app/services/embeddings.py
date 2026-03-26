"""Servicio de embeddings para busqueda semantica con pgvector."""

import logging

from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)

# Modelo ligero multilingue (~100MB)
_model = None


def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        logger.info("Cargando modelo de embeddings...")
        _model = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
        logger.info("Modelo cargado")
    return _model


def generate_embedding(text: str) -> list[float]:
    """Genera un embedding de 384 dimensiones para un texto."""
    model = get_model()
    embedding = model.encode(text, normalize_embeddings=True)
    return embedding.tolist()


def build_business_text(
    name: str,
    category: str | None,
    subcategory: str | None,
    address: str | None,
    services: str | None,
) -> str:
    """Construye texto representativo de un negocio para embedding."""
    parts = [name]
    if category:
        parts.append(category)
    if subcategory:
        parts.append(subcategory)
    if address:
        parts.append(address)
    if services:
        parts.append(services[:200])
    return " ".join(parts)
