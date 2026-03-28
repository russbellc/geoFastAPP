import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:geointel_mobile/core/theme.dart';
import 'package:geointel_mobile/widgets/geo_top_bar.dart';
import 'package:geointel_mobile/providers/providers.dart';

class LeadsScreen extends ConsumerStatefulWidget {
  const LeadsScreen({super.key});

  @override
  ConsumerState<LeadsScreen> createState() => _LeadsScreenState();
}

class _LeadsScreenState extends ConsumerState<LeadsScreen> {
  List<Map<String, dynamic>> _businesses = [];
  Map<int, Map<String, dynamic>> _profiles = {};
  bool _loading = true;
  String _filter = 'All';
  String? _categoryFilter;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final api = ref.read(apiClientProvider);
      final data = await api.getBusinesses(perPage: 100, category: _categoryFilter);
      final items = List<Map<String, dynamic>>.from(data['items'] ?? []);

      // Load profiles for first 30
      final profiles = <int, Map<String, dynamic>>{};
      for (final biz in items.take(30)) {
        try {
          final p = await api.getBusinessProfile(biz['id'] as int);
          profiles[biz['id'] as int] = p;
        } catch (_) {}
      }

      if (mounted) {
        setState(() {
          _businesses = items;
          _profiles = profiles;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  List<Map<String, dynamic>> get _filtered {
    if (_filter == 'All') return _businesses;
    return _businesses.where((biz) {
      final profile = _profiles[biz['id']];
      final status = profile?['lead_status'] as String? ?? 'cold';
      return status == _filter.toLowerCase();
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const GeoTopBar(),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                Text('Leads', style: GoogleFonts.manrope(fontSize: 24, fontWeight: FontWeight.w800, color: GeoColors.onSurface, letterSpacing: -0.5)),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(color: GeoColors.surfaceContainerHighest, borderRadius: BorderRadius.circular(4)),
                  child: Text('${_filtered.length} RESULTS', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: GeoColors.primary, letterSpacing: 1)),
                ),
              ]),
              const SizedBox(height: 12),
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
            ]),
          ),
          const SizedBox(height: 12),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator(color: GeoColors.primary))
                : RefreshIndicator(
                    onRefresh: _loadData,
                    color: GeoColors.primary,
                    child: ListView.builder(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 120),
                      itemCount: _filtered.length,
                      itemBuilder: (_, i) {
                        final biz = _filtered[i];
                        final profile = _profiles[biz['id']];
                        final score = profile?['opportunity_score'] as int? ?? 0;
                        final status = profile?['lead_status'] as String? ?? 'cold';
                        return _LeadCard(
                          name: biz['name'] as String? ?? 'Unknown',
                          category: biz['category'] as String? ?? 'otro',
                          address: biz['address'] as String?,
                          score: score,
                          status: status,
                          onTap: () => context.push('/profile/${biz['id']}'),
                        );
                      },
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}

class _LeadCard extends StatelessWidget {
  final String name, category, status;
  final String? address;
  final int score;
  final VoidCallback onTap;
  const _LeadCard({required this.name, required this.category, required this.score, required this.status, this.address, required this.onTap});

  Color get _statusColor {
    switch (status) {
      case 'hot': return GeoColors.error;
      case 'warm': return GeoColors.secondary;
      default: return GeoColors.outline;
    }
  }

  Color get _scoreColor {
    if (score >= 80) return GeoColors.tertiary;
    if (score >= 50) return GeoColors.primary;
    return GeoColors.onSurfaceVariant;
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: GeoColors.surfaceContainerHigh, borderRadius: BorderRadius.circular(12)),
        child: Column(children: [
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(name, style: GoogleFonts.manrope(fontSize: 14, fontWeight: FontWeight.w700, color: GeoColors.onSurface), maxLines: 1, overflow: TextOverflow.ellipsis),
              const SizedBox(height: 2),
              Text('$category${address != null ? " • $address" : ""}', style: const TextStyle(fontSize: 11, color: GeoColors.onSurfaceVariant), maxLines: 1, overflow: TextOverflow.ellipsis),
            ])),
            Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
              Text('$score', style: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w900, color: _scoreColor)),
              const Text('SCORE', style: TextStyle(fontSize: 8, fontWeight: FontWeight.w700, color: GeoColors.onSurfaceVariant, letterSpacing: 0.5)),
            ]),
          ]),
          const SizedBox(height: 12),
          Row(children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(color: _statusColor.withOpacity(0.1), borderRadius: BorderRadius.circular(4), border: Border.all(color: _statusColor.withOpacity(0.2))),
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                Container(width: 6, height: 6, decoration: BoxDecoration(shape: BoxShape.circle, color: _statusColor)),
                const SizedBox(width: 4),
                Text(status.toUpperCase(), style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: _statusColor)),
              ]),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(color: GeoColors.surfaceContainerHighest, borderRadius: BorderRadius.circular(4)),
              child: Text(category.toUpperCase(), style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: GeoColors.onSurfaceVariant)),
            ),
          ]),
        ]),
      ),
    );
  }
}
