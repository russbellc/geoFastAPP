import 'package:flutter/material.dart';
import 'package:geointel_mobile/core/theme.dart';
import 'package:google_fonts/google_fonts.dart';

class KpiCard extends StatelessWidget {
  final String label;
  final String value;
  final String? trend;
  final Color borderColor;
  final VoidCallback? onTap;

  const KpiCard({
    super.key,
    required this.label,
    required this.value,
    this.trend,
    this.borderColor = GeoColors.primary,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        constraints: const BoxConstraints(minWidth: 160),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: GeoColors.surfaceContainerHigh,
          borderRadius: BorderRadius.circular(12),
          border: Border(left: BorderSide(color: borderColor, width: 4)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label.toUpperCase(),
              style: const TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w500,
                letterSpacing: 1.2,
                color: GeoColors.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              value,
              style: GoogleFonts.manrope(
                fontSize: 24,
                fontWeight: FontWeight.w700,
                color: GeoColors.onSurface,
              ),
            ),
            if (trend != null) ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  const Icon(Icons.trending_up, size: 14, color: GeoColors.tertiary),
                  const SizedBox(width: 4),
                  Text(
                    trend!,
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: GeoColors.tertiary),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}
