import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:geointel_mobile/core/theme.dart';
import 'package:geointel_mobile/widgets/geo_top_bar.dart';
import 'package:geointel_mobile/widgets/kpi_card.dart';
import 'package:geointel_mobile/providers/providers.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  Map<String, dynamic>? _stats;
  List<Map<String, dynamic>> _recentLeads = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final api = ref.read(apiClientProvider);
      final biz = await api.getBusinesses(perPage: 5);
      final items = List<Map<String, dynamic>>.from(biz['items'] ?? []);

      // Try territory stats
      Map<String, dynamic>? stats;
      try {
        stats = await api.getTerritoryStats(1);
      } catch (_) {}

      // Try health stats for lead count
      Map<String, dynamic>? health;
      try {
        health = await api.getHealthStats();
      } catch (_) {}

      if (mounted) {
        setState(() {
          _stats = stats;
          _recentLeads = items;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final totalBiz = _stats?['total_businesses'] ?? 0;
    final totalEnriched = _stats?['total_enriched'] ?? 0;
    final categories = List<Map<String, dynamic>>.from(_stats?['categories'] ?? []);

    return Scaffold(
      appBar: const GeoTopBar(),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: GeoColors.primary))
          : RefreshIndicator(
              onRefresh: _loadData,
              color: GeoColors.primary,
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 120),
                children: [
                  // KPIs
                  SizedBox(
                    height: 120,
                    child: ListView(
                      scrollDirection: Axis.horizontal,
                      children: [
                        KpiCard(label: 'Negocios', value: _formatNum(totalBiz), trend: '+${categories.length} cats', borderColor: GeoColors.primary, onTap: () => context.go('/leads')),
                        const SizedBox(width: 12),
                        KpiCard(label: 'Enriquecidos', value: '$totalEnriched', trend: 'perfiles', borderColor: GeoColors.error, onTap: () => context.go('/leads')),
                        const SizedBox(width: 12),
                        KpiCard(label: 'Categorias', value: '${categories.length}', borderColor: GeoColors.secondary, onTap: () => context.go('/territories')),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Map preview
                  GestureDetector(
                    onTap: () => context.go('/territories'),
                    child: Container(
                      decoration: BoxDecoration(color: GeoColors.surfaceContainer, borderRadius: BorderRadius.circular(12)),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Padding(
                            padding: const EdgeInsets.all(16),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                  Text('Cobertura Activa', style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w700, color: GeoColors.onSurface, letterSpacing: -0.3)),
                                  const Text('Mapa de densidad de inteligencia en vivo', style: TextStyle(fontSize: 12, color: GeoColors.onSurfaceVariant)),
                                ]),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                  decoration: BoxDecoration(color: GeoColors.surfaceContainerHighest, borderRadius: BorderRadius.circular(8)),
                                  child: const Text('ABRIR MAPA', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: GeoColors.primary)),
                                ),
                              ],
                            ),
                          ),
                          Container(
                            height: 160,
                            decoration: const BoxDecoration(color: GeoColors.surfaceContainerLowest, borderRadius: BorderRadius.only(bottomLeft: Radius.circular(12), bottomRight: Radius.circular(12))),
                            child: Stack(children: [
                              Positioned(top: 50, left: 80, child: Container(width: 60, height: 60, decoration: BoxDecoration(shape: BoxShape.circle, color: GeoColors.primary.withOpacity(0.15)))),
                              Positioned(top: 20, right: 60, child: Container(width: 40, height: 40, decoration: BoxDecoration(shape: BoxShape.circle, color: GeoColors.tertiary.withOpacity(0.1)))),
                              Positioned.fill(child: Container(decoration: BoxDecoration(gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Colors.transparent, GeoColors.surfaceContainer.withOpacity(0.8)]), borderRadius: const BorderRadius.only(bottomLeft: Radius.circular(12), bottomRight: Radius.circular(12))))),
                            ]),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Market Distribution
                  if (categories.isNotEmpty)
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(color: GeoColors.surfaceContainer, borderRadius: BorderRadius.circular(12)),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Distribucion del Mercado', style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w700, color: GeoColors.onSurface)),
                          const SizedBox(height: 16),
                          ...categories.take(5).map((cat) {
                            final pct = totalBiz > 0 ? ((cat['count'] as int) / totalBiz * 100).toStringAsFixed(0) : '0';
                            return Padding(
                              padding: const EdgeInsets.only(bottom: 10),
                              child: Row(children: [
                                Container(width: 8, height: 8, decoration: BoxDecoration(shape: BoxShape.circle, color: _catColor(cat['category'] as String))),
                                const SizedBox(width: 10),
                                Expanded(child: Text(cat['category'] as String, style: const TextStyle(fontSize: 13, color: GeoColors.onSurface))),
                                Text('$pct%', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: GeoColors.onSurface)),
                                const SizedBox(width: 8),
                                Text('(${cat['count']})', style: const TextStyle(fontSize: 11, color: GeoColors.onSurfaceVariant)),
                              ]),
                            );
                          }),
                        ],
                      ),
                    ),
                  const SizedBox(height: 24),

                  // Recent businesses
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(color: GeoColors.surfaceContainer, borderRadius: BorderRadius.circular(12)),
                    child: Column(
                      children: [
                        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                          Text('Negocios Recientes', style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w700, color: GeoColors.onSurface)),
                          GestureDetector(onTap: () => context.go('/leads'), child: const Text('VER TODO', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: GeoColors.primary, letterSpacing: 1.2))),
                        ]),
                        const SizedBox(height: 12),
                        ..._recentLeads.map((biz) => _BizTile(
                          name: biz['name'] as String? ?? 'Desconocido',
                          category: biz['category'] as String? ?? 'otro',
                          address: biz['address'] as String?,
                          onTap: () => context.push('/profile/${biz['id']}'),
                        )),
                      ],
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  String _formatNum(int n) => n >= 1000 ? '${(n / 1000).toStringAsFixed(1)}k' : '$n';

  Color _catColor(String cat) {
    switch (cat) {
      case 'salud': return GeoColors.tertiary;
      case 'gastronomia': return GeoColors.error;
      case 'comercio': return GeoColors.primary;
      case 'servicios': return GeoColors.secondary;
      case 'educacion': return const Color(0xFF7F9FFF);
      default: return GeoColors.outline;
    }
  }
}

class _BizTile extends StatelessWidget {
  final String name, category;
  final String? address;
  final VoidCallback? onTap;
  const _BizTile({required this.name, required this.category, this.address, this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 10),
        child: Row(children: [
          Container(width: 40, height: 40, decoration: BoxDecoration(color: GeoColors.surfaceContainerHigh, borderRadius: BorderRadius.circular(8)), child: const Icon(Icons.storefront, color: GeoColors.primary, size: 20)),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(name, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: GeoColors.onSurface), maxLines: 1, overflow: TextOverflow.ellipsis),
            Text('${category} ${address != null ? "• $address" : ""}', style: const TextStyle(fontSize: 10, color: GeoColors.onSurfaceVariant), maxLines: 1, overflow: TextOverflow.ellipsis),
          ])),
        ]),
      ),
    );
  }
}
