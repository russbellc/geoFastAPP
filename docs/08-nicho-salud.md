# 08 — Modulo Nicho Salud

> **Fase 3 — Modulos Avanzados** | **Sprint 8**

## 1. Objetivo
Especializacion del scanner para el nicho de salud: categorias especificas, fuentes adicionales (Doctoralia, MINSA), score LiaFlow personalizado y vista dedicada en frontend.

## 2. Modelos de BD involucrados
- **businesses** — category/subcategory especializadas para salud
- **business_profiles** — opportunity_score con reglas LiaFlow especificas
- **scan_jobs** — escaneos con nicho = "salud"

## 3. Endpoints creados
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | /scans/territory | Mismo endpoint, nicho="salud" activa logica especial |
| GET | /businesses?category=salud | Filtro por nicho salud |

## 4. Tareas
- [x] Categorias especializadas salud: 25+ subcategorias (clinica, consultorio, psicologia, fisioterapia, rehabilitacion, farmacia, laboratorio, ginecologia, dermatologia, pediatria, etc.)
- [x] Scraper Doctoralia Peru: busqueda por ciudad y especialidad, 15 especialidades mapeadas
- [ ] Scraper directorios MINSA: pendiente (requiere analisis de estructura web MINSA)
- [x] Score LiaFlow especifico para salud: +10 base + +5 subcategoria prioritaria + +3 sin sistema clinico
- [x] Mapeo categorias OSM healthcare -> subcategorias salud internas (25 mapeos)
- [x] Vista especial nicho salud en frontend: pagina /dashboard/health con KPIs, subcategorias chart, lead quality donut, health directory grid
- [x] Deduplicacion cruzada: OSM + Doctoralia por nombre normalizado + territorio
- [x] Endpoint GET /stats/health para metricas del nicho salud

## 5. Decisiones tecnicas
- Fuentes de salud adicionales especificas para Peru (Doctoralia Peru, MINSA)
- Score LiaFlow: +10pts extra para sector salud (nicho prioritario)
- Subcategorias salud mas granulares que OSM (ej: "clinica dental" vs solo "clinic")
- Deduplicacion por nombre normalizado + coordenadas cercanas (<100m)

## 6. Dependencias con otros modulos
- **Depende de:** 02-scanner-osm, 03-enriquecimiento, 04-ia-scoring, 05-frontend-mapa
- **Requerido por:** 09-social-intelligence (competidores SaaS salud)

## Estado: completado
