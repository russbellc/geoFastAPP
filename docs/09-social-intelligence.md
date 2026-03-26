# 09 — Social Intelligence

> **Fase 3 — Modulos Avanzados** | **Sprint 9**

## 1. Objetivo
Monitorear redes sociales para detectar competidores SaaS de salud en LATAM. Analizar contenido, estrategia, engagement y mercados. Generar radar de competencia con gaps vs LiaFlow.

## 2. Modelos de BD involucrados
- Nueva tabla **competitors** (o extension de businesses):
  - name, type (saas_salud), country, markets[]
  - instagram_url, tiktok_url, facebook_url
  - followers, engagement_rate, posting_frequency
  - content_strategy (json), target_markets[]
  - ai_analysis (text), gap_vs_liaflow (text)
  - last_scanned_at

## 3. Endpoints creados
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | /competitors | Radar de competencia |
| GET | /competitors/{id} | Perfil detallado competidor |
| POST | /competitors/scan | Lanzar escaneo de competidores |

## 4. Tareas
- [ ] Scanner redes sociales: Instagram, TikTok, Facebook
- [ ] Keywords de busqueda: "sistema medico", "gestion clinica", "historia clinica digital"
- [ ] Perfil completo por competidor: contenido, estrategia, mercados
- [ ] Analisis IA: gaps y oportunidades vs LiaFlow
- [ ] Radar de competencia en dashboard (grafico radar/spider)
- [ ] Modelo competitors en BD
- [ ] Endpoints CRUD competidores

## 5. Decisiones tecnicas
- Scraping de perfiles publicos (no APIs oficiales — limitadas y costosas)
- Playwright para rendering de contenido dinamico de redes
- Claude API para analisis estrategico y deteccion de gaps
- Radar chart con Recharts para visualizar posicionamiento
- Escaneo periodico (no real-time) para evitar rate limiting

## 6. Dependencias con otros modulos
- **Depende de:** 03-enriquecimiento (scraping base), 04-ia-scoring (Claude API), 06-dashboard (radar visual)
- **Requerido por:** 10-automatizacion (alertas de competidores)

## Estado: pendiente
