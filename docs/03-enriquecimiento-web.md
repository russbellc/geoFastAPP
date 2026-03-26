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
- [x] Playwright scraper con Chromium en Docker
- [x] Detectar tech stack via regex (wordpress, wix, shopify, react, etc.)
- [x] Detectar agenda online (calendly, booksy, reservio, etc.)
- [x] Detectar chatbot (tawk, crisp, intercom, drift, etc.)
- [x] Detectar WhatsApp link
- [x] SEO basico: title, meta description, H1, HTTPS
- [x] Extraer links a Facebook, Instagram, TikTok
- [ ] Extraer seguidores y fecha ultima publicacion (requiere scraping de redes)
- [x] Job queue: enrich_business + enrich_territory (Celery)
- [x] GET /businesses/{id}/profile
- [x] POST /businesses/{id}/enrich
- [x] POST /businesses/enrich/territory/{id}

## 5. Decisiones tecnicas
- Playwright + Chromium headless para JS rendering
- Tech detection via regex en HTML (no Wappalyzer — evita dependencia pesada)
- SEO score: title(30) + meta_desc(30) + H1(20) + HTTPS(20) = max 100
- Enriquecimiento individual o masivo via Celery
- BeautifulSoup para parseo de HTML

## 6. Dependencias con otros modulos
- **Depende de:** 01-fundacion, 02-scanner-osm (negocios ya escaneados)
- **Requerido por:** 04-ia-scoring (necesita datos enriquecidos para scoring)

## Estado: completado
