import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:geointel_mobile/core/theme.dart';
import 'package:geointel_mobile/widgets/geo_top_bar.dart';
import 'package:geointel_mobile/providers/providers.dart';
import 'package:geointel_mobile/screens/profile/export_share.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  final int businessId;
  const ProfileScreen({super.key, required this.businessId});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  Map<String, dynamic>? _business;
  Map<String, dynamic>? _profile;
  bool _loading = true;
  bool _enriching = false;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final api = ref.read(apiClientProvider);
      final biz = await api.getBusinesses(perPage: 100);
      final items = List<Map<String, dynamic>>.from(biz['items'] ?? []);
      final found = items.firstWhere((b) => b['id'] == widget.businessId, orElse: () => {});

      Map<String, dynamic>? profile;
      try {
        profile = await api.getBusinessProfile(widget.businessId);
      } catch (_) {}

      if (mounted) setState(() { _business = found.isNotEmpty ? found : null; _profile = profile; _loading = false; });
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _enrich() async {
    setState(() => _enriching = true);
    try {
      await ref.read(apiClientProvider).enrichBusiness(widget.businessId);
      await Future.delayed(const Duration(seconds: 5));
      await _loadData();
    } catch (_) {}
    if (mounted) setState(() => _enriching = false);
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        appBar: GeoTopBar(title: 'Cargando...', showBack: true, showSearch: false),
        body: Center(child: CircularProgressIndicator(color: GeoColors.primary)),
      );
    }

    if (_business == null) {
      return Scaffold(
        appBar: const GeoTopBar(title: 'No Encontrado', showBack: true, showSearch: false),
        body: const Center(child: Text('Negocio no encontrado', style: TextStyle(color: GeoColors.onSurfaceVariant))),
      );
    }

    final biz = _business!;
    final name = biz['name'] as String? ?? 'Desconocido';
    final category = biz['category'] as String? ?? 'otro';
    final address = biz['address'] as String?;
    final phone = biz['phone'] as String?;
    final website = biz['website'] as String?;
    final email = biz['email'] as String?;

    final score = _profile?['opportunity_score'] as int? ?? 0;
    final status = _profile?['lead_status'] as String? ?? 'cold';
    final aiSummary = _profile?['ai_summary'] as String?;
    final techStack = _profile?['tech_stack'] as Map<String, dynamic>?;
    final detected = List<String>.from(techStack?['detected'] ?? []);
    final hasBooking = _profile?['has_online_booking'] == true;
    final hasChatbot = _profile?['has_chatbot'] == true;
    final seoScore = _profile?['seo_score'] as int?;

    return Scaffold(
      appBar: const GeoTopBar(title: 'Perfil de Negocio', showBack: true, showSearch: false),
      body: Stack(
        children: [
          ListView(
            padding: const EdgeInsets.fromLTRB(24, 8, 24, 160),
            children: [
              // Header
              Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(name, style: GoogleFonts.manrope(fontSize: 22, fontWeight: FontWeight.w800, color: GeoColors.onSurface, letterSpacing: -0.5), maxLines: 2, overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 4),
                  Text('$category${address != null ? " • $address" : ""}', style: const TextStyle(fontSize: 13, color: GeoColors.onSurfaceVariant), maxLines: 2),
                  const SizedBox(height: 12),
                  _StatusBadge(status: status),
                ])),
                SizedBox(
                  width: 90, height: 90,
                  child: CustomPaint(
                    painter: _ScorePainter(score: score),
                    child: Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                      Text('$score', style: GoogleFonts.manrope(fontSize: 22, fontWeight: FontWeight.w700, color: GeoColors.primary)),
                      const Text('PUNTAJE', style: TextStyle(fontSize: 8, fontWeight: FontWeight.w700, color: GeoColors.onSurfaceVariant, letterSpacing: 0.5)),
                    ])),
                  ),
                ),
              ]),
              const SizedBox(height: 28),

              // AI Summary
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(color: GeoColors.surfaceContainerLow, borderRadius: BorderRadius.circular(12), border: Border.all(color: GeoColors.outlineVariant.withOpacity(0.1))),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Row(children: [
                    const Icon(Icons.psychology, color: GeoColors.primary, size: 18),
                    const SizedBox(width: 8),
                    Text('RESUMEN DE INTELIGENCIA', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1.2, color: GeoColors.onSurfaceVariant)),
                  ]),
                  const SizedBox(height: 14),
                  Text(
                    aiSummary ?? 'Aun no hay resumen de inteligencia. Toca "Enriquecer" para generar insights con IA.',
                    style: GoogleFonts.inter(fontSize: 14, color: GeoColors.onSurface, height: 1.6),
                  ),
                  if (_profile == null) ...[
                    const SizedBox(height: 16),
                    GestureDetector(
                      onTap: _enriching ? null : _enrich,
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        decoration: BoxDecoration(color: GeoColors.primary.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
                        alignment: Alignment.center,
                        child: Text(_enriching ? 'ENRIQUECIENDO...' : 'ENRIQUECER NEGOCIO', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: GeoColors.primary, letterSpacing: 1)),
                      ),
                    ),
                  ],
                ]),
              ),
              const SizedBox(height: 20),

              // Contact Info
              if (phone != null || website != null || email != null) ...[
                Text('CONTACTO', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1.2, color: GeoColors.onSurfaceVariant)),
                const SizedBox(height: 10),
                if (phone != null) _ContactRow(icon: Icons.phone, value: phone, onTap: () => launchUrl(Uri.parse('tel:$phone'))),
                if (website != null) _ContactRow(icon: Icons.language, value: website, onTap: () => launchUrl(Uri.parse(website))),
                if (email != null) _ContactRow(icon: Icons.email, value: email, onTap: () => launchUrl(Uri.parse('mailto:$email'))),
                const SizedBox(height: 20),
              ],

              // Tech Stack
              if (detected.isNotEmpty) ...[
                Text('STACK TECNOLOGICO', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1.2, color: GeoColors.onSurfaceVariant)),
                const SizedBox(height: 10),
                Wrap(spacing: 8, runSpacing: 8, children: detected.map((tech) => Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(color: GeoColors.surfaceContainerHighest, borderRadius: BorderRadius.circular(8), border: Border.all(color: GeoColors.outlineVariant.withOpacity(0.2))),
                  child: Text(tech, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: GeoColors.onSurface)),
                )).toList()),
                const SizedBox(height: 20),
              ],

              // Business Signals
              if (_profile != null) ...[
                Text('SENALES DE NEGOCIO', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1.2, color: GeoColors.onSurfaceVariant)),
                const SizedBox(height: 10),
                Row(children: [
                  Expanded(child: _SignalCard(icon: Icons.calendar_month, label: 'Reservas', active: hasBooking)),
                  const SizedBox(width: 10),
                  Expanded(child: _SignalCard(icon: Icons.smart_toy, label: 'Chatbot', active: hasChatbot)),
                  const SizedBox(width: 10),
                  Expanded(child: _SignalCard(icon: Icons.search, label: 'SEO', active: seoScore != null, value: seoScore != null ? '$seoScore' : null)),
                ]),
                const SizedBox(height: 20),
              ],

              // Social
              if (_profile != null && (_profile?['facebook_url'] != null || _profile?['instagram_url'] != null || _profile?['tiktok_url'] != null)) ...[
                Text('SOCIAL', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1.2, color: GeoColors.onSurfaceVariant)),
                const SizedBox(height: 10),
                _SocialRow(profile: _profile!),
              ],
            ],
          ),

          // Bottom CTA
          Positioned(
            bottom: 0, left: 0, right: 0,
            child: Container(
              padding: const EdgeInsets.fromLTRB(24, 12, 24, 32),
              decoration: BoxDecoration(color: GeoColors.background, border: Border(top: BorderSide(color: GeoColors.outlineVariant.withOpacity(0.1)))),
              child: Row(children: [
                Expanded(
                  child: Container(
                    height: 52,
                    decoration: BoxDecoration(gradient: const LinearGradient(colors: [GeoColors.primary, GeoColors.primaryContainer]), borderRadius: BorderRadius.circular(12)),
                    alignment: Alignment.center,
                    child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                      const Icon(Icons.send, color: GeoColors.onPrimary, size: 18),
                      const SizedBox(width: 8),
                      Text('CONTACTO', style: GoogleFonts.manrope(fontWeight: FontWeight.w800, fontSize: 13, color: GeoColors.onPrimary, letterSpacing: 1.2)),
                    ]),
                  ),
                ),
                const SizedBox(width: 12),
                GestureDetector(
                  onTap: () => showModalBottomSheet(context: context, backgroundColor: Colors.transparent, builder: (_) => ExportShareSheet(businessName: name)),
                  child: Container(
                    height: 52, width: 52,
                    decoration: BoxDecoration(color: GeoColors.surfaceContainerHighest, borderRadius: BorderRadius.circular(12)),
                    child: const Icon(Icons.ios_share, color: GeoColors.primary, size: 20),
                  ),
                ),
              ]),
            ),
          ),
        ],
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final String status;
  const _StatusBadge({required this.status});
  @override
  Widget build(BuildContext context) {
    final color = status == 'hot' ? GeoColors.error : status == 'warm' ? GeoColors.secondary : GeoColors.outline;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(20), border: Border.all(color: color.withOpacity(0.2))),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Container(width: 6, height: 6, decoration: BoxDecoration(shape: BoxShape.circle, color: color)),
        const SizedBox(width: 6),
        Text(status.toUpperCase(), style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: color, letterSpacing: 0.8)),
      ]),
    );
  }
}

class _ContactRow extends StatelessWidget {
  final IconData icon;
  final String value;
  final VoidCallback? onTap;
  const _ContactRow({required this.icon, required this.value, this.onTap});
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 6),
        child: Row(children: [
          Icon(icon, size: 16, color: GeoColors.onSurfaceVariant),
          const SizedBox(width: 12),
          Expanded(child: Text(value, style: const TextStyle(fontSize: 13, color: GeoColors.primary), maxLines: 1, overflow: TextOverflow.ellipsis)),
        ]),
      ),
    );
  }
}

class _SignalCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool active;
  final String? value;
  const _SignalCard({required this.icon, required this.label, required this.active, this.value});
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: active ? GeoColors.surfaceContainerHighest : GeoColors.surfaceContainerHigh.withOpacity(0.5), borderRadius: BorderRadius.circular(12)),
      child: Column(children: [
        Icon(icon, size: 20, color: active ? GeoColors.tertiary : GeoColors.onSurfaceVariant.withOpacity(0.3)),
        const SizedBox(height: 6),
        Text(value ?? (active ? 'Si' : 'No'), style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: active ? GeoColors.onSurface : GeoColors.onSurfaceVariant.withOpacity(0.3))),
        Text(label, style: const TextStyle(fontSize: 9, color: GeoColors.onSurfaceVariant)),
      ]),
    );
  }
}

class _SocialChip extends StatelessWidget {
  final IconData icon;
  final String label, url;
  final Color color;
  const _SocialChip({required this.icon, required this.label, required this.color, required this.url});
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => launchUrl(Uri.parse(url)),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(color: GeoColors.surfaceContainerHighest, borderRadius: BorderRadius.circular(12)),
        child: Column(children: [
          Icon(icon, size: 18, color: color),
          const SizedBox(height: 6),
          Text(label, style: const TextStyle(fontSize: 10, color: GeoColors.onSurfaceVariant)),
        ]),
      ),
    );
  }
}

class _SocialRow extends StatelessWidget {
  final Map<String, dynamic> profile;
  const _SocialRow({required this.profile});
  @override
  Widget build(BuildContext context) {
    final ig = profile['instagram_url'] as String?;
    final fb = profile['facebook_url'] as String?;
    final tk = profile['tiktok_url'] as String?;
    return Row(children: [
      if (ig != null) Expanded(child: _SocialChip(icon: Icons.camera_alt, label: 'Instagram', color: Colors.pink, url: ig)),
      if (ig != null && (fb != null || tk != null)) const SizedBox(width: 10),
      if (fb != null) Expanded(child: _SocialChip(icon: Icons.thumb_up, label: 'Facebook', color: Colors.blue, url: fb)),
      if (fb != null && tk != null) const SizedBox(width: 10),
      if (tk != null) Expanded(child: _SocialChip(icon: Icons.music_note, label: 'TikTok', color: Colors.cyan, url: tk)),
    ]);
  }
}

class _ScorePainter extends CustomPainter {
  final int score;
  _ScorePainter({required this.score});
  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2 - 4;
    canvas.drawCircle(center, radius, Paint()..color = GeoColors.surfaceContainerHighest..style = PaintingStyle.stroke..strokeWidth = 6);
    canvas.drawArc(Rect.fromCircle(center: center, radius: radius), -pi / 2, (score / 100) * 2 * pi, false, Paint()..color = GeoColors.primary..style = PaintingStyle.stroke..strokeWidth = 6..strokeCap = StrokeCap.round);
  }
  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
