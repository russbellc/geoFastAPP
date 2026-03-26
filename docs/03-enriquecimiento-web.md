# 03 — Motor de Enriquecimiento Web

> **Fase 1 — Backend Core** | **Sprint 3**

## 1. Objetivo
Enriquecer perfiles de negocios via web scraping con Playwright. Detectar tech stack, servicios ofrecidos, presencia en redes sociales, agenda online, chatbot y SEO basico.

## 2. Modelos de BD involucrados
- **businesses** — lectura para obtener URLs
- **business_profiles** — se pueblan/actualizan con datos enriquecidos

## 3. Endpoints creados
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | /businesses/{id}/profile | Perfil completo enriquecido |

## 4. Tareas
- [ ] Playwright scraper: extraer servicios de paginas web
- [ ] Integracion Wappalyzer: detectar tech stack (CMS, frameworks, sistemas)
- [ ] Detectar agenda online (booking links, calendly, etc.)
- [ ] Detectar chatbot y WhatsApp link
- [ ] SEO basico: meta tags, title, description, H1
- [ ] Crawler redes sociales: detectar links a FB/IG/TikTok
- [ ] Extraer seguidores y fecha ultima publicacion
- [ ] Job queue para enriquecimiento masivo (Celery)
- [ ] Endpoint GET /businesses/{id}/profile

## 5. Decisiones tecnicas
- Playwright para scraping con JS rendering (SPAs, sitios dinamicos)
- Wappalyzer como libreria local (no API externa) para deteccion de tech
- Enriquecimiento progresivo: datos basicos → web → redes sociales
- Rate limiting por dominio para evitar bloqueos
- Logs estructurados por job_id para debugging

## 6. Dependencias con otros modulos
- **Depende de:** 01-fundacion, 02-scanner-osm (negocios ya escaneados)
- **Requerido por:** 04-ia-scoring (necesita datos enriquecidos para scoring)

## Estado: pendiente
