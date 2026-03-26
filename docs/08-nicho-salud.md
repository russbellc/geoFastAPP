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
- [ ] Categorias especializadas salud: clinicas, consultorios, psicologia, terapia, rehabilitacion, farmacias, laboratorios
- [ ] Scraper Doctoralia Peru: extraer profesionales y centros
- [ ] Scraper directorios MINSA: establecimientos registrados
- [ ] Score LiaFlow especifico para salud (ajustar pesos)
- [ ] Mapeo categorias OSM healthcare → subcategorias salud internas
- [ ] Vista especial nicho salud en frontend (iconos, colores diferenciados)
- [ ] Deduplicacion cruzada: OSM + Doctoralia + MINSA

## 5. Decisiones tecnicas
- Fuentes de salud adicionales especificas para Peru (Doctoralia Peru, MINSA)
- Score LiaFlow: +10pts extra para sector salud (nicho prioritario)
- Subcategorias salud mas granulares que OSM (ej: "clinica dental" vs solo "clinic")
- Deduplicacion por nombre normalizado + coordenadas cercanas (<100m)

## 6. Dependencias con otros modulos
- **Depende de:** 02-scanner-osm, 03-enriquecimiento, 04-ia-scoring, 05-frontend-mapa
- **Requerido por:** 09-social-intelligence (competidores SaaS salud)

## Estado: pendiente
