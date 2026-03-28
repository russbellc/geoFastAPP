import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// GeoIntel Intelligence Core — Design System
class GeoColors {
  static const background = Color(0xFF0B1326);
  static const surfaceDim = Color(0xFF0B1326);
  static const surfaceBright = Color(0xFF31394D);
  static const surfaceContainerLowest = Color(0xFF060E20);
  static const surfaceContainerLow = Color(0xFF131B2E);
  static const surfaceContainer = Color(0xFF171F33);
  static const surfaceContainerHigh = Color(0xFF222A3D);
  static const surfaceContainerHighest = Color(0xFF2D3449);
  static const surfaceVariant = Color(0xFF2D3449);
  static const onSurface = Color(0xFFDAE2FD);
  static const onSurfaceVariant = Color(0xFFC4C6CF);
  static const onBackground = Color(0xFFDAE2FD);
  static const primary = Color(0xFFB4C5FF);
  static const primaryContainer = Color(0xFF00328B);
  static const onPrimary = Color(0xFF002A78);
  static const onPrimaryContainer = Color(0xFF7F9FFF);
  static const secondary = Color(0xFFADC8F5);
  static const secondaryContainer = Color(0xFF2F4A70);
  static const tertiary = Color(0xFF4EDEA3);
  static const tertiaryContainer = Color(0xFF00422B);
  static const onTertiaryContainer = Color(0xFF10B981);
  static const error = Color(0xFFFFB4AB);
  static const errorContainer = Color(0xFF93000A);
  static const outline = Color(0xFF8E9199);
  static const outlineVariant = Color(0xFF43474E);
  static const inversePrimary = Color(0xFF0053DB);
}

class GeoTheme {
  static ThemeData get dark {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: GeoColors.background,
      colorScheme: const ColorScheme.dark(
        surface: GeoColors.background,
        primary: GeoColors.primary,
        primaryContainer: GeoColors.primaryContainer,
        secondary: GeoColors.secondary,
        secondaryContainer: GeoColors.secondaryContainer,
        tertiary: GeoColors.tertiary,
        tertiaryContainer: GeoColors.tertiaryContainer,
        error: GeoColors.error,
        errorContainer: GeoColors.errorContainer,
        onSurface: GeoColors.onSurface,
        onPrimary: GeoColors.onPrimary,
        outline: GeoColors.outline,
        outlineVariant: GeoColors.outlineVariant,
        surfaceContainerHighest: GeoColors.surfaceContainerHighest,
      ),
      textTheme: GoogleFonts.interTextTheme(ThemeData.dark().textTheme).copyWith(
        headlineLarge: GoogleFonts.manrope(
          fontWeight: FontWeight.w800,
          color: GeoColors.onSurface,
          letterSpacing: -0.5,
        ),
        headlineMedium: GoogleFonts.manrope(
          fontWeight: FontWeight.w700,
          color: GeoColors.onSurface,
          letterSpacing: -0.3,
        ),
        headlineSmall: GoogleFonts.manrope(
          fontWeight: FontWeight.w700,
          color: GeoColors.onSurface,
        ),
        titleLarge: GoogleFonts.manrope(
          fontWeight: FontWeight.w800,
          color: GeoColors.onSurface,
          letterSpacing: -0.5,
        ),
        titleMedium: GoogleFonts.manrope(
          fontWeight: FontWeight.w700,
          color: GeoColors.onSurface,
        ),
        bodyLarge: GoogleFonts.inter(color: GeoColors.onSurface),
        bodyMedium: GoogleFonts.inter(color: GeoColors.onSurfaceVariant),
        bodySmall: GoogleFonts.inter(color: GeoColors.onSurfaceVariant, fontSize: 12),
        labelLarge: GoogleFonts.inter(
          fontWeight: FontWeight.w700,
          letterSpacing: 1.2,
          fontSize: 10,
          color: GeoColors.onSurfaceVariant,
        ),
        labelSmall: GoogleFonts.inter(
          fontWeight: FontWeight.w600,
          letterSpacing: 1.5,
          fontSize: 9,
          color: GeoColors.onSurfaceVariant,
        ),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: GeoColors.background,
        elevation: 0,
        scrolledUnderElevation: 0,
      ),
      cardTheme: CardTheme(
        color: GeoColors.surfaceContainerHigh,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        elevation: 0,
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: GeoColors.background.withOpacity(0.8),
        indicatorColor: GeoColors.surfaceContainerLow,
        labelTextStyle: WidgetStatePropertyAll(
          GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w500, letterSpacing: 0.8),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: GeoColors.surfaceContainerLowest,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        hintStyle: GoogleFonts.inter(color: GeoColors.onSurfaceVariant.withOpacity(0.4), fontSize: 14),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: GeoColors.primary,
          foregroundColor: GeoColors.onPrimary,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          textStyle: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 14, letterSpacing: 1.2),
        ),
      ),
    );
  }
}
