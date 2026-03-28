import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:geointel_mobile/core/theme.dart';
import 'package:geointel_mobile/core/offline_cache.dart';
import 'package:geointel_mobile/widgets/geo_top_bar.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const GeoTopBar(showSearch: false),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 120),
        children: [
          Text('Settings', style: GoogleFonts.manrope(fontSize: 28, fontWeight: FontWeight.w800, color: GeoColors.onSurface, letterSpacing: -0.5)),
          const SizedBox(height: 24),

          _SettingsGroup(title: 'Account', children: [
            _SettingsTile(icon: Icons.person, label: 'Profile', onTap: () {}),
            _SettingsTile(icon: Icons.notifications, label: 'Notifications', onTap: () {}),
            _SettingsTile(icon: Icons.security, label: 'Security', onTap: () {}),
          ]),
          const SizedBox(height: 24),

          _SettingsGroup(title: 'Integrations', children: [
            _SettingsTile(icon: Icons.key, label: 'API Keys', onTap: () {}),
            _SettingsTile(icon: Icons.webhook, label: 'Webhooks', onTap: () {}),
            _SettingsTile(icon: Icons.sync_alt, label: 'n8n Automation', onTap: () {}),
          ]),
          const SizedBox(height: 24),

          _SettingsGroup(title: 'App', children: [
            _SettingsTile(icon: Icons.language, label: 'Language', trailing: 'English', onTap: () {}),
            _SettingsTile(icon: Icons.dark_mode, label: 'Theme', trailing: 'Dark', onTap: () {}),
            _SettingsTile(icon: Icons.storage, label: 'Clear Offline Cache', trailing: '', onTap: () async {
              await OfflineCache.clearAll();
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Cache cleared'), backgroundColor: GeoColors.surfaceContainerHigh),
                );
              }
            }),
          ]),
          const SizedBox(height: 24),

          _SettingsGroup(title: 'About', children: [
            _SettingsTile(icon: Icons.info, label: 'Version', trailing: '1.0.0', onTap: () {}),
            _SettingsTile(icon: Icons.help, label: 'Support', onTap: () {}),
            _SettingsTile(icon: Icons.logout, label: 'Sign Out', textColor: GeoColors.error, onTap: () {}),
          ]),
        ],
      ),
    );
  }
}

class _SettingsGroup extends StatelessWidget {
  final String title;
  final List<Widget> children;
  const _SettingsGroup({required this.title, required this.children});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title.toUpperCase(), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 1.5, color: GeoColors.onSurfaceVariant)),
        const SizedBox(height: 12),
        Container(
          decoration: BoxDecoration(
            color: GeoColors.surfaceContainerLow,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: GeoColors.outlineVariant.withOpacity(0.1)),
          ),
          child: Column(children: children),
        ),
      ],
    );
  }
}

class _SettingsTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String? trailing;
  final Color? textColor;
  final VoidCallback onTap;
  const _SettingsTile({required this.icon, required this.label, this.trailing, this.textColor, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Icon(icon, size: 20, color: textColor ?? GeoColors.onSurfaceVariant),
            const SizedBox(width: 16),
            Expanded(child: Text(label, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: textColor ?? GeoColors.onSurface))),
            if (trailing != null)
              Text(trailing!, style: const TextStyle(fontSize: 13, color: GeoColors.onSurfaceVariant)),
            const SizedBox(width: 8),
            const Icon(Icons.chevron_right, size: 18, color: GeoColors.outlineVariant),
          ],
        ),
      ),
    );
  }
}
