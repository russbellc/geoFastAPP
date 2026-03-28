

# GeoIntel — Business Intelligence Platform

## Visión del Proyecto

Plataforma de inteligencia de mercado que escanea territorios geográficos, construye perfiles profundos de negocios y genera insights accionables con IA. Permite identificar oportunidades de mercado, mapear competencia y generar leads calificados.

--- 

## Stack Tecnológico

### Backend
- **Python + FastAPI** — API REST principal
- **Celery + Redis** — Jobs en background (escaneos largos)
- **PostgreSQL + PostGIS** — BD principal con soporte geoespacial
- **pgvector** — Memoria vectorial para búsqueda semántica
- **SQLAlchemy + Alembic** — ORM y migraciones
- **Playwright** — Scraping con JS rendering
- **Wappalyzer** — Detección de tecnología en webs
- **Claude API (Groq temporal)** — IA para scoring y análisis

### Frontend
- **Next.js 14** — Framework principal
- **Tailwind CSS + shadcn/ui** — UI components
- **Leaflet.js + OpenStreetMap** — Mapas interactivos
- **Recharts** — Gráficos y dashboards
- **WebSockets** — Progreso de escaneos en tiempo real

### Mobile (Fase 4)
- **Flutter** — Framework mobile
- **Riverpod 3.0** — State management
- **go_router + freezed** — Navegación y modelos
- **flutter_map** — Mapas con OpenStreetMap
- **fl_chart** — Gráficos mobile

### Infraestructura
- **Docker Compose** — Contenedores
- **Nginx** — Reverse proxy
- **n8n** — Automatización y outreach
- **Redis** — Cache + queue

---

## Estructura del Repositorio

```
geointel/
├── backend/          # FastAPI + Celery
│   ├── app/
│   │   ├── api/      # Endpoints por módulo
│   │   ├── models/   # SQLAlchemy models
│   │   ├── services/ # Lógica de negocio
│   │   ├── scrapers/ # Playwright + OSM
│   │   └── workers/  # Celery tasks
│   ├── alembic/      # Migraciones
│   └── Dockerfile
├── frontend/         # Next.js 14
│   ├── app/
│   ├── components/
│   └── Dockerfile
├── mobile/           # Flutter
└── docker-compose.yml
```

---

## Modelos de Base de Datos

### territories
- id, name, city, country
- geometry (PostGIS polygon)
- created_at, last_scan_at

### businesses
- id, territory_id
- name, category, subcategory
- lat, lng, address
- phone, website, email
- source (osm / scraping)
- osm_id, registered_at_source
- created_at, updated_at

### business_profiles
- id, business_id
- services (text)
- tech_stack (json) — CMS, sistemas detectados
- has_online_booking (bool)
- has_chatbot (bool)
- seo_score (int)
- facebook_url, instagram_url, tiktok_url
- facebook_followers, instagram_followers, tiktok_followers
- last_post_date
- ai_summary (text)
- opportunity_score (int 0-100)
- lead_status (cold / warm / hot)
- enriched_at

### scan_jobs
- id, territory_id, nicho
- status (pending / running / done / failed)
- total_found, total_enriched
- started_at, finished_at

---

## Módulos del Sistema

### Módulo 1 — Scanner General de Territorio
Escanea una ciudad completa y extrae todos los negocios existentes vía Overpass API (OSM). Guarda coordenadas, categoría, dirección y fecha de registro. Permite filtrar por tipo de negocio y ver concentración por zona.

### Módulo 2 — Scanner por Nicho
El usuario define un nicho (salud, turismo, gastronomía) y el sistema escanea más profundo combinando OSM + web scraping. Para salud incluye: clínicas, consultorios, psicología, terapia, rehabilitación, farmacias, laboratorios. Genera lista de leads con score LiaFlow.

### Módulo 3 — Social Intelligence
Monitorea redes sociales (Instagram, TikTok, Facebook) para detectar competidores SaaS de salud en LATAM. Analiza contenido, estrategia, engagement y mercados donde operan. Genera radar de competencia con gaps vs LiaFlow.

---

## Sistema de Scoring (opportunity_score)

```
Base: 0 puntos

+ 30 pts → No tiene sistema de gestión detectado
+ 20 pts → Activo en redes sociales (últimos 30 días)
+ 15 pts → Web desactualizada o sin web
+ 12 pts → Zona de alta densidad del nicho
+ 10 pts → Sector salud (nicho prioritario)
+  8 pts → Sin agenda online
+  5 pts → Sin chatbot ni WhatsApp link

Lead status:
  80-100 → hot  (contactar esta semana)
  50-79  → warm (nutrir con contenido)
  0-49   → cold (monitorear)
```

---

## Endpoints Principales

```
POST   /scans/territory          # Lanzar escaneo de territorio
GET    /scans/{id}/status         # Progreso del escaneo
GET    /businesses                # Lista con filtros
GET    /businesses/{id}/profile   # Perfil completo enriquecido
POST   /search/semantic           # Búsqueda en lenguaje natural
GET    /stats/territory/{id}      # Métricas y reportes
POST   /export/csv                # Exportar leads filtrados
POST   /export/pdf                # Reporte ejecutivo PDF
GET    /competitors               # Radar de competencia
```

---

## Convenciones de Desarrollo

- Todos los endpoints son async
- Los escaneos largos siempre via Celery (nunca bloquear el request)
- WebSocket en `/ws/scan/{job_id}` para progreso en tiempo real
- Enriquecimiento progresivo: primero datos básicos, luego web, luego redes
- Rate limiting en scrapers para no ser bloqueados
- Deduplicación por (osm_id OR nombre+coordenadas cercanas)
- Logs estructurados por job_id

---

## Fases y Sprints

### FASE 1 — Backend Core (~5 semanas)

**Sprint 1 — Fundación**
- Setup monorepo, Docker Compose (PostgreSQL+PostGIS+Redis+pgvector)
- Estructura base FastAPI, SQLAlchemy models, Alembic
- Modelos: territories, businesses, business_profiles, scan_jobs
- Autenticación JWT

**Sprint 2 — Scanner OSM**
- Integración Overpass API
- Escaneo por ciudad completa o radio
- Normalización categorías OSM
- Celery + Redis para background jobs
- Endpoints: POST /scans/territory, GET /scans/{id}/status, GET /businesses

**Sprint 3 — Motor de enriquecimiento web**
- Playwright: extraer servicios, detectar tech stack (Wappalyzer)
- Detectar agenda online, chatbot, WhatsApp link, SEO básico
- Crawler redes sociales: detectar links, seguidores, última publicación
- Job queue para enriquecimiento masivo

**Sprint 4 — IA + Scoring + Vectores**
- Claude API: resumen inteligente por negocio
- Sistema de scoring 0-100
- pgvector: embeddings para búsqueda semántica
- Clasificación automática: cold / warm / hot
- Endpoint POST /search/semantic

---

### FASE 2 — Frontend Web (~3 semanas)

**Sprint 5 — Setup + Mapa principal**
- Next.js 14 + Tailwind + shadcn/ui
- Mapa Leaflet con clustering, popups, filtros por categoría
- Panel lateral con lista de negocios
- Autenticación

**Sprint 6 — Dashboard + Reportes**
- Métricas: total negocios, distribución categorías, mapa de calor, timeline
- Perfil detallado de negocio con score visual
- Filtros avanzados: categoría, score, zona, tiene web, tiene redes
- Recharts para gráficos

**Sprint 7 — Scanner UI + Exportación**
- UI para lanzar escaneos con progress bar (WebSocket)
- Historial de escaneos
- Exportación CSV/Excel y PDF reporte ejecutivo
- Vista leads calientes con acción rápida

---

### FASE 3 — Módulos Avanzados (~4 semanas)

**Sprint 8 — Módulo Nicho Salud**
- Categorías especializadas salud
- Fuentes adicionales: Doctoralia Perú, directorios MINSA
- Score LiaFlow específico
- Vista especial nicho salud en frontend

**Sprint 9 — Social Intelligence**
- Scanner competidores SaaS salud LATAM en redes sociales
- Keywords: "sistema médico", "gestión clínica", "historia clínica digital"
- Perfil completo por competidor: contenido, estrategia, mercados
- Análisis IA gaps
- Radar de competencia en dashboard

**Sprint 10 — Automatización + n8n**
- Integración n8n: exportar leads calientes a flujo WhatsApp
- Triggers automáticos por nuevos negocios calientes
- Re-escaneo automático (cron cada 30 días)
- Webhooks para integraciones externas
- API key management

---

### FASE 4 — Mobile Flutter (~4 semanas)

**Sprint 11 — Setup + Mapa mobile**
- Flutter + Riverpod 3.0 + go_router + freezed
- flutter_map con OpenStreetMap
- Vista negocios cercanos a ubicación actual
- Perfil básico de negocio

**Sprint 12 — Dashboard mobile**
- Métricas principales con fl_chart
- Lista leads calientes
- Búsqueda con IA
- Notificaciones push

**Sprint 13 — Features avanzados mobile**
- Escanear zona desde mobile (radio desde ubicación actual)
- Mapa de calor mobile
- Exportar PDF desde mobile
- Modo offline básico (caché)

---

## Estado Actual

- [x] Sprint 1 — Fundacion del proyecto
- [x] Sprint 2 — Scanner OSM
- [x] Sprint 3 — Motor de enriquecimiento
- [x] Sprint 4 — IA + Scoring + Vectores
- [x] Sprint 5 — Frontend mapa
- [x] Sprint 6 — Dashboard
- [x] Sprint 7 — Scanner UI + Exportacion
- [x] Sprint 8 — Nicho Salud
- [x] Sprint 9 — Social Intelligence
- [x] Sprint 10 — Automatizacion n8n
- [x] Sprint 11 — Mobile setup + mapa
- [x] Sprint 12 — Mobile dashboard
- [x] Sprint 13 — Mobile avanzado


## REGLAS DE BUILD Y SERVIDOR
- NO rebuild ni reiniciar servicios por cada cambio de archivo
- NestJS: npm run start:dev (watch automatico)
- Next.js: npm run dev (hot-reload automatico)
- Solo rebuild cuando: schema.prisma, dependencias, docker-compose

## REGLAS DE GIT
- Commit automatico al terminar cada tarea
- Formato: feat: Tarea X.X - descripcion breve
- Sprint completo: commit final + tag + avisar para push
- NUNCA commitear .env ni node_modules


## REGLAS DE DOCUMENTACION EN docs/
- Cada modulo o funcionalidad nueva se documenta en docs/
- Nomenclatura correlativa: docs/XX-nombre-modulo.md
  (ej: 01-setup-backend.md, 02-auth.md, 03-superadmin.md)
- El documento debe incluir:
  1. Objetivo del modulo/funcionalidad
  2. Modelos de BD involucrados
  3. Endpoints/resolvers creados
  4. Decisiones tecnicas tomadas
  5. Dependencias con otros modulos
- Antes de modificar un modulo existente, consultar su
  documento en docs/ primero
- Si hay cambios, actualizar el documento correspondiente
  ANTES de hacer commit
- El archivo docs/README.md mantiene el indice de todos
  los documentos con su numero y estado


## REGLAS DE PREGUNTAS
- Si algo no esta claro, PREGUNTAR antes de asumir
- Nunca inventar comportamiento no definido
- Si hay 2 formas, mostrar opciones y esperar decision


## REGLAS DE FRONTEND
### Stack aprobado
- react-hook-form + zod + @hookform/resolvers → formularios
- zustand → estado global de UI
- date-fns → manejo de fechas (timezone: America/Lima)
- sonner → notificaciones toast
- shadcn/ui + Tailwind → componentes y estilos



****

















