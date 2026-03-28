import 'dart:math';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:geointel_mobile/core/theme.dart';
import 'package:geointel_mobile/widgets/geo_top_bar.dart';

class ProfileScreen extends StatelessWidget {
  final int businessId;
  const ProfileScreen({super.key, required this.businessId});

  @override
  Widget build(BuildContext context) {
    // In production this would load from API. Using placeholder data.
    return Scaffold(
      appBar: const GeoTopBar(title: 'Business Profile', showBack: true, showSearch: false),
      body: Stack(
        children: [
          ListView(
            padding: const EdgeInsets.fromLTRB(24, 8, 24, 160),
            children: [
              // Header
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Aetheria Logistics', style: GoogleFonts.manrope(fontSize: 24, fontWeight: FontWeight.w800, color: GeoColors.onSurface, letterSpacing: -0.5)),
                        const SizedBox(height: 4),
                        const Text('Supply Chain & Freight Tech', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: GeoColors.onSurfaceVariant)),
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: GeoColors.tertiaryContainer,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: GeoColors.tertiary.withOpacity(0.2)),
                          ),
                          child: Row(mainAxisSize: MainAxisSize.min, children: [
                            Container(width: 6, height: 6, decoration: BoxDecoration(shape: BoxShape.circle, color: GeoColors.tertiary, boxShadow: [BoxShadow(color: GeoColors.tertiary, blurRadius: 8)])),
                            const SizedBox(width: 6),
                            Text('HIGH OPPORTUNITY', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: GeoColors.onTertiaryContainer, letterSpacing: 0.8)),
                          ]),
                        ),
                      ],
                    ),
                  ),
                  // Score circle
                  SizedBox(
                    width: 96, height: 96,
                    child: CustomPaint(
                      painter: _ScorePainter(score: 85),
                      child: Center(
                        child: Column(mainAxisSize: MainAxisSize.min, children: [
                          Text('85', style: GoogleFonts.manrope(fontSize: 22, fontWeight: FontWeight.w700, color: GeoColors.primary)),
                          const Text('SCORE', style: TextStyle(fontSize: 8, fontWeight: FontWeight.w700, color: GeoColors.onSurfaceVariant, letterSpacing: 0.5)),
                        ]),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 32),

              // Intelligence Summary
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: GeoColors.surfaceContainerLow,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: GeoColors.outlineVariant.withOpacity(0.1)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(children: [
                      const Icon(Icons.psychology, color: GeoColors.primary, size: 18),
                      const SizedBox(width: 8),
                      Text('INTELLIGENCE SUMMARY', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1.2, color: GeoColors.onSurfaceVariant)),
                    ]),
                    const SizedBox(height: 16),
                    RichText(
                      text: TextSpan(
                        style: GoogleFonts.inter(fontSize: 14, color: GeoColors.onSurface, height: 1.6),
                        children: [
                          const TextSpan(text: 'Aetheria Logistics has shown a '),
                          TextSpan(text: '24% increase', style: TextStyle(color: GeoColors.tertiary, fontWeight: FontWeight.w600)),
                          const TextSpan(text: ' in regional expansion activities over the last quarter. Signal data suggests a heavy pivot toward automated fleet management and real-time geospatial tracking.'),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    const Divider(color: GeoColors.outlineVariant, height: 1),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        _MiniStat(label: 'Signals', value: '12 Active'),
                        const SizedBox(width: 32),
                        _MiniStat(label: 'Sentiment', value: 'Bullish', valueColor: GeoColors.tertiary),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Tech Stack
              Text('TECH STACK ARCHITECTURE', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1.2, color: GeoColors.onSurfaceVariant)),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: ['Snowflake', 'AWS', 'Kubernetes', 'Salesforce', 'PostgreSQL', 'React Native'].map((tech) {
                  final isHighlight = tech == 'React Native';
                  return Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: GeoColors.surfaceContainerHighest,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: isHighlight ? GeoColors.primary.withOpacity(0.2) : GeoColors.outlineVariant.withOpacity(0.2)),
                    ),
                    child: Text(tech, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: isHighlight ? GeoColors.primary : GeoColors.onSurface)),
                  );
                }).toList(),
              ),
              const SizedBox(height: 24),

              // Social Footprint
              Text('SOCIAL FOOTPRINT', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1.2, color: GeoColors.onSurfaceVariant)),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(child: _SocialCard(icon: Icons.work, color: const Color(0xFF0077B5), platform: 'LinkedIn', value: '420 Empl.')),
                  const SizedBox(width: 12),
                  Expanded(child: _SocialCard(icon: Icons.public, color: const Color(0xFF1DA1F2), platform: 'Twitter', value: '12.4k Post')),
                ],
              ),
            ],
          ),

          // Fixed bottom CTA
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
              decoration: BoxDecoration(
                color: GeoColors.background,
                border: Border(top: BorderSide(color: GeoColors.outlineVariant.withOpacity(0.1))),
              ),
              child: Container(
                height: 56,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: [GeoColors.primary, GeoColors.primaryContainer]),
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [BoxShadow(color: GeoColors.primary.withOpacity(0.2), blurRadius: 24, offset: const Offset(0, 8))],
                ),
                alignment: Alignment.center,
                child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                  const Icon(Icons.send, color: GeoColors.onPrimary, size: 20),
                  const SizedBox(width: 8),
                  Text('EXECUTE OUTREACH', style: GoogleFonts.manrope(fontWeight: FontWeight.w800, fontSize: 14, color: GeoColors.onPrimary, letterSpacing: 1.5)),
                ]),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _MiniStat extends StatelessWidget {
  final String label, value;
  final Color? valueColor;
  const _MiniStat({required this.label, required this.value, this.valueColor});

  @override
  Widget build(BuildContext context) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label.toUpperCase(), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: GeoColors.onSurfaceVariant)),
      const SizedBox(height: 4),
      Text(value, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: valueColor ?? GeoColors.onSurface)),
    ]);
  }
}

class _SocialCard extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String platform, value;
  const _SocialCard({required this.icon, required this.color, required this.platform, required this.value});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: GeoColors.surfaceContainerHigh,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: GeoColors.outlineVariant.withOpacity(0.1)),
      ),
      child: Row(children: [
        Container(
          width: 32, height: 32,
          decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
          child: Icon(icon, size: 16, color: color),
        ),
        const SizedBox(width: 12),
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(platform, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: GeoColors.onSurface)),
          Text(value, style: const TextStyle(fontSize: 10, color: GeoColors.onSurfaceVariant)),
        ]),
      ]),
    );
  }
}

class _ScorePainter extends CustomPainter {
  final int score;
  _ScorePainter({required this.score});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2 - 4;
    final bgPaint = Paint()..color = GeoColors.surfaceContainerHighest..style = PaintingStyle.stroke..strokeWidth = 6;
    final fgPaint = Paint()..color = GeoColors.primary..style = PaintingStyle.stroke..strokeWidth = 6..strokeCap = StrokeCap.round;

    canvas.drawCircle(center, radius, bgPaint);
    final sweep = (score / 100) * 2 * pi;
    canvas.drawArc(Rect.fromCircle(center: center, radius: radius), -pi / 2, sweep, false, fgPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
