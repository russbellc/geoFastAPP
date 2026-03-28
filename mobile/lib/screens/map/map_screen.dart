import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:latlong2/latlong.dart';
import 'package:geointel_mobile/core/theme.dart';

class MapScreen extends StatefulWidget {
  const MapScreen({super.key});

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  final MapController _mapController = MapController();
  String _activeFilter = 'High Score';

  final List<String> _filters = ['High Score', 'Retail', 'Health', 'Services', '< 5km'];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Map
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: const LatLng(-12.0464, -77.0428),
              initialZoom: 14,
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
                subdomains: const ['a', 'b', 'c', 'd'],
              ),
              // Markers would go here from API data
            ],
          ),

          // Gradient overlay
          Positioned.fill(
            child: IgnorePointer(
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    stops: const [0, 0.15, 0.85, 1],
                    colors: [
                      GeoColors.background.withOpacity(0.9),
                      Colors.transparent,
                      Colors.transparent,
                      GeoColors.background.withOpacity(0.9),
                    ],
                  ),
                ),
              ),
            ),
          ),

          // Top bar
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: SafeArea(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Row(
                  children: [
                    Container(
                      width: 32, height: 32,
                      decoration: BoxDecoration(shape: BoxShape.circle, color: GeoColors.surfaceContainerHighest, border: Border.all(color: GeoColors.primary.withOpacity(0.2), width: 2)),
                      child: const Icon(Icons.person, color: GeoColors.onSurfaceVariant, size: 18),
                    ),
                    const SizedBox(width: 12),
                    Text('GeoIntel', style: GoogleFonts.manrope(fontWeight: FontWeight.w800, fontSize: 20, color: GeoColors.onSurface, letterSpacing: -1)),
                    const Spacer(),
                    IconButton(onPressed: () {}, icon: const Icon(Icons.search, color: GeoColors.primary)),
                  ],
                ),
              ),
            ),
          ),

          // Filter chips
          Positioned(
            top: MediaQuery.of(context).padding.top + 56,
            left: 0,
            right: 0,
            child: SizedBox(
              height: 40,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: _filters.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (_, i) {
                  final isActive = _filters[i] == _activeFilter;
                  return GestureDetector(
                    onTap: () => setState(() => _activeFilter = _filters[i]),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      decoration: BoxDecoration(
                        color: isActive ? GeoColors.primary : GeoColors.surfaceContainerHighest.withOpacity(0.8),
                        borderRadius: BorderRadius.circular(20),
                        border: isActive ? null : Border.all(color: GeoColors.outlineVariant.withOpacity(0.2)),
                      ),
                      child: Row(
                        children: [
                          if (isActive) ...[
                            Icon(Icons.filter_alt, size: 14, color: GeoColors.onPrimary),
                            const SizedBox(width: 4),
                          ],
                          Text(_filters[i], style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: isActive ? GeoColors.onPrimary : GeoColors.onSurface)),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ),

          // Zoom controls
          Positioned(
            right: 16,
            top: MediaQuery.of(context).size.height / 2 - 60,
            child: Column(
              children: [
                _MapButton(icon: Icons.add, onTap: () => _mapController.move(_mapController.camera.center, _mapController.camera.zoom + 1)),
                const SizedBox(height: 4),
                _MapButton(icon: Icons.remove, onTap: () => _mapController.move(_mapController.camera.center, _mapController.camera.zoom - 1)),
                const SizedBox(height: 12),
                _MapButton(icon: Icons.my_location, onTap: () {}, accent: true),
              ],
            ),
          ),

          // Scan FAB
          Positioned(
            right: 24,
            bottom: 220,
            child: GestureDetector(
              onTap: () => context.push('/scan'),
              child: Container(
                width: 56, height: 56,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: [GeoColors.primary, GeoColors.primaryContainer]),
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [BoxShadow(color: GeoColors.primaryContainer.withOpacity(0.4), blurRadius: 20, offset: const Offset(0, 8))],
                ),
                child: const Icon(Icons.add_location_alt, color: GeoColors.onPrimary, size: 28),
              ),
            ),
          ),

          // Bottom sheet
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              decoration: BoxDecoration(
                color: GeoColors.surfaceContainerLow,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                border: Border(top: BorderSide(color: GeoColors.outlineVariant.withOpacity(0.2))),
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.5), blurRadius: 40, offset: const Offset(0, -10))],
              ),
              padding: const EdgeInsets.fromLTRB(24, 8, 24, 100),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Drag handle
                  Container(width: 40, height: 4, decoration: BoxDecoration(color: GeoColors.outlineVariant.withOpacity(0.4), borderRadius: BorderRadius.circular(2))),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text('Nearby Intelligence', style: GoogleFonts.manrope(fontWeight: FontWeight.w700, fontSize: 18, color: GeoColors.onSurface)),
                        const SizedBox(height: 2),
                        const Text('12 active territories detected', style: TextStyle(fontSize: 12, color: GeoColors.onSurfaceVariant)),
                      ]),
                      const Icon(Icons.keyboard_arrow_up, color: GeoColors.primary),
                    ],
                  ),
                  const SizedBox(height: 16),
                  // Sample territory card
                  GestureDetector(
                    onTap: () => context.push('/profile/1'),
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: GeoColors.surfaceContainerHigh,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: GeoColors.outlineVariant.withOpacity(0.1)),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 48, height: 48,
                            decoration: BoxDecoration(color: GeoColors.tertiary.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
                            child: const Icon(Icons.storefront, color: GeoColors.tertiary),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                                const Text('Market District A', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: GeoColors.onSurface)),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(color: GeoColors.tertiary.withOpacity(0.1), borderRadius: BorderRadius.circular(4)),
                                  child: const Text('9.2 Score', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: GeoColors.tertiary)),
                                ),
                              ]),
                              const SizedBox(height: 4),
                              const Text('Ready for deployment • 0.8km away', style: TextStyle(fontSize: 12, color: GeoColors.onSurfaceVariant)),
                            ]),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _MapButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  final bool accent;
  const _MapButton({required this.icon, required this.onTap, this.accent = false});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 48, height: 48,
        decoration: BoxDecoration(
          color: GeoColors.surfaceContainerHighest.withOpacity(0.9),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: GeoColors.outlineVariant.withOpacity(0.2)),
        ),
        child: Icon(icon, color: accent ? GeoColors.primary : GeoColors.onSurface),
      ),
    );
  }
}
