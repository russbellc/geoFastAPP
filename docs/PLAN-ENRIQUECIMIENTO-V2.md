# Plan: Enriquecimiento V2

## Objetivo
Mejorar el motor de enriquecimiento para que funcione con todos los negocios (no solo los que tienen website), integrando Google Maps como fuente principal y mejorando la UX.

---

## Fase 1 — Enriquecimiento con Google Maps
**Prioridad: Alta | Impacto: Alto**

### Backend
- [ ] Crear `enrich_gmaps()` en `enrich_tasks.py` que:
  - Busca el negocio en Google Maps por nombre + ciudad
  - Extrae: rating, reviews count, horarios, categoria GMaps, telefono, website
  - Actualiza `business_profiles` con datos nuevos
  - Si encuentra website que no teniamos, lanza el scraping web existente
- [ ] Modificar `_run_enrich()` para intentar GMaps ANTES del scraping web
- [ ] Guardar rating/reviews en business_profile (nuevos campos o en tech_stack JSON)

### Frontend
- [ ] Modal: mostrar rating (estrellas), reviews count, horarios si disponibles
- [ ] Badge "GMaps" si fue enriquecido por Google Maps

---

## Fase 2 — Enriquecimiento por Lote
**Prioridad: Alta | Impacto: Alto**

### Backend
- [ ] Endpoint `POST /businesses/enrich/batch` que acepta filtros (territory_id, category, etc.)
- [ ] Celery task que procesa en cola con rate limits (1 negocio cada 10-15s para GMaps)
- [ ] Tracking de progreso: total a enriquecer, procesados, exitosos, fallidos

### Frontend
- [ ] Boton "Enriquecer Todos" en la pagina de Leads con filtros aplicados
- [ ] Barra de progreso: "Enriqueciendo 45/200 negocios..."
- [ ] Notificacion cuando termine

---

## Fase 3 — Score Sin Web
**Prioridad: Media | Impacto: Medio**

### Backend
- [ ] Modificar `calculate_opportunity_score()` para dar puntos parciales:
  - +5 pts si tiene telefono pero no website (facil de contactar)
  - +3 pts si tiene rating GMaps < 4.0 (oportunidad de mejora)
  - +5 pts si tiene pocas reviews (< 10) = poca presencia digital
  - +3 pts si horario no disponible en GMaps (falta de presencia)
- [ ] Generar resumen IA basado en datos GMaps aunque no tenga web:
  - "Negocio con rating 4.2 (45 reviews). No tiene presencia web. Categoria: clinica dental."

---

## Fase 4 — Feedback Visual Mejorado
**Prioridad: Media | Impacto: Medio**

### Frontend
- [ ] Boton "Enriquecer" muestra spinner mientras procesa
- [ ] Polling cada 5s para detectar cuando el perfil se actualizo
- [ ] Toast notification: "Negocio enriquecido - Score: 78 (Tibio)"
- [ ] Auto-refresh del modal cuando termina
- [ ] En el grid de leads, badge visual "enriquecido" vs "pendiente"
- [ ] Icono de estrellas para rating de GMaps

---

## Orden de Implementacion
1. Fase 1 (GMaps enrich) — base para todo lo demas
2. Fase 4 (feedback visual) — mejora UX inmediata
3. Fase 2 (batch) — escala el enriquecimiento
4. Fase 3 (score sin web) — refina la inteligencia

## Estimacion
- Fase 1: ~2 horas
- Fase 2: ~1 hora
- Fase 3: ~30 min
- Fase 4: ~1 hora
- **Total: ~4.5 horas**
