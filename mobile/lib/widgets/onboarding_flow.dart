import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:geointel_mobile/core/theme.dart';

class OnboardingFlow extends StatefulWidget {
  final VoidCallback onComplete;
  const OnboardingFlow({super.key, required this.onComplete});

  static Future<bool> shouldShow() async {
    final prefs = await SharedPreferences.getInstance();
    return !(prefs.getBool('onboarding_complete') ?? false);
  }

  static Future<void> markComplete() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('onboarding_complete', true);
  }

  @override
  State<OnboardingFlow> createState() => _OnboardingFlowState();
}

class _OnboardingFlowState extends State<OnboardingFlow> {
  final _controller = PageController();
  int _page = 0;

  static const _pages = [
    _OnboardingPage(
      icon: Icons.explore,
      title: 'Welcome to GeoIntel',
      subtitle: 'Intelligence Core',
      description: 'Scan territories, discover businesses, and generate qualified leads with AI-powered geospatial intelligence.',
      color: GeoColors.primary,
    ),
    _OnboardingPage(
      icon: Icons.radar,
      title: 'Scan Territories',
      subtitle: 'GPS + Radius',
      description: 'Scan from your current location or define custom territories. Our system scans OpenStreetMap and Doctoralia to discover businesses.',
      color: GeoColors.tertiary,
    ),
    _OnboardingPage(
      icon: Icons.person_search,
      title: 'Smart Leads',
      subtitle: 'AI Scoring 0-100',
      description: 'Each business gets an Opportunity Score based on their digital presence, technology, social activity, and market position.',
      color: GeoColors.secondary,
    ),
    _OnboardingPage(
      icon: Icons.local_hospital,
      title: 'Health Niche',
      subtitle: 'LiaFlow Scoring',
      description: 'Specialized analysis for the health sector: clinics, pharmacies, dentists. Enhanced scoring detects digital gaps and opportunities.',
      color: GeoColors.tertiary,
    ),
    _OnboardingPage(
      icon: Icons.analytics,
      title: 'Competitive Radar',
      subtitle: 'LATAM SaaS Health',
      description: 'Track competitors like Doctoralia, Dentalink, and Medilink. AI-generated gap analysis shows your market opportunities.',
      color: GeoColors.error,
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final isLast = _page == _pages.length - 1;

    return Scaffold(
      backgroundColor: GeoColors.background,
      body: SafeArea(
        child: Column(
          children: [
            // Skip
            Align(
              alignment: Alignment.topRight,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: GestureDetector(
                  onTap: _finish,
                  child: const Text('Skip', style: TextStyle(color: GeoColors.onSurfaceVariant, fontSize: 14, fontWeight: FontWeight.w500)),
                ),
              ),
            ),

            // Pages
            Expanded(
              child: PageView.builder(
                controller: _controller,
                onPageChanged: (i) => setState(() => _page = i),
                itemCount: _pages.length,
                itemBuilder: (_, i) => _pages[i],
              ),
            ),

            // Dots + Button
            Padding(
              padding: const EdgeInsets.fromLTRB(32, 0, 32, 40),
              child: Column(
                children: [
                  // Dots
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(_pages.length, (i) => AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                      width: i == _page ? 24 : 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: i == _page ? GeoColors.primary : GeoColors.surfaceContainerHighest,
                        borderRadius: BorderRadius.circular(4),
                      ),
                    )),
                  ),
                  const SizedBox(height: 32),

                  // Button
                  GestureDetector(
                    onTap: isLast ? _finish : () => _controller.nextPage(duration: const Duration(milliseconds: 300), curve: Curves.easeInOut),
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 18),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(colors: [GeoColors.primary, GeoColors.primaryContainer]),
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [BoxShadow(color: GeoColors.primary.withOpacity(0.2), blurRadius: 20, offset: const Offset(0, 8))],
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        isLast ? 'GET STARTED' : 'NEXT',
                        style: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w800, color: GeoColors.onPrimary, letterSpacing: 2),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _finish() {
    OnboardingFlow.markComplete();
    widget.onComplete();
  }
}

class _OnboardingPage extends StatelessWidget {
  final IconData icon;
  final String title, subtitle, description;
  final Color color;

  const _OnboardingPage({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.description,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 40),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Icon with glow
          Container(
            width: 120,
            height: 120,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: color.withOpacity(0.1),
              boxShadow: [BoxShadow(color: color.withOpacity(0.15), blurRadius: 60)],
            ),
            child: Icon(icon, size: 56, color: color),
          ),
          const SizedBox(height: 40),

          // Subtitle
          Text(
            subtitle.toUpperCase(),
            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 2, color: color),
          ),
          const SizedBox(height: 8),

          // Title
          Text(
            title,
            style: GoogleFonts.manrope(fontSize: 28, fontWeight: FontWeight.w800, color: GeoColors.onSurface, letterSpacing: -0.5),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),

          // Description
          Text(
            description,
            style: GoogleFonts.inter(fontSize: 15, color: GeoColors.onSurfaceVariant, height: 1.6),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
