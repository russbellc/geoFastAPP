# 05 — Setup Frontend + Mapa Principal

> **Fase 2 — Frontend Web** | **Sprint 5**

## 1. Objetivo
Setup del frontend con Next.js 14, mapa interactivo con Leaflet/OpenStreetMap, panel lateral de negocios y autenticacion.

## 2. Modelos de BD involucrados
- **territories** — lectura para definir bounds del mapa
- **businesses** — lectura para mostrar markers
- **business_profiles** — lectura para popups con score

## 3. Endpoints consumidos
| Metodo | Ruta | Uso en frontend |
|--------|------|-----------------|
| GET | /businesses | Cargar markers en mapa |
| GET | /businesses/{id}/profile | Popup/panel detalle |
| POST | /auth/login | Login |
| POST | /auth/register | Registro |

## 4. Tareas
- [ ] Setup Next.js 14 + Tailwind + shadcn/ui en `frontend/`
- [ ] Dockerfile frontend (ver 01-fundacion, seccion 7)
- [ ] Verificar que `docker compose up frontend` levanta correctamente
- [ ] Configurar NEXT_PUBLIC_API_URL apuntando a Nginx → Backend
- [ ] Mapa Leaflet con OpenStreetMap tiles
- [ ] Clustering de markers (muchos negocios)
- [ ] Popups con info basica + score
- [ ] Filtros por categoria en mapa
- [ ] Panel lateral con lista de negocios (scroll sincronizado con mapa)
- [ ] Autenticacion (login/registro con JWT)
- [ ] Layout base: sidebar + mapa + header

### Stack frontend aprobado
- react-hook-form + zod + @hookform/resolvers → formularios
- zustand → estado global de UI
- date-fns (timezone: America/Lima) → fechas
- sonner → notificaciones toast

## 5. Decisiones tecnicas
- Frontend en su propio contenedor Docker, separado del backend
- Nginx como reverse proxy: `/api/*` → backend:8000, `/*` → frontend:3000
- Leaflet.js sobre Mapbox/Google Maps (gratuito, sin API key)
- CARTO Dark tiles (dark_all) para consistencia con el dark theme
- zustand para estado del mapa (bounds, filtros, negocio seleccionado)

## 6. Design System (v2 - GeoIntel Intelligence Core)
- **Theme:** Dark mode only, Material Design 3 inspired
- **Colors:** Background #0b1326, Primary #b4c5ff, Tertiary #4edea3, Secondary #adc8f5
- **Fonts:** Manrope (headlines), Inter (body/labels)
- **Icons:** Material Symbols Outlined (Google Fonts)
- **Layout:** Fixed sidebar (w-64) + top header + content area
- **Surfaces:** surface-container-low (#131b2e), surface-container-high (#222a3d), surface-container-highest (#2d3449)
- **Map markers:** Glow effect matching category color, custom dark popup styling
- **Reference HTML:** docs/react_GeoIntel.html

## 7. Paginas
| Ruta | Vista | Descripcion |
|------|-------|-------------|
| /login | Login | Auth con gradient primary, glass card |
| /dashboard | Territories | Mapa + Opportunities sidebar |
| /dashboard/stats | Intelligence | KPIs, heatmap, timeline, donut chart, recent leads |
| /dashboard/leads | Leads | Lista lateral + perfil detallado con score circular |
| /dashboard/scan | Scanner | Radio/Polygon mode con dark map |
| /dashboard/analytics | Analytics | Placeholder - coming soon |
| /dashboard/settings | Settings | Placeholder - coming soon |

## 8. Dependencias con otros modulos
- **Depende de:** 01-fundacion (auth), 02-scanner-osm (datos), 04-ia-scoring (scores)
- **Requerido por:** 06-dashboard, 07-scanner-ui

## Estado: completado (v2 redesign)
