import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:geointel_mobile/core/theme.dart';
import 'package:geointel_mobile/widgets/geo_top_bar.dart';

class ScanScreen extends StatefulWidget {
  const ScanScreen({super.key});

  @override
  State<ScanScreen> createState() => _ScanScreenState();
}

class _ScanScreenState extends State<ScanScreen> {
  final Set<String> _selectedIndustries = {'Technology', 'Healthcare'};
  double _progress = 0.45;
  bool _scanning = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: GeoTopBar(title: 'Intelligence Launchpad', showBack: true, showSearch: false),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(24, 16, 24, 120),
        children: [
          Text('Intelligence\nLaunchpad', style: GoogleFonts.manrope(fontSize: 28, fontWeight: FontWeight.w800, color: GeoColors.onSurface, letterSpacing: -0.5, height: 1.1)),
          const SizedBox(height: 8),
          const Text('Configure the parameters for your localized intelligence sweep.', style: TextStyle(fontSize: 14, color: GeoColors.onSurfaceVariant, height: 1.5)),
          const SizedBox(height: 32),

          // Form card
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: GeoColors.surfaceContainerLow,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: GeoColors.outlineVariant.withOpacity(0.1)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Territory selector
                Text('PRIMARY TERRITORY', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 1.5, color: GeoColors.onSurfaceVariant)),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  decoration: BoxDecoration(color: GeoColors.surfaceContainerLowest, borderRadius: BorderRadius.circular(12)),
                  child: Row(
                    children: [
                      const Icon(Icons.map, color: GeoColors.primary, size: 20),
                      const SizedBox(width: 12),
                      const Expanded(child: Text('Lima Metropolitan', style: TextStyle(color: GeoColors.onSurface, fontWeight: FontWeight.w500))),
                      const Icon(Icons.expand_more, color: GeoColors.onSurfaceVariant),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Industry verticals
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('INDUSTRY VERTICALS', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 1.5, color: GeoColors.onSurfaceVariant)),
                    Text('${_selectedIndustries.length} Selected', style: const TextStyle(fontSize: 10, color: GeoColors.primary, fontWeight: FontWeight.w500)),
                  ],
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 12,
                  runSpacing: 12,
                  children: ['Technology', 'Finance', 'Healthcare', 'Retail'].map((ind) {
                    final selected = _selectedIndustries.contains(ind);
                    return GestureDetector(
                      onTap: () => setState(() => selected ? _selectedIndustries.remove(ind) : _selectedIndustries.add(ind)),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        decoration: BoxDecoration(
                          color: selected ? GeoColors.primary.withOpacity(0.1) : GeoColors.surfaceContainerHighest.withOpacity(0.4),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: selected ? GeoColors.primary.withOpacity(0.3) : GeoColors.outlineVariant.withOpacity(0.05)),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(selected ? Icons.check_box : Icons.check_box_outline_blank, size: 18, color: selected ? GeoColors.primary : GeoColors.onSurfaceVariant),
                            const SizedBox(width: 8),
                            Text(ind, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: selected ? GeoColors.primary : GeoColors.onSurface)),
                          ],
                        ),
                      ),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 32),

                // Progress bar
                if (_scanning) ...[
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(children: [
                        Container(width: 8, height: 8, decoration: BoxDecoration(shape: BoxShape.circle, color: GeoColors.tertiary, boxShadow: [BoxShadow(color: GeoColors.tertiary.withOpacity(0.5), blurRadius: 4)])),
                        const SizedBox(width: 8),
                        const Text('Scanning Local Registries...', style: TextStyle(fontSize: 12, color: GeoColors.tertiary, fontWeight: FontWeight.w500)),
                      ]),
                      Text('${(_progress * 100).toInt()}%', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: GeoColors.onSurface)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(6),
                    child: LinearProgressIndicator(
                      value: _progress,
                      minHeight: 12,
                      backgroundColor: GeoColors.surfaceContainerLowest,
                      valueColor: const AlwaysStoppedAnimation(GeoColors.primary),
                    ),
                  ),
                  const SizedBox(height: 24),
                ],

                // Launch button
                SizedBox(
                  width: double.infinity,
                  child: GestureDetector(
                    onTap: () {
                      setState(() { _scanning = true; _progress = 0.0; });
                      _simulateScan();
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(colors: [GeoColors.primary, GeoColors.primaryContainer]),
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [BoxShadow(color: GeoColors.primary.withOpacity(0.2), blurRadius: 16, offset: const Offset(0, 4))],
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        _scanning ? 'SCANNING...' : 'START NEW SCAN',
                        style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: GeoColors.onPrimary, letterSpacing: 1.5),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Stats cards
          Row(
            children: [
              Expanded(child: _StatCard(icon: Icons.history, iconColor: GeoColors.primary, label: 'Last Sweep', value: '2 hours ago')),
              const SizedBox(width: 16),
              Expanded(child: _StatCard(icon: Icons.bolt, iconColor: GeoColors.tertiary, label: 'Efficiency', value: '0.4s Latency')),
            ],
          ),
        ],
      ),
    );
  }

  void _simulateScan() {
    Future.doWhile(() async {
      await Future.delayed(const Duration(milliseconds: 200));
      if (!mounted) return false;
      setState(() => _progress = (_progress + 0.02).clamp(0, 1));
      return _progress < 1.0;
    }).then((_) {
      if (mounted) setState(() => _scanning = false);
    });
  }
}

class _StatCard extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String label, value;
  const _StatCard({required this.icon, required this.iconColor, required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: GeoColors.surfaceContainerHigh,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: GeoColors.outlineVariant.withOpacity(0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 32, height: 32,
            decoration: BoxDecoration(color: iconColor.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
            child: Icon(icon, size: 16, color: iconColor),
          ),
          const SizedBox(height: 12),
          Text(label.toUpperCase(), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 0.5, color: GeoColors.onSurfaceVariant)),
          const SizedBox(height: 4),
          Text(value, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: GeoColors.onSurface)),
        ],
      ),
    );
  }
}
