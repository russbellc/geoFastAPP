import 'package:flutter/material.dart';
import 'package:geointel_mobile/core/theme.dart';
import 'package:google_fonts/google_fonts.dart';

class GeoTopBar extends StatelessWidget implements PreferredSizeWidget {
  final String? title;
  final bool showSearch;
  final bool showBack;
  final VoidCallback? onBack;

  const GeoTopBar({
    super.key,
    this.title,
    this.showSearch = true,
    this.showBack = false,
    this.onBack,
  });

  @override
  Size get preferredSize => const Size.fromHeight(64);

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      bottom: false,
      child: Container(
        height: 64,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        color: GeoColors.background,
        child: Row(
          children: [
            if (showBack)
              IconButton(
                onPressed: onBack ?? () => Navigator.of(context).pop(),
                icon: const Icon(Icons.arrow_back, color: GeoColors.primary),
              ),
            if (showBack)
              Text(
                title ?? 'GeoIntel',
                style: GoogleFonts.manrope(
                  fontWeight: FontWeight.w700,
                  fontSize: 18,
                  color: GeoColors.onSurface,
                  letterSpacing: -0.3,
                ),
              )
            else ...[
              // Avatar
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: GeoColors.surfaceContainerHighest,
                  border: Border.all(color: GeoColors.primary.withOpacity(0.2), width: 2),
                ),
                child: const Icon(Icons.person, color: GeoColors.onSurfaceVariant, size: 18),
              ),
              const SizedBox(width: 12),
              Text(
                'GeoIntel',
                style: GoogleFonts.manrope(
                  fontWeight: FontWeight.w800,
                  fontSize: 20,
                  color: GeoColors.onSurface,
                  letterSpacing: -1,
                ),
              ),
            ],
            const Spacer(),
            if (showSearch)
              IconButton(
                onPressed: () {},
                icon: const Icon(Icons.search, color: GeoColors.primary),
              ),
          ],
        ),
      ),
    );
  }
}
