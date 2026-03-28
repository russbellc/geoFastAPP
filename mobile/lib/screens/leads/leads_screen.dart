import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:geointel_mobile/core/theme.dart';
import 'package:geointel_mobile/widgets/geo_top_bar.dart';

class LeadsScreen extends StatefulWidget {
  const LeadsScreen({super.key});

  @override
  State<LeadsScreen> createState() => _LeadsScreenState();
}

class _LeadsScreenState extends State<LeadsScreen> {
  String _filter = 'All';

  // Placeholder data — in production, loaded from API
  final _leads = [
    _Lead('Jordan Dynamics', 'Retail', 94, 'hot', '2h ago'),
    _Lead('Apex Solutions', 'Consulting', 85, 'hot', '5h ago'),
    _Lead('Precision Forge', 'Manufacturing', 78, 'warm', '1d ago'),
    _Lead('Azure Logistics', 'Logistics', 62, 'warm', '2d ago'),
    _Lead('Quantum Bio', 'Biotech', 88, 'hot', '3h ago'),
    _Lead('Neon Retail Co', 'Retail', 45, 'cold', '4d ago'),
    _Lead('DataVault Inc', 'Technology', 72, 'warm', '1d ago'),
  ];

  List<_Lead> get _filtered {
    if (_filter == 'All') return _leads;
    return _leads.where((l) => l.status == _filter.toLowerCase()).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const GeoTopBar(),
      body: Column(
        children: [
          // Header + filters
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Leads', style: GoogleFonts.manrope(fontSize: 24, fontWeight: FontWeight.w800, color: GeoColors.onSurface, letterSpacing: -0.5)),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(color: GeoColors.surfaceContainerHighest, borderRadius: BorderRadius.circular(4)),
                      child: Text('${_filtered.length} RESULTS', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: GeoColors.primary, letterSpacing: 1)),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                SizedBox(
                  height: 36,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    children: ['All', 'Hot', 'Warm', 'Cold'].map((f) {
                      final active = _filter == f;
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: GestureDetector(
                          onTap: () => setState(() => _filter = f),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            alignment: Alignment.center,
                            decoration: BoxDecoration(
                              color: active ? GeoColors.primary : GeoColors.surfaceContainerHighest,
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(f, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: active ? GeoColors.onPrimary : GeoColors.onSurfaceVariant)),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Lead list
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 120),
              itemCount: _filtered.length,
              itemBuilder: (_, i) {
                final lead = _filtered[i];
                return _LeadCard(lead: lead, onTap: () => context.push('/profile/${i + 1}'));
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _Lead {
  final String name, category, status, time;
  final int score;
  _Lead(this.name, this.category, this.score, this.status, this.time);
}

class _LeadCard extends StatelessWidget {
  final _Lead lead;
  final VoidCallback onTap;
  const _LeadCard({required this.lead, required this.onTap});

  Color get _statusColor {
    switch (lead.status) {
      case 'hot': return GeoColors.error;
      case 'warm': return GeoColors.secondary;
      default: return GeoColors.outline;
    }
  }

  Color get _scoreColor {
    if (lead.score >= 80) return GeoColors.tertiary;
    if (lead.score >= 50) return GeoColors.primary;
    return GeoColors.onSurfaceVariant;
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: GeoColors.surfaceContainerHigh,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(lead.name, style: GoogleFonts.manrope(fontSize: 14, fontWeight: FontWeight.w700, color: GeoColors.onSurface)),
                    const SizedBox(height: 2),
                    Text('${lead.category} • ${lead.time}', style: const TextStyle(fontSize: 11, color: GeoColors.onSurfaceVariant)),
                  ]),
                ),
                Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                  Text('${lead.score}', style: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w900, color: _scoreColor)),
                  const Text('OPP SCORE', style: TextStyle(fontSize: 8, fontWeight: FontWeight.w700, color: GeoColors.onSurfaceVariant, letterSpacing: 0.5)),
                ]),
              ],
            ),
            const SizedBox(height: 12),
            Row(children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: _statusColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(4),
                  border: Border.all(color: _statusColor.withOpacity(0.2)),
                ),
                child: Row(mainAxisSize: MainAxisSize.min, children: [
                  Container(width: 6, height: 6, decoration: BoxDecoration(shape: BoxShape.circle, color: _statusColor)),
                  const SizedBox(width: 4),
                  Text(lead.status.toUpperCase(), style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: _statusColor)),
                ]),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(color: GeoColors.surfaceContainerHighest, borderRadius: BorderRadius.circular(4), border: Border.all(color: GeoColors.outlineVariant.withOpacity(0.1))),
                child: Text(lead.category.toUpperCase(), style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: GeoColors.onSurfaceVariant)),
              ),
            ]),
          ],
        ),
      ),
    );
  }
}
