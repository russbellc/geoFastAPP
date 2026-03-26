# 04 — IA + Scoring + Vectores

> **Fase 1 — Backend Core** | **Sprint 4**

## 1. Objetivo
Implementar analisis con IA (Claude API) para generar resumenes por negocio, sistema de scoring 0-100 para clasificar oportunidades, y busqueda semantica con pgvector.

## 2. Modelos de BD involucrados
- **business_profiles** — ai_summary, opportunity_score, lead_status se actualizan
- **businesses** — lectura para contexto
- Tabla de **embeddings** (pgvector) — nueva, para busqueda semantica

## 3. Endpoints creados
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | /search/semantic | Busqueda en lenguaje natural |
| GET | /stats/territory/{id} | Metricas y reportes del territorio |

## 4. Tareas
- [x] Integracion Groq API: generar ai_summary por negocio (llama-3.1-8b-instant)
- [x] Sistema de scoring 0-100 (reglas fijas)
- [x] Clasificacion automatica: cold (0-49) / warm (50-79) / hot (80-100)
- [x] Setup pgvector: tabla business_embeddings (384 dims)
- [x] Modelo sentence-transformers (paraphrase-multilingual-MiniLM-L12-v2)
- [x] Busqueda semantica: POST /search/semantic
- [x] Endpoint GET /stats/territory/{id}
- [x] Scoring + IA + embeddings integrados en task de enriquecimiento

## 5. Decisiones tecnicas
- Groq API para resumenes IA (rapido, modelo llama-3.1-8b-instant)
- Scoring basado en reglas fijas (no ML) para transparencia y control
- pgvector integrado en PostgreSQL (sin servicio externo)
- sentence-transformers multilingue para embeddings (~100MB)
- Embeddings generados al momento del enriquecimiento

### Sistema de scoring
```
+30 pts → No tiene sistema de gestion detectado
+20 pts → Activo en redes sociales (ultimos 30 dias)
+15 pts → Web desactualizada o sin web
+12 pts → Zona de alta densidad del nicho
+10 pts → Sector salud (nicho prioritario)
+ 8 pts → Sin agenda online
+ 5 pts → Sin chatbot ni WhatsApp link
```

## 6. Dependencias con otros modulos
- **Depende de:** 01-fundacion, 02-scanner-osm, 03-enriquecimiento (datos completos)
- **Requerido por:** 05-frontend-mapa (mostrar scores), 08-nicho-salud, 09-social-intelligence

## Estado: completado
