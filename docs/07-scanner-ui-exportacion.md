# 07 — Scanner UI + Exportacion

> **Fase 2 — Frontend Web** | **Sprint 7**

## 1. Objetivo
Interfaz para lanzar escaneos con progress bar en tiempo real (WebSocket), historial de escaneos, exportacion de datos a CSV/Excel y PDF, y vista de leads calientes.

## 2. Modelos de BD involucrados
- **scan_jobs** — crear, leer estado, historial
- **businesses** — exportar datos filtrados
- **business_profiles** — leads calientes, datos para exportacion

## 3. Endpoints consumidos
| Metodo | Ruta | Uso en frontend |
|--------|------|-----------------|
| POST | /scans/territory | Lanzar escaneo desde UI |
| GET | /scans/{id}/status | Polling status (fallback) |
| WS | /ws/scan/{job_id} | Progreso en tiempo real |
| POST | /export/csv | Exportar leads a CSV |
| POST | /export/pdf | Reporte ejecutivo PDF |

## 4. Tareas
- [x] UI para lanzar escaneo: seleccionar territorio, nicho, radio/poligono
- [ ] Progress bar con WebSocket (/ws/scan/{job_id}) — usa polling como fallback
- [x] Historial de escaneos: lista con estado, fecha, resultados (GET /scans/history)
- [x] Exportacion CSV con filtros aplicados (GET /export/csv)
- [x] Exportacion PDF: reporte ejecutivo HTML estilizado (GET /export/pdf) — printable via browser
- [x] Vista leads calientes: perfil detallado con score, tech stack, social footprint
- [x] Backend: endpoints GET /export/csv y GET /export/pdf

## 5. Decisiones tecnicas
- WebSocket para progreso real-time (no polling)
- Fallback a polling GET /scans/{id}/status si WS falla
- PDF generado server-side (WeasyPrint o similar)
- CSV streaming para datasets grandes
- Vista leads calientes ordenada por opportunity_score desc

## 6. Dependencias con otros modulos
- **Depende de:** 05-frontend-mapa, 06-dashboard, 02-scanner-osm (job system)
- **Requerido por:** 10-automatizacion (triggers basados en leads)

## Estado: completado
