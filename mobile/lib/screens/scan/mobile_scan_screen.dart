import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:geointel_mobile/core/theme.dart';
import 'package:geointel_mobile/providers/providers.dart';
import 'package:geointel_mobile/widgets/geo_top_bar.dart';

class MobileScanScreen extends ConsumerStatefulWidget {
  const MobileScanScreen({super.key});

  @override
  ConsumerState<MobileScanScreen> createState() => _MobileScanScreenState();
}

class _MobileScanScreenState extends ConsumerState<MobileScanScreen> {
  Position? _position;
  bool _locating = false;
  double _radiusKm = 1.0;
  String _name = '';
  String _nicho = '';
  String _status = ''; // pending, running, done, failed
  int _totalFound = 0;
  int? _jobId;
  Timer? _pollTimer;

  @override
  void initState() {
    super.initState();
    _getLocation();
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }

  Future<void> _getLocation() async {
    setState(() => _locating = true);
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        setState(() { _locating = false; _status = 'Servicios de ubicacion desactivados'; });
        return;
      }
      LocationPermission perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        perm = await Geolocator.requestPermission();
      }
      if (perm == LocationPermission.deniedForever || perm == LocationPermission.denied) {
        setState(() { _locating = false; _status = 'Permiso de ubicacion denegado'; });
        return;
      }
      final pos = await Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.high);
      setState(() { _position = pos; _locating = false; });
    } catch (e) {
      setState(() { _locating = false; _status = 'Error: $e'; });
    }
  }

  Future<void> _launchScan() async {
    if (_position == null || _name.isEmpty) return;
    setState(() { _status = 'pending'; _totalFound = 0; });

    try {
      final api = ref.read(apiClientProvider);
      final result = await api.createScan({
        'name': _name,
        'city': 'Mobile Scan',
        'country': 'Auto',
        'lat': _position!.latitude,
        'lng': _position!.longitude,
        'radius_km': _radiusKm,
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
        final api = ref.read(apiClientProvider);
        final status = await api.getScanStatus(_jobId!);
        setState(() {
          _status = status['status'];
          _totalFound = status['total_found'] ?? 0;
        });
        if (_status == 'done' || _status == 'failed') {
          timer.cancel();
        }
      } catch (_) {
        timer.cancel();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const GeoTopBar(title: 'Escanear desde Ubicacion', showBack: true, showSearch: false),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(24, 16, 24, 120),
        children: [
          // Location status
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: GeoColors.surfaceContainerLow,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: GeoColors.outlineVariant.withOpacity(0.1)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  Icon(
                    _position != null ? Icons.my_location : Icons.location_searching,
                    color: _position != null ? GeoColors.tertiary : GeoColors.primary,
                    size: 20,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    _locating ? 'LOCALIZANDO...' : _position != null ? 'UBICACION OBTENIDA' : 'SIN UBICACION',
                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 1.5, color: _position != null ? GeoColors.tertiary : GeoColors.onSurfaceVariant),
                  ),
                ]),
                if (_position != null) ...[
                  const SizedBox(height: 12),
                  Text(
                    '${_position!.latitude.toStringAsFixed(6)}, ${_position!.longitude.toStringAsFixed(6)}',
                    style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: GeoColors.onSurface),
                  ),
                  const SizedBox(height: 4),
                  Text('Precision: ${_position!.accuracy.toStringAsFixed(0)}m', style: const TextStyle(fontSize: 11, color: GeoColors.onSurfaceVariant)),
                ],
                if (_locating)
                  const Padding(
                    padding: EdgeInsets.only(top: 12),
                    child: LinearProgressIndicator(color: GeoColors.primary, backgroundColor: GeoColors.surfaceContainerHighest),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Scan config
          Text('CONFIGURACION DE ESCANEO', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 1.5, color: GeoColors.onSurfaceVariant)),
          const SizedBox(height: 12),

          // Territory name
          TextField(
            onChanged: (v) => setState(() => _name = v),
            decoration: const InputDecoration(hintText: 'Nombre del territorio (ej. Mi Zona)', prefixIcon: Icon(Icons.label, color: GeoColors.primary, size: 20)),
            style: const TextStyle(color: GeoColors.onSurface),
          ),
          const SizedBox(height: 12),

          // Niche
          TextField(
            onChanged: (v) => setState(() => _nicho = v),
            decoration: const InputDecoration(hintText: 'Nicho (opcional: salud, retail...)', prefixIcon: Icon(Icons.category, color: GeoColors.primary, size: 20)),
            style: const TextStyle(color: GeoColors.onSurface),
          ),
          const SizedBox(height: 20),

          // Radius slider
          Text('RADIO DE ESCANEO', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 1.5, color: GeoColors.onSurfaceVariant)),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: SliderTheme(
                  data: SliderThemeData(
                    activeTrackColor: GeoColors.primary,
                    inactiveTrackColor: GeoColors.surfaceContainerHighest,
                    thumbColor: GeoColors.primary,
                    overlayColor: GeoColors.primary.withOpacity(0.1),
                  ),
                  child: Slider(
                    value: _radiusKm,
                    min: 0.5,
                    max: 5.0,
                    divisions: 9,
                    onChanged: (v) => setState(() => _radiusKm = v),
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(color: GeoColors.surfaceContainerHighest, borderRadius: BorderRadius.circular(8)),
                child: Text('${_radiusKm.toStringAsFixed(1)} km', style: GoogleFonts.manrope(fontSize: 14, fontWeight: FontWeight.w700, color: GeoColors.primary)),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Launch button
          GestureDetector(
            onTap: (_position != null && _name.isNotEmpty && _status != 'running') ? _launchScan : null,
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 16),
              decoration: BoxDecoration(
                gradient: (_position != null && _name.isNotEmpty)
                    ? const LinearGradient(colors: [GeoColors.primary, GeoColors.primaryContainer])
                    : null,
                color: (_position == null || _name.isEmpty) ? GeoColors.surfaceContainerHighest : null,
                borderRadius: BorderRadius.circular(12),
              ),
              alignment: Alignment.center,
              child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                Icon(_status == 'running' ? Icons.hourglass_top : Icons.radar, size: 20, color: (_position != null && _name.isNotEmpty) ? GeoColors.onPrimary : GeoColors.onSurfaceVariant),
                const SizedBox(width: 8),
                Text(
                  _status == 'running' ? 'ESCANEANDO...' : 'ESCANEAR DESDE AQUI',
                  style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, letterSpacing: 1.5, color: (_position != null && _name.isNotEmpty) ? GeoColors.onPrimary : GeoColors.onSurfaceVariant),
                ),
              ]),
            ),
          ),

          // Status
          if (_status.isNotEmpty) ...[
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: GeoColors.surfaceContainerLow,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: GeoColors.outlineVariant.withOpacity(0.1)),
              ),
              child: Column(children: [
                Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                  const Text('Estado', style: TextStyle(fontSize: 13, color: GeoColors.onSurfaceVariant)),
                  _StatusChip(status: _status),
                ]),
                const SizedBox(height: 12),
                Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                  const Text('Negocios Encontrados', style: TextStyle(fontSize: 13, color: GeoColors.onSurfaceVariant)),
                  Text('$_totalFound', style: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w800, color: GeoColors.onSurface)),
                ]),
                if (_status == 'running') ...[
                  const SizedBox(height: 16),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(6),
                    child: const LinearProgressIndicator(minHeight: 8, color: GeoColors.primary, backgroundColor: GeoColors.surfaceContainerHighest),
                  ),
                ],
                if (_status == 'done') ...[
                  const SizedBox(height: 16),
                  Row(children: [
                    const Icon(Icons.check_circle, color: GeoColors.tertiary, size: 16),
                    const SizedBox(width: 8),
                    Text('Escaneo completado. $_totalFound negocios descubiertos.', style: const TextStyle(fontSize: 13, color: GeoColors.tertiary)),
                  ]),
                ],
              ]),
            ),
          ],
        ],
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  final String status;
  const _StatusChip({required this.status});

  @override
  Widget build(BuildContext context) {
    final colors = {
      'pending': GeoColors.secondary,
      'running': GeoColors.primary,
      'done': GeoColors.tertiary,
      'failed': GeoColors.error,
    };
    final color = colors[status] ?? GeoColors.outline;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: color.withOpacity(0.15), borderRadius: BorderRadius.circular(20)),
      child: Text(status.toUpperCase(), style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: color, letterSpacing: 0.8)),
    );
  }
}
