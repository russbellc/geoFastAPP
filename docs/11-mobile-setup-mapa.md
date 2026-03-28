# 11 — Mobile Setup + Mapa

> **Fase 4 — Mobile Flutter** | **Sprint 11**

## 1. Objetivo
Setup de la app mobile con Flutter, mapa interactivo con flutter_map/OpenStreetMap, vista de negocios cercanos a la ubicacion actual y perfil basico de negocio.

## 2. Modelos de BD involucrados
- **territories** — lectura via API
- **businesses** — negocios cercanos a ubicacion GPS
- **business_profiles** — score y datos basicos

## 3. Endpoints consumidos (API existente)
| Metodo | Ruta | Uso en mobile |
|--------|------|---------------|
| GET | /businesses?lat=X&lng=Y&radius=Z | Negocios cercanos |
| GET | /businesses/{id}/profile | Perfil de negocio |
| POST | /auth/login | Login |
| POST | /auth/register | Registro |

## 4. Tareas
- [ ] Setup Flutter + Riverpod 3.0 + go_router + freezed
- [ ] Modelos freezed para entities (Business, Territory, Profile)
- [ ] flutter_map con OpenStreetMap tiles
- [ ] Geolocalizacion: obtener ubicacion actual del dispositivo
- [ ] Vista negocios cercanos (mapa + lista)
- [ ] Perfil basico de negocio (nombre, categoria, score, contacto)
- [ ] Autenticacion (login/registro, JWT storage seguro)
- [ ] API client (dio/http) conectado al backend

## 5. Decisiones tecnicas
- Flutter sobre React Native (rendimiento nativo, Dart type-safe)
- Riverpod 3.0 para state management (mejor que Provider, mas testeable)
- flutter_map sobre google_maps_flutter (gratis, consistente con web)
- freezed para modelos inmutables con JSON serialization
- go_router para navegacion declarativa
- JWT almacenado en flutter_secure_storage

## 6. Dependencias con otros modulos
- **Depende de:** 01-fundacion (API auth), 02-scanner-osm (datos), 04-ia-scoring (scores)
- **Requerido por:** 12-mobile-dashboard, 13-mobile-avanzado

## Estado: completado

## Implementacion
- Flutter 3.2+ con Riverpod 2.x + go_router + flutter_map + fl_chart
- Design system identico al web: dark theme #0b1326, Manrope/Inter, Material icons
- 6 pantallas: Dashboard, Map, Leads, Scan, Profile, Settings
- Bottom navigation bar con 4 tabs (Intelligence, Territories, Leads, Settings)
- API client con Dio + SharedPreferences para token JWT
- CARTO Dark tiles en mapa con flutter_map
- Estructura: lib/core, lib/providers, lib/screens, lib/widgets
- Referencia UI: docs/flutter-geointel.html
