import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:geointel_mobile/core/theme.dart';
import 'package:geointel_mobile/widgets/geo_top_bar.dart';
import 'package:geointel_mobile/providers/providers.dart';

class ScanScreen extends ConsumerStatefulWidget {
  const ScanScreen({super.key});

  @override
  ConsumerState<ScanScreen> createState() => _ScanScreenState();
}

class _ScanScreenState extends ConsumerState<ScanScreen> {
  String _name = '';
  String _city = 'Lima';
  String _nicho = '';
  double _lat = -12.0464;
  double _lng = -77.0428;
  double _radiusKm = 1.0;
  String _status = '';
  int _totalFound = 0;
  int? _jobId;
  Timer? _pollTimer;
  List<Map<String, dynamic>> _history = [];
  bool _loadingHistory = true;

  @override
  void initState() {
    super.initState();
    _loadHistory();
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }

  Future<void> _loadHistory() async {
    try {
      final api = ref.read(apiClientProvider);
      final hist = await api.getScanHistory();
      if (mounted) setState(() { _history = List<Map<String, dynamic>>.from(hist); _loadingHistory = false; });
    } catch (_) {
      if (mounted) setState(() => _loadingHistory = false);
    }
  }

  Future<void> _launchScan() async {
    if (_name.isEmpty) return;
    setState(() { _status = 'pending'; _totalFound = 0; });
    try {
      final api = ref.read(apiClientProvider);
      final result = await api.createScan({
        'name': _name, 'city': _city, 'country': 'Peru',
        'lat': _lat, 'lng': _lng, 'radius_km': _radiusKm,
        if (_nicho.isNotEmpty) 'nicho': _nicho,
      });
      _jobId = result['id'];
      setState(() => _status = 'running');
      _startPolling();
    } catch (e) {
      setState(() => _status = 'failed');
    }
  }

  void _startPolling() {
    _pollTimer = Timer.periodic(const Duration(seconds: 3), (timer) async {
      if (_jobId == null) { timer.cancel(); return; }
      try {
        final status = await ref.read(apiClientProvider).getScanStatus(_jobId!);
        setState(() { _status = status['status']; _totalFound = status['total_found'] ?? 0; });
        if (_status == 'done' || _status == 'failed') {
          timer.cancel();
          _loadHistory();
        }
      } catch (_) { timer.cancel(); }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const GeoTopBar(title: 'Initialize Scan', showBack: true, showSearch: false),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(24, 8, 24, 120),
        children: [
          Text('Initialize\nScan', style: GoogleFonts.manrope(fontSize: 28, fontWeight: FontWeight.w800, color: GeoColors.onSurface, letterSpacing: -0.5, height: 1.1)),
          const SizedBox(height: 8),
          const Text('Define a territory and launch a geospatial intelligence scan.', style: TextStyle(fontSize: 14, color: GeoColors.onSurfaceVariant, height: 1.5)),
          const SizedBox(height: 24),

          // Form
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(color: GeoColors.surfaceContainerLow, borderRadius: BorderRadius.circular(16), border: Border.all(color: GeoColors.outlineVariant.withOpacity(0.1))),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              _Label('TERRITORY NAME'),
              const SizedBox(height: 8),
              TextField(onChanged: (v) => setState(() => _name = v), decoration: const InputDecoration(hintText: 'e.g. Miraflores Norte'), style: const TextStyle(color: GeoColors.onSurface)),
              const SizedBox(height: 16),
              Row(children: [
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  _Label('CITY'), const SizedBox(height: 8),
                  TextField(onChanged: (v) => setState(() => _city = v), controller: TextEditingController(text: _city), decoration: const InputDecoration(hintText: 'Lima'), style: const TextStyle(color: GeoColors.onSurface)),
                ])),
                const SizedBox(width: 12),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  _Label('RADIUS (KM)'), const SizedBox(height: 8),
                  TextField(onChanged: (v) => setState(() => _radiusKm = double.tryParse(v) ?? 1.0), controller: TextEditingController(text: _radiusKm.toString()), keyboardType: TextInputType.number, decoration: const InputDecoration(hintText: '1.0'), style: const TextStyle(color: GeoColors.onSurface)),
                ])),
              ]),
              const SizedBox(height: 16),
              Row(children: [
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  _Label('LATITUDE'), const SizedBox(height: 8),
                  TextField(onChanged: (v) => setState(() => _lat = double.tryParse(v) ?? _lat), controller: TextEditingController(text: _lat.toString()), keyboardType: TextInputType.number, decoration: const InputDecoration(hintText: '-12.0464'), style: const TextStyle(color: GeoColors.onSurface)),
                ])),
                const SizedBox(width: 12),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  _Label('LONGITUDE'), const SizedBox(height: 8),
                  TextField(onChanged: (v) => setState(() => _lng = double.tryParse(v) ?? _lng), controller: TextEditingController(text: _lng.toString()), keyboardType: TextInputType.number, decoration: const InputDecoration(hintText: '-77.0428'), style: const TextStyle(color: GeoColors.onSurface)),
                ])),
              ]),
              const SizedBox(height: 16),
              _Label('NICHE (OPTIONAL)'), const SizedBox(height: 8),
              TextField(onChanged: (v) => setState(() => _nicho = v), decoration: const InputDecoration(hintText: 'salud, gastronomia...'), style: const TextStyle(color: GeoColors.onSurface)),
              const SizedBox(height: 24),

              // Status
              if (_status.isNotEmpty) ...[
                Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                  Text('Status: ${_status.toUpperCase()}', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: _status == 'done' ? GeoColors.tertiary : _status == 'failed' ? GeoColors.error : GeoColors.primary)),
                  Text('Found: $_totalFound', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: GeoColors.onSurface)),
                ]),
                const SizedBox(height: 8),
                if (_status == 'running') ClipRRect(borderRadius: BorderRadius.circular(6), child: const LinearProgressIndicator(minHeight: 8, color: GeoColors.primary, backgroundColor: GeoColors.surfaceContainerHighest)),
                const SizedBox(height: 16),
              ],

              // Button
              GestureDetector(
                onTap: (_name.isNotEmpty && _status != 'running') ? _launchScan : null,
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  decoration: BoxDecoration(
                    gradient: _name.isNotEmpty ? const LinearGradient(colors: [GeoColors.primary, GeoColors.primaryContainer]) : null,
                    color: _name.isEmpty ? GeoColors.surfaceContainerHighest : null,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  alignment: Alignment.center,
                  child: Text(_status == 'running' ? 'SCANNING...' : 'LAUNCH SCAN', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, letterSpacing: 1.5, color: _name.isNotEmpty ? GeoColors.onPrimary : GeoColors.onSurfaceVariant)),
                ),
              ),
            ]),
          ),
          const SizedBox(height: 24),

          // History
          if (_history.isNotEmpty) ...[
            Text('SCAN HISTORY', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1.5, color: GeoColors.onSurfaceVariant)),
            const SizedBox(height: 12),
            ..._history.take(10).map((job) => Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(color: GeoColors.surfaceContainerHigh, borderRadius: BorderRadius.circular(12)),
              child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('Territory #${job['territory_id']}${job['nicho'] != null ? " — ${job['nicho']}" : ""}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: GeoColors.onSurface)),
                  if (job['started_at'] != null) Text(job['started_at'].toString().substring(0, 16), style: const TextStyle(fontSize: 10, color: GeoColors.onSurfaceVariant)),
                ]),
                Row(children: [
                  Text('${job['total_found']}', style: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w800, color: GeoColors.onSurface)),
                  const SizedBox(width: 10),
                  _StatusDot(status: job['status'] as String),
                ]),
              ]),
            )),
          ],
        ],
      ),
    );
  }
}

class _Label extends StatelessWidget {
  final String text;
  const _Label(this.text);
  @override
  Widget build(BuildContext context) => Text(text, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 1.5, color: GeoColors.onSurfaceVariant));
}

class _StatusDot extends StatelessWidget {
  final String status;
  const _StatusDot({required this.status});
  @override
  Widget build(BuildContext context) {
    final color = status == 'done' ? GeoColors.tertiary : status == 'failed' ? GeoColors.error : status == 'running' ? GeoColors.primary : GeoColors.secondary;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(color: color.withOpacity(0.15), borderRadius: BorderRadius.circular(12)),
      child: Text(status.toUpperCase(), style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: color)),
    );
  }
}
