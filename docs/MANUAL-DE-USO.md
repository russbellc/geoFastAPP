# GeoIntel Intelligence Core — Manual de Uso

## Credenciales de Prueba
```
Email:    demo@geointel.com
Password: demo2024
URL Web:  http://localhost:3000
```

---

## 1. Login / Registro

### Web
1. Abrir `http://localhost:3000`
2. Se muestra la pantalla de login con el design GeoIntel (dark theme)
3. Ingresar email y password
4. Click "SIGN IN"
5. Para crear cuenta: click "Register", ingresar nombre + email + password

### Mobile
1. Abrir la app GeoIntel en Android
2. La app se conecta al backend via WiFi local (192.168.1.52:8000)
3. Nota: El login en mobile se maneja via token almacenado

---

## 2. Intelligence Dashboard (Web: /dashboard/stats)

Vista principal con metricas en tiempo real.

### KPIs (tarjetas superiores)
- **Total Businesses**: Cantidad total de negocios escaneados
- **Generated Leads**: Negocios con perfil enriquecido
- **Territories Scanned**: Cantidad de categorias detectadas

### Geospatial Distribution
- Visualizacion placeholder del mapa de calor
- Botones Heatmap / Cluster para cambiar modo

### Registration Timeline
- Grafico de barras con distribucion de negocios por categoria
- Datos reales del API (Recharts)

### Market Distribution
- Grafico donut con porcentaje por categoria (salud, comercio, gastronomia, etc.)

### Recent Leads
- Ultimos 3 leads con status (High Potential, Monitoring, Contacted)

---

## 3. Territories / Mapa (Web: /dashboard | Mobile: tab Territories)

Mapa interactivo con negocios geolocalizados.

### Panel Izquierdo (Web) — Opportunities
- Lista scrolleable de negocios con:
  - Nombre y direccion
  - Opportunity Score (0-100)
  - Status badge: HOT (rojo), WARM (azul), COLD (gris)
  - Categoria badge
- **Filtros**:
  - Dropdown de categorias (salud, comercio, gastronomia, etc.)
  - Filtro por score (>80, >50)

### Mapa (derecho)
- Tiles CARTO Dark (mapa oscuro)
- Markers con glow effect por categoria
- Popups al hacer click con info del negocio
- Zoom controls + leyenda de territorio

### Mobile
- Mapa fullscreen con filter chips horizontales
- Bottom sheet "Nearby Intelligence" con preview de negocio
- FABs: Heatmap, GPS Scan, New Scan

---

## 4. Leads (Web: /dashboard/leads | Mobile: tab Leads)

Gestion de leads calificados.

### Vista Split (Web)
- **Panel izquierdo**: Lista de negocios con score y status
- **Panel derecho**: Perfil detallado del lead seleccionado

### Perfil de Lead
- **Header**: Nombre, categoria, direccion, status badge
- **Opportunity Score**: Circulo visual (0-100) con clasificacion:
  - 80-100 = HOT (contactar esta semana)
  - 50-79 = WARM (nutrir con contenido)
  - 0-49 = COLD (monitorear)
- **Intelligence Summary**: Resumen generado por IA (Groq)
- **Technology Detected**: CMS, frameworks, herramientas detectadas
- **Contact Info**: Telefono, website, email (clickeable)
- **Business Signals**: Booking online, Chatbot, SEO Score, Enrichment status
- **Social Footprint**: Links a Instagram, Facebook, TikTok

### Acciones
- **Execute Outreach**: Boton principal de accion
- **CSV**: Exportar datos a CSV
- **Report**: Abrir reporte PDF ejecutivo en browser

### Mobile
- Lista con filtros (All/Hot/Warm/Cold)
- Cards con score y status
- Tap para ver perfil completo
- Boton share/export en perfil

---

## 5. Scanner (Web: /dashboard/scan | Mobile: pantalla Scan)

Lanzar escaneos de inteligencia geoespacial.

### Modos de Escaneo (Web)
1. **Radius Scan**: Definir punto central (lat/lng) + radio en km
2. **Polygon Scan**: Dibujar poligono directamente en el mapa

### Campos del Formulario
- **Territory Name**: Nombre descriptivo (ej: "Miraflores Norte")
- **City**: Ciudad (default: Lima)
- **Latitude / Longitude**: Coordenadas del centro
- **Radius (km)**: Radio de busqueda (0.1 - 10 km)
- **Niche (opcional)**: Filtro de nicho (ej: "salud" activa Doctoralia + scoring LiaFlow)

### Proceso
1. Llenar formulario
2. Click "LAUNCH SCAN"
3. El sistema crea un territorio + job en Celery
4. Polling cada 3 segundos muestra progreso
5. Al terminar: muestra total de negocios encontrados

### Scan History
- Lista de escaneos previos con status (done/pending/failed)
- Muestra territorio, nicho, fecha y total encontrado

### Mobile — GPS Scan (/scan/mobile)
- Obtiene ubicacion GPS del dispositivo
- Slider para seleccionar radio (0.5 - 5 km)
- Lanza scan desde ubicacion actual
- Polling de status en tiempo real

---

## 6. Health Niche (Web: /dashboard/health)

Dashboard especializado para el sector salud.

### KPIs
- Total health businesses
- Enriched profiles
- Average opportunity score
- Hot leads count

### Subcategory Distribution
- Grafico de barras horizontal con subcategorias:
  farmacia, clinica, dentista, veterinaria, hospital, consultorio, etc.

### Lead Quality
- Donut chart con distribucion Hot/Warm/Cold

### Data Sources
- Muestra fuentes de datos (OSM, Doctoralia)

### Health Directory
- Grid de negocios de salud con iconos por subcategoria

---

## 7. Competitive Radar (Web: /dashboard/analytics)

Monitoreo de competidores SaaS salud en LATAM.

### Funcionalidad
1. Click "Scan Competitors" para cargar competidores conocidos
2. Se insertan 8 competidores SaaS salud LATAM:
   Doctoralia, Medilink, Nubimed, Dentalink, Huli, Nimbo, Siku, SimplePractice

### Cards de Competidor
- Nombre, pais, tipo
- Markets badges (peru, colombia, chile, etc.)
- Links sociales (website, Instagram, Facebook, LinkedIn)

### Detail Panel
- AI Analysis: analisis generado
- Gaps vs LiaFlow: oportunidades detectadas
- Target Markets
- Last Scanned date

---

## 8. Settings (Web: /dashboard/settings | Mobile: tab Settings)

Configuracion de integraciones.

### API Keys
- **Crear**: Nombre + permisos (read, scan, export)
- La key completa se muestra SOLO al crearla (copiarla inmediatamente)
- **Listar**: Muestra prefix + permisos + estado
- **Revocar**: Desactiva la key

### Webhooks
- **Registrar**: URL + seleccionar eventos
- **Eventos disponibles**:
  - `lead.hot` — nuevo lead caliente detectado
  - `scan.completed` — escaneo terminado
  - `competitor.new` — nuevo competidor detectado
  - `business.enriched` — negocio enriquecido
- **Eliminar**: Remueve el webhook
- Dispatch con HMAC signature + 3 retries

### App (Mobile)
- Clear Offline Cache
- Version info
- Sign Out

---

## 9. Export

### CSV
- Descarga archivo CSV con todos los negocios
- Campos: ID, Nombre, Categoria, Direccion, Telefono, Website, Email, Score, Lead Status

### PDF Report
- Reporte ejecutivo HTML estilizado con el design system GeoIntel
- KPIs: Total, Avg Score, Hot/Warm/Cold counts
- Tabla de negocios completa
- Se abre en browser, usar Ctrl+P para imprimir/guardar como PDF

---

## 10. Sistema de Scoring (Opportunity Score)

### Reglas Generales (max 100 pts)
| Regla | Puntos |
|-------|--------|
| No tiene sistema de gestion (CMS) | +30 |
| Activo en redes sociales (ultimos 30 dias) | +20 |
| Tiene redes pero sin actividad verificada | +10 |
| Web desactualizada o sin web | +15 |
| Zona de alta densidad (>20 negocios misma cat) | +12 |
| Sector salud | +10 |
| Sin agenda online | +8 |
| Sin chatbot ni WhatsApp | +5 |

### Bonus LiaFlow (solo salud)
| Regla | Puntos |
|-------|--------|
| Subcategoria alta prioridad (clinica, consultorio, etc.) | +5 |
| Tiene web pero NO tiene sistema clinico | +3 |

### Clasificacion de Leads
| Score | Status | Accion |
|-------|--------|--------|
| 80-100 | HOT | Contactar esta semana |
| 50-79 | WARM | Nutrir con contenido |
| 0-49 | COLD | Monitorear |

---

## 11. Arquitectura Tecnica

### Stack
- **Backend**: Python + FastAPI + Celery + Redis + PostgreSQL/PostGIS
- **Frontend Web**: Next.js 14 + Tailwind CSS + Leaflet.js + Recharts
- **Mobile**: Flutter + Riverpod + flutter_map + fl_chart
- **IA**: Groq API (summaries) + sentence-transformers (embeddings)

### URLs
| Servicio | URL |
|----------|-----|
| Frontend Web | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| Nginx | http://localhost:80 |

### Docker
```bash
# Levantar todo
docker compose up -d

# Ver logs
docker logs geointel-backend --tail 20
docker logs geointel-celery-worker --tail 20

# Reiniciar worker
docker restart geointel-celery-worker
```
