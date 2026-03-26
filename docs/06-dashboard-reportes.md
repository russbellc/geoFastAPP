# 06 — Dashboard + Reportes

> **Fase 2 — Frontend Web** | **Sprint 6**

## 1. Objetivo
Dashboard con metricas del territorio, perfil detallado de negocio con score visual, filtros avanzados y graficos con Recharts.

## 2. Modelos de BD involucrados
- **territories** — stats agregadas
- **businesses** — conteos, distribucion
- **business_profiles** — scores, categorias, estado de leads

## 3. Endpoints consumidos
| Metodo | Ruta | Uso en frontend |
|--------|------|-----------------|
| GET | /stats/territory/{id} | Metricas del dashboard |
| GET | /businesses | Lista con filtros avanzados |
| GET | /businesses/{id}/profile | Perfil detallado |

## 4. Tareas
- [ ] Dashboard principal: total negocios, distribucion por categoria
- [ ] Mapa de calor (heatmap) de densidad de negocios
- [ ] Timeline: negocios encontrados por fecha de escaneo
- [ ] Perfil detallado de negocio: info completa + score visual (gauge/badge)
- [ ] Filtros avanzados: categoria, score range, zona, tiene web, tiene redes
- [ ] Graficos con Recharts: barras, pie, lineas de tendencia
- [ ] Responsive design

## 5. Decisiones tecnicas
- Recharts para graficos (ligero, buena integracion con React)
- Mapa de calor con leaflet.heat plugin
- Filtros como query params en URL (shareable, bookmarkable)
- Score visual con colores: rojo (hot), amarillo (warm), gris (cold)

## 6. Dependencias con otros modulos
- **Depende de:** 05-frontend-mapa (layout, mapa base), 04-ia-scoring (scores)
- **Requerido por:** 07-scanner-ui, 09-social-intelligence (radar en dashboard)

## Estado: completado
