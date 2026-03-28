import 'dart:io';
import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:geointel_mobile/core/theme.dart';

class ExportShareSheet extends StatelessWidget {
  final int? territoryId;
  final String? businessName;

  const ExportShareSheet({super.key, this.territoryId, this.businessName});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(24, 8, 24, 32),
      decoration: const BoxDecoration(
        color: GeoColors.surfaceContainerLow,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(width: 40, height: 4, decoration: BoxDecoration(color: GeoColors.outlineVariant.withOpacity(0.4), borderRadius: BorderRadius.circular(2))),
          const SizedBox(height: 20),
          Text('Export & Share', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, fontFamily: 'Manrope', color: GeoColors.onSurface)),
          const SizedBox(height: 20),
          _ActionTile(
            icon: Icons.picture_as_pdf,
            color: GeoColors.error,
            label: 'View PDF Report',
            subtitle: 'Open executive report in browser',
            onTap: () => _openPdfReport(context),
          ),
          const SizedBox(height: 12),
          _ActionTile(
            icon: Icons.download,
            color: GeoColors.primary,
            label: 'Download CSV',
            subtitle: 'Export business data as spreadsheet',
            onTap: () => _downloadCsv(context),
          ),
          const SizedBox(height: 12),
          _ActionTile(
            icon: Icons.share,
            color: GeoColors.tertiary,
            label: 'Share Profile',
            subtitle: 'Share business info via messaging apps',
            onTap: () => _shareProfile(context),
          ),
        ],
      ),
    );
  }

  Future<void> _openPdfReport(BuildContext context) async {
    final params = <String, String>{};
    if (territoryId != null) params['territory_id'] = territoryId.toString();
    final query = params.entries.map((e) => '${e.key}=${e.value}').join('&');
    final url = 'http://192.168.1.52:8000/api/v1/export/pdf?$query';

    if (await canLaunchUrl(Uri.parse(url))) {
      await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
    }
    if (context.mounted) Navigator.pop(context);
  }

  Future<void> _downloadCsv(BuildContext context) async {
    try {
      final dir = await getTemporaryDirectory();
      final filePath = '${dir.path}/geointel_export.csv';
      final params = <String, String>{};
      if (territoryId != null) params['territory_id'] = territoryId.toString();
      final query = params.entries.map((e) => '${e.key}=${e.value}').join('&');

      await Dio().download(
        'http://192.168.1.52:8000/api/v1/export/csv?$query',
        filePath,
      );

      if (context.mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('CSV downloaded'),
            backgroundColor: GeoColors.surfaceContainerHigh,
            action: SnackBarAction(
              label: 'SHARE',
              textColor: GeoColors.primary,
              onPressed: () => Share.shareXFiles([XFile(filePath)], text: 'GeoIntel Export'),
            ),
          ),
        );
      }
    } catch (e) {
      if (context.mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Export failed: $e'), backgroundColor: GeoColors.errorContainer),
        );
      }
    }
  }

  void _shareProfile(BuildContext context) {
    final text = businessName != null
        ? 'Check out $businessName on GeoIntel Intelligence Core! 🔍'
        : 'GeoIntel Intelligence Core — Geospatial Business Intelligence';
    Share.share(text);
    Navigator.pop(context);
  }
}

class _ActionTile extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String label;
  final String subtitle;
  final VoidCallback onTap;

  const _ActionTile({required this.icon, required this.color, required this.label, required this.subtitle, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: GeoColors.surfaceContainerHigh,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: GeoColors.outlineVariant.withOpacity(0.1)),
        ),
        child: Row(children: [
          Container(
            width: 44, height: 44,
            decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
            child: Icon(icon, color: color, size: 22),
          ),
          const SizedBox(width: 16),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(label, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: GeoColors.onSurface)),
            const SizedBox(height: 2),
            Text(subtitle, style: const TextStyle(fontSize: 11, color: GeoColors.onSurfaceVariant)),
          ])),
          const Icon(Icons.chevron_right, color: GeoColors.outlineVariant, size: 20),
        ]),
      ),
    );
  }
}
