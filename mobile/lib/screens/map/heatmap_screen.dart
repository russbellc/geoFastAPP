import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:latlong2/latlong.dart';
import 'package:geointel_mobile/core/theme.dart';
import 'package:geointel_mobile/providers/providers.dart';
import 'package:geointel_mobile/widgets/geo_top_bar.dart';

class HeatmapScreen extends ConsumerStatefulWidget {
  const HeatmapScreen({super.key});

  @override
  ConsumerState<HeatmapScreen> createState() => _HeatmapScreenState();
}

class _HeatmapScreenState extends ConsumerState<HeatmapScreen> {
  List<Map<String, dynamic>> _businesses = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final api = ref.read(apiClientProvider);
      final result = await api.getBusinesses(perPage: 100);
      setState(() {
        _businesses = List<Map<String, dynamic>>.from(result['items'] ?? []);
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const GeoTopBar(title: 'Heat Map', showBack: true, showSearch: false),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: GeoColors.primary))
          : Stack(
              children: [
                FlutterMap(
                  options: MapOptions(
                    initialCenter: _businesses.isNotEmpty
                        ? LatLng(
                            (_businesses.first['lat'] as num?)?.toDouble() ?? -12.0464,
                            (_businesses.first['lng'] as num?)?.toDouble() ?? -77.0428,
                          )
                        : const LatLng(-12.0464, -77.0428),
                    initialZoom: 13,
                  ),
                  children: [
                    TileLayer(
                      urlTemplate: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
                      subdomains: const ['a', 'b', 'c', 'd'],
                    ),
                    // Heatmap circles layer
                    CircleLayer(
                      circles: _businesses
                          .where((b) => b['lat'] != null && b['lng'] != null)
                          .map((b) {
                        final cat = b['category'] as String? ?? 'otro';
                        final color = _categoryColor(cat);
                        return CircleMarker(
                          point: LatLng(
                            (b['lat'] as num).toDouble(),
                            (b['lng'] as num).toDouble(),
                          ),
                          radius: 30,
                          color: color.withOpacity(0.15),
                          borderStrokeWidth: 0,
                        );
                      }).toList(),
                    ),
                    // Dot markers
                    CircleLayer(
                      circles: _businesses
                          .where((b) => b['lat'] != null && b['lng'] != null)
                          .map((b) {
                        final cat = b['category'] as String? ?? 'otro';
                        final color = _categoryColor(cat);
                        return CircleMarker(
                          point: LatLng(
                            (b['lat'] as num).toDouble(),
                            (b['lng'] as num).toDouble(),
                          ),
                          radius: 5,
                          color: color.withOpacity(0.8),
                          borderColor: color,
                          borderStrokeWidth: 1,
                        );
                      }).toList(),
                    ),
                  ],
                ),
                // Legend
                Positioned(
                  bottom: 24,
                  left: 16,
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: GeoColors.surfaceContainerLow.withOpacity(0.9),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: GeoColors.outlineVariant.withOpacity(0.1)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text('DENSITY MAP', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.5, color: GeoColors.onSurfaceVariant)),
                        const SizedBox(height: 10),
                        _LegendDot(color: GeoColors.primary, label: 'Commerce'),
                        const SizedBox(height: 6),
                        _LegendDot(color: GeoColors.tertiary, label: 'Health'),
                        const SizedBox(height: 6),
                        _LegendDot(color: GeoColors.secondary, label: 'Services'),
                        const SizedBox(height: 6),
                        _LegendDot(color: GeoColors.error, label: 'Food'),
                        const SizedBox(height: 10),
                        Text('${_businesses.length} businesses', style: const TextStyle(fontSize: 11, color: GeoColors.onSurfaceVariant)),
                      ],
                    ),
                  ),
                ),
              ],
            ),
    );
  }

  Color _categoryColor(String category) {
    switch (category) {
      case 'salud': return GeoColors.tertiary;
      case 'gastronomia': return GeoColors.error;
      case 'comercio': return GeoColors.primary;
      case 'servicios': return GeoColors.secondary;
      case 'educacion': return const Color(0xFF7F9FFF);
      case 'turismo': return const Color(0xFF4EDEA3);
      default: return GeoColors.outline;
    }
  }
}

class _LegendDot extends StatelessWidget {
  final Color color;
  final String label;
  const _LegendDot({required this.color, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(children: [
      Container(width: 8, height: 8, decoration: BoxDecoration(shape: BoxShape.circle, color: color, boxShadow: [BoxShadow(color: color.withOpacity(0.5), blurRadius: 6)])),
      const SizedBox(width: 8),
      Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: GeoColors.onSurface)),
    ]);
  }
}
