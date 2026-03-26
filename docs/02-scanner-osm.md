# 02 — Scanner OSM

> **Fase 1 — Backend Core** | **Sprint 2**

## 1. Objetivo
Integrar Overpass API para escanear territorios geograficos completos, extraer negocios de OpenStreetMap, normalizar categorias y procesar escaneos en background con Celery.

## 2. Modelos de BD involucrados
- **territories** — se crean al definir zona de escaneo
- **businesses** — se pueblan con resultados de Overpass API
- **scan_jobs** — tracking de estado del escaneo

## 3. Endpoints creados
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | /scans/territory | Lanzar escaneo de territorio |
| GET | /scans/{id}/status | Progreso del escaneo |
| GET | /businesses | Lista de negocios con filtros |

## 4. Tareas
- [x] Integracion Overpass API (queries por bounding box y radio)
- [x] Escaneo por radio desde punto central
- [x] Normalizacion de categorias OSM a categorias internas (~50 mapeos)
- [x] Setup Celery + Redis para background jobs
- [x] Endpoint POST /scans/territory
- [x] Endpoint GET /scans/{id}/status
- [x] Endpoint GET /businesses (con filtros: categoria, territorio, paginacion)
- [x] Deduplicacion por osm_id
- [x] Migracion: columnas lat, lng, radius_m en territories

## 5. Decisiones tecnicas
- Overpass API como fuente principal de datos geograficos (gratuita, sin limites estrictos)
- Celery para jobs largos: nunca bloquear el request HTTP
- Normalizacion propia de categorias OSM (mapeo amenity/shop/healthcare → categorias internas)
- Rate limiting en queries a Overpass (min 2s entre requests)
- httpx async para requests a Overpass (timeout 90s)
- Deduplicacion por osm_id (formato "type/id", ej: "node/1234")
- Territory ahora tiene lat/lng/radius_m para escaneo por radio

## 6. Dependencias con otros modulos
- **Depende de:** 01-fundacion (modelos, Docker, FastAPI base)
- **Requerido por:** 03-enriquecimiento, 04-ia-scoring, 08-nicho-salud

## Estado: completado
