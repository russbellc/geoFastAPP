# 12 — Mobile Dashboard

> **Fase 4 — Mobile Flutter** | **Sprint 12**

## 1. Objetivo
Dashboard mobile con metricas principales, lista de leads calientes, busqueda con IA y notificaciones push.

## 2. Modelos de BD involucrados
- **businesses** — conteos, listados
- **business_profiles** — scores, lead_status para leads calientes
- **territories** — stats agregadas

## 3. Endpoints consumidos (API existente)
| Metodo | Ruta | Uso en mobile |
|--------|------|---------------|
| GET | /stats/territory/{id} | Metricas dashboard |
| GET | /businesses?lead_status=hot | Leads calientes |
| POST | /search/semantic | Busqueda con IA |

## 4. Tareas
- [ ] Dashboard principal: metricas con fl_chart (barras, pie, lineas)
- [ ] Lista leads calientes: ordenada por score, accion rapida (llamar, WhatsApp)
- [ ] Busqueda con IA: input de texto natural → resultados semanticos
- [ ] Notificaciones push: nuevo lead hot, escaneo completado
- [ ] Setup Firebase Cloud Messaging (FCM)
- [ ] Backend: endpoint para registrar device token
- [ ] Pull-to-refresh en listas

## 5. Decisiones tecnicas
- fl_chart para graficos mobile (ligero, buen rendimiento)
- Firebase Cloud Messaging para push notifications
- Busqueda semantica reutiliza endpoint existente POST /search/semantic
- Cache local con Riverpod para reducir llamadas API
- Accion rapida en leads: deep links a telefono, WhatsApp, email

## 6. Dependencias con otros modulos
- **Depende de:** 11-mobile-setup (base mobile), 04-ia-scoring (busqueda semantica)
- **Requerido por:** 13-mobile-avanzado

## Estado: pendiente
