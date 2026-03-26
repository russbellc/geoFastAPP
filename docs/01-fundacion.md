# 01 — Fundación del Proyecto

> **Fase 1 — Backend Core** | **Sprint 1**

## 1. Objetivo
Setup inicial del monorepo con Docker Compose (cada servicio en su contenedor), estructura base de FastAPI, modelos de BD con SQLAlchemy/Alembic y autenticacion JWT.

## 2. Modelos de BD involucrados
- **territories** — id, name, city, country, geometry (PostGIS polygon), created_at, last_scan_at
- **businesses** — id, territory_id, name, category, subcategory, lat, lng, address, phone, website, email, source (osm/scraping), osm_id, registered_at_source, created_at, updated_at
- **business_profiles** — id, business_id, services, tech_stack (json), has_online_booking, has_chatbot, seo_score, redes sociales (urls + followers), ai_summary, opportunity_score, lead_status, enriched_at
- **scan_jobs** — id, territory_id, nicho, status (pending/running/done/failed), total_found, total_enriched, started_at, finished_at

## 3. Endpoints creados
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | /api/v1/auth/register | Registrar usuario |
| POST | /api/v1/auth/login | Login, devuelve JWT |
| GET | /api/v1/auth/me | Obtener usuario actual (requiere token) |
| GET | /health | Health check |

## 4. Tareas
- [x] Setup monorepo
- [x] Dockerfile backend (`backend/Dockerfile`)
- [x] Dockerfile frontend (`frontend/Dockerfile`) — placeholder
- [x] Docker Compose con servicios separados (postgres, redis, backend, frontend, nginx)
- [x] Estructura base FastAPI (`backend/app/`)
- [x] SQLAlchemy models: users, territories, businesses, business_profiles, scan_jobs
- [x] Alembic: migracion inicial async
- [x] Autenticacion JWT (register, login, /me, dependency get_current_user)

## 5. Decisiones tecnicas
- SQLAlchemy + Alembic como ORM (en lugar de Prisma) por mejor soporte PostGIS/pgvector en Python
- Monorepo con Docker Compose para mantener backend, frontend y mobile juntos
- PostgreSQL con extensiones PostGIS y pgvector desde el inicio
- **Cada servicio en su propio contenedor** para aislamiento y escalabilidad independiente
- bcrypt directo (sin passlib) por incompatibilidad con bcrypt >= 4.1
- Imagen Docker postgres: `pgvector/pgvector:pg16` + PostGIS (postgis no incluye pgvector)
- Puertos host: postgres 5433, redis 6380 (para no chocar con servicios locales)

## 6. Dependencias con otros modulos
- **Requerido por:** todos los sprints siguientes (es la base)
- **Depende de:** nada (sprint inicial)

## 7. Infraestructura Docker

### Servicios en docker-compose.yml

| Servicio | Imagen/Build | Puerto | Descripcion |
|----------|-------------|--------|-------------|
| **backend** | `./backend/Dockerfile` | 8000 | FastAPI — API REST principal |
| **celery_worker** | mismo build backend | — | Celery worker para jobs en background |
| **celery_beat** | mismo build backend | — | Celery beat para tareas programadas (cron) |
| **frontend** | `./frontend/Dockerfile` | 3000 | Next.js 14 — UI web |
| **postgres** | `postgis/postgis:16-3.4` | 5432 | PostgreSQL + PostGIS + pgvector |
| **redis** | `redis:7-alpine` | 6379 | Cache + message broker (Celery) |
| **nginx** | `nginx:alpine` | 80/443 | Reverse proxy — rutea `/api` → backend, `/` → frontend |
| **n8n** | `n8nio/n8n` | 5678 | Automatizacion y workflows (Sprint 10) |

### Arquitectura de red

```
                    ┌─────────┐
                    │  Nginx  │ :80/:443
                    └────┬────┘
                   ┌─────┴─────┐
                   │           │
              /api/*        /*
                   │           │
            ┌──────▼──┐  ┌─────▼─────┐
            │ Backend │  │ Frontend  │
            │ FastAPI │  │ Next.js   │
            │  :8000  │  │  :3000    │
            └────┬────┘  └───────────┘
                 │
      ┌──────────┼──────────┐
      │          │          │
┌─────▼───┐ ┌───▼────┐ ┌───▼────┐
│Postgres │ │ Redis  │ │ Celery │
│ PostGIS │ │        │ │ Worker │
│  :5432  │ │ :6379  │ │ + Beat │
└─────────┘ └────────┘ └────────┘
```

### Dockerfile Backend (`backend/Dockerfile`)
```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN playwright install --with-deps chromium
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

### Dockerfile Frontend (`frontend/Dockerfile`)
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json .
RUN npm ci
COPY . .
CMD ["npm", "run", "dev"]
```

### Volumenes
- `postgres_data` — persistencia de BD
- `redis_data` — persistencia de cache
- `n8n_data` — workflows de n8n
- `./backend:/app` — hot-reload backend (dev)
- `./frontend:/app` — hot-reload frontend (dev)

### Variables de entorno (.env)
```env
# Postgres
POSTGRES_USER=geointel
POSTGRES_PASSWORD=<secret>
POSTGRES_DB=geointel

# Backend
DATABASE_URL=postgresql+asyncpg://geointel:<secret>@postgres:5432/geointel
REDIS_URL=redis://redis:6379/0
JWT_SECRET=<secret>
CLAUDE_API_KEY=<secret>

# Frontend
NEXT_PUBLIC_API_URL=http://localhost/api
NEXT_PUBLIC_WS_URL=ws://localhost/ws

# n8n
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=<secret>
```

### Comandos principales
```bash
# Levantar todo
docker compose up -d

# Solo backend + dependencias
docker compose up -d backend postgres redis

# Solo frontend
docker compose up -d frontend

# Ver logs de un servicio
docker compose logs -f backend

# Rebuild un servicio especifico
docker compose up -d --build backend

# Migraciones
docker compose exec backend alembic upgrade head
```

## Estado: completado
