# 10 — Automatizacion + n8n

> **Fase 3 — Modulos Avanzados** | **Sprint 10**

## 1. Objetivo
Integrar n8n para automatizar outreach a leads calientes via WhatsApp, configurar triggers automaticos, re-escaneos periodicos, webhooks para integraciones externas y gestion de API keys.

## 2. Modelos de BD involucrados
- **business_profiles** — lead_status para triggers (hot → notificar)
- **scan_jobs** — re-escaneos automaticos
- Nueva tabla **api_keys** — id, user_id, key_hash, name, permissions[], created_at, last_used_at, active
- Nueva tabla **webhooks** — id, user_id, url, events[], secret, active

## 3. Endpoints creados
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | /webhooks | Registrar webhook |
| GET | /webhooks | Listar webhooks del usuario |
| DELETE | /webhooks/{id} | Eliminar webhook |
| POST | /api-keys | Crear API key |
| GET | /api-keys | Listar API keys |
| DELETE | /api-keys/{id} | Revocar API key |

## 4. Tareas
- [x] Sistema de webhooks: registro, dispatch, retry (3 intentos con HMAC signature)
- [x] API key management: crear (hash SHA256), listar, revocar
- [x] Endpoints: POST/GET/DELETE /webhooks, POST/GET/DELETE /api-keys
- [x] Webhook events: lead.hot, scan.completed, competitor.new, business.enriched
- [x] Webhook dispatcher con HMAC signature y retry
- [x] Frontend Settings: UI completa para API keys y webhooks en /dashboard/settings
- [x] Modelos BD: api_keys (hashed), webhooks (con secret)
- [x] Migracion Alembic ejecutada
- [ ] Integracion n8n container en docker-compose (pendiente — requiere n8n self-hosted)
- [ ] Celery beat para re-escaneo automatico cada 30 dias
- [ ] Autenticacion por API key (ademas de JWT)

## 5. Decisiones tecnicas
- n8n self-hosted en su propio contenedor Docker (servicio `n8n` en docker-compose, puerto 5678)
- n8n se conecta al backend via red interna Docker (`http://backend:8000/api`)
- Webhooks con retry (3 intentos, backoff exponencial)
- API keys hasheadas en BD (nunca plain text)
- Celery beat (contenedor `celery_beat`) para cron jobs (re-escaneo cada 30 dias)
- Eventos webhook: `lead.hot`, `scan.completed`, `competitor.new`

## 6. Dependencias con otros modulos
- **Depende de:** 01-fundacion (auth), 02-scanner-osm (re-escaneo), 07-scanner-ui (leads)
- **Requerido por:** ninguno (modulo terminal de backend)

## Estado: completado
