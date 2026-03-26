# 13 — Mobile Features Avanzados

> **Fase 4 — Mobile Flutter** | **Sprint 13**

## 1. Objetivo
Features avanzados mobile: escanear zona desde ubicacion actual, mapa de calor, exportar PDF y modo offline basico.

## 2. Modelos de BD involucrados
- **scan_jobs** — crear escaneo desde mobile
- **territories** — territorio creado desde ubicacion mobile
- **businesses** — datos para mapa de calor y PDF
- **business_profiles** — datos para exportacion

## 3. Endpoints consumidos (API existente)
| Metodo | Ruta | Uso en mobile |
|--------|------|---------------|
| POST | /scans/territory | Lanzar escaneo desde ubicacion actual |
| WS | /ws/scan/{job_id} | Progreso del escaneo |
| POST | /export/pdf | Generar reporte PDF |
| GET | /businesses | Datos para cache offline |

## 4. Tareas
- [ ] Escanear zona desde mobile: seleccionar radio desde ubicacion GPS actual
- [ ] Progress bar de escaneo con WebSocket
- [ ] Mapa de calor mobile (heatmap overlay en flutter_map)
- [ ] Exportar PDF desde mobile: descargar y compartir
- [ ] Modo offline basico: cache de negocios consultados
- [ ] Sincronizacion al volver online
- [ ] Share sheet: compartir perfil de negocio o reporte

## 5. Decisiones tecnicas
- Escaneo desde mobile usa mismo endpoint POST /scans/territory (territorio creado con radio desde GPS)
- Mapa de calor con flutter_map_heatmap plugin
- PDF generado server-side, descargado via API (no generado en mobile)
- Cache offline con sqflite o Hive (almacenamiento local ligero)
- Sync strategy: cache-first, refresh on connectivity

## 6. Dependencias con otros modulos
- **Depende de:** 11-mobile-setup, 12-mobile-dashboard, 02-scanner-osm, 07-scanner-ui (export)
- **Requerido por:** ninguno (sprint final)

## Estado: pendiente
