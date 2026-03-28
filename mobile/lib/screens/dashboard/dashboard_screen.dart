import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:geointel_mobile/core/theme.dart';
import 'package:geointel_mobile/widgets/geo_top_bar.dart';
import 'package:geointel_mobile/widgets/kpi_card.dart';
import 'package:geointel_mobile/providers/providers.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: const GeoTopBar(),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 120),
        children: [
          // KPI Horizontal Scroll
          SizedBox(
            height: 120,
            child: ListView(
              scrollDirection: Axis.horizontal,
              children: [
                KpiCard(label: 'Total Businesses', value: '12,842', trend: '+8.2%', borderColor: GeoColors.primary, onTap: () => context.go('/leads')),
                const SizedBox(width: 12),
                KpiCard(label: 'Leads', value: '458', trend: '+12%', borderColor: GeoColors.error, onTap: () => context.go('/leads')),
                const SizedBox(width: 12),
                KpiCard(label: 'Territories', value: '24', trend: 'Stable', borderColor: GeoColors.secondary, onTap: () => context.go('/territories')),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Active Coverage Map
          GestureDetector(
            onTap: () => context.go('/territories'),
            child: Container(
              decoration: BoxDecoration(
                color: GeoColors.surfaceContainer,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Active Coverage', style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w700, color: GeoColors.onSurface, letterSpacing: -0.3)),
                            const SizedBox(height: 2),
                            const Text('Live intelligence density map', style: TextStyle(fontSize: 12, color: GeoColors.onSurfaceVariant)),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(color: GeoColors.surfaceContainerHighest, borderRadius: BorderRadius.circular(8)),
                          child: Row(
                            children: [
                              const Icon(Icons.open_in_full, size: 14, color: GeoColors.primary),
                              const SizedBox(width: 4),
                              Text('MAXIMIZE', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: GeoColors.primary)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  // Map placeholder
                  Container(
                    height: 180,
                    decoration: BoxDecoration(
                      color: GeoColors.surfaceContainerLowest,
                      borderRadius: const BorderRadius.only(
                        bottomLeft: Radius.circular(12),
                        bottomRight: Radius.circular(12),
                      ),
                    ),
                    child: Stack(
                      children: [
                        // Decorative heatmap blobs
                        Positioned(top: 60, left: 80, child: Container(width: 60, height: 60, decoration: BoxDecoration(shape: BoxShape.circle, color: GeoColors.primary.withOpacity(0.15), boxShadow: [BoxShadow(color: GeoColors.primary.withOpacity(0.1), blurRadius: 40)]))),
                        Positioned(top: 30, right: 60, child: Container(width: 40, height: 40, decoration: BoxDecoration(shape: BoxShape.circle, color: GeoColors.tertiary.withOpacity(0.1), boxShadow: [BoxShadow(color: GeoColors.tertiary.withOpacity(0.08), blurRadius: 30)]))),
                        // Gradient overlay
                        Positioned.fill(
                          child: Container(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.topCenter,
                                end: Alignment.bottomCenter,
                                colors: [Colors.transparent, GeoColors.surfaceContainer.withOpacity(0.8)],
                              ),
                              borderRadius: const BorderRadius.only(bottomLeft: Radius.circular(12), bottomRight: Radius.circular(12)),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),

          // Market Distribution
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: GeoColors.surfaceContainer, borderRadius: BorderRadius.circular(12)),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Market Distribution', style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w700, color: GeoColors.onSurface, letterSpacing: -0.3)),
                const SizedBox(height: 16),
                Row(
                  children: [
                    // Donut placeholder
                    SizedBox(
                      width: 100,
                      height: 100,
                      child: CustomPaint(painter: _DonutPainter()),
                    ),
                    const SizedBox(width: 24),
                    Expanded(
                      child: Column(
                        children: [
                          _LegendItem(color: GeoColors.primary, label: 'Retail', value: '64%'),
                          const SizedBox(height: 12),
                          _LegendItem(color: GeoColors.tertiary, label: 'Service', value: '22%'),
                          const SizedBox(height: 12),
                          _LegendItem(color: GeoColors.surfaceVariant, label: 'Tech', value: '14%'),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Recent Leads
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: GeoColors.surfaceContainer, borderRadius: BorderRadius.circular(12)),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Recent Leads', style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w700, color: GeoColors.onSurface, letterSpacing: -0.3)),
                    GestureDetector(
                      onTap: () => context.go('/leads'),
                      child: const Text('VIEW ALL', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: GeoColors.primary, letterSpacing: 1.2)),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                _LeadTile(name: 'Jordan Dynamics', category: 'Retail', time: '2h ago', status: 'Hot', statusColor: GeoColors.error, onTap: () => context.push('/profile/1')),
                _LeadTile(name: 'Apex Solutions', category: 'Consulting', time: '5h ago', status: 'Warm', statusColor: GeoColors.tertiary, onTap: () => context.push('/profile/2')),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _LegendItem extends StatelessWidget {
  final Color color;
  final String label;
  final String value;
  const _LegendItem({required this.color, required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(children: [
          Container(width: 8, height: 8, decoration: BoxDecoration(shape: BoxShape.circle, color: color)),
          const SizedBox(width: 8),
          Text(label, style: const TextStyle(fontSize: 12, color: GeoColors.onSurfaceVariant)),
        ]),
        Text(value, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: GeoColors.onSurface)),
      ],
    );
  }
}

class _LeadTile extends StatelessWidget {
  final String name, category, time, status;
  final Color statusColor;
  final VoidCallback? onTap;
  const _LeadTile({required this.name, required this.category, required this.time, required this.status, required this.statusColor, this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 12),
        child: Row(
          children: [
            Container(
              width: 40, height: 40,
              decoration: BoxDecoration(color: GeoColors.surfaceContainerHigh, borderRadius: BorderRadius.circular(8), border: Border.all(color: GeoColors.outlineVariant.withOpacity(0.3))),
              child: const Icon(Icons.storefront, color: GeoColors.primary, size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(name, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: GeoColors.onSurface)),
                  Text('$category • $time', style: const TextStyle(fontSize: 10, color: GeoColors.onSurfaceVariant)),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(color: statusColor.withOpacity(0.15), borderRadius: BorderRadius.circular(20)),
              child: Text(status.toUpperCase(), style: TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: statusColor)),
            ),
          ],
        ),
      ),
    );
  }
}

class _DonutPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2 - 8;
    final strokeWidth = 12.0;
    final bgPaint = Paint()..color = GeoColors.surfaceContainerHighest..style = PaintingStyle.stroke..strokeWidth = strokeWidth;
    final primaryPaint = Paint()..color = GeoColors.primary..style = PaintingStyle.stroke..strokeWidth = strokeWidth..strokeCap = StrokeCap.round;
    final tertiaryPaint = Paint()..color = GeoColors.tertiary..style = PaintingStyle.stroke..strokeWidth = strokeWidth..strokeCap = StrokeCap.round;

    canvas.drawCircle(center, radius, bgPaint);
    // Primary arc (64%)
    canvas.drawArc(Rect.fromCircle(center: center, radius: radius), -1.57, 4.02, false, primaryPaint);
    // Tertiary arc (22%)
    canvas.drawArc(Rect.fromCircle(center: center, radius: radius), 2.45, 1.38, false, tertiaryPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
