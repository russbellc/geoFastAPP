import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:geointel_mobile/core/theme.dart';
import 'package:geointel_mobile/core/offline_cache.dart';
import 'package:geointel_mobile/widgets/geo_top_bar.dart';
import 'package:geointel_mobile/providers/providers.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  List<Map<String, dynamic>> _apiKeys = [];
  List<Map<String, dynamic>> _webhooks = [];
  bool _loading = true;
  String _newKeyName = '';
  String _newWebhookUrl = '';
  final Set<String> _selectedEvents = {};
  String? _createdKey;

  static const _events = ['lead.hot', 'scan.completed', 'competitor.new', 'business.enriched'];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final api = ref.read(apiClientProvider);
      final keys = await api.getApiKeys();
      final hooks = await api.getWebhooks();
      if (mounted) setState(() { _apiKeys = List<Map<String, dynamic>>.from(keys); _webhooks = List<Map<String, dynamic>>.from(hooks); _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _createKey() async {
    if (_newKeyName.isEmpty) return;
    try {
      final result = await ref.read(apiClientProvider).createApiKey(_newKeyName, ['read', 'scan', 'export']);
      setState(() { _createdKey = result['key'] as String?; _newKeyName = ''; });
      _loadData();
    } catch (_) {}
  }

  Future<void> _createWebhook() async {
    if (_newWebhookUrl.isEmpty || _selectedEvents.isEmpty) return;
    try {
      await ref.read(apiClientProvider).createWebhook(_newWebhookUrl, _selectedEvents.toList());
      setState(() { _newWebhookUrl = ''; _selectedEvents.clear(); });
      _loadData();
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const GeoTopBar(showSearch: false),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: GeoColors.primary))
          : ListView(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 120),
              children: [
                Text('Settings', style: GoogleFonts.manrope(fontSize: 28, fontWeight: FontWeight.w800, color: GeoColors.onSurface, letterSpacing: -0.5)),
                const SizedBox(height: 24),

                // API Keys
                _SectionCard(
                  icon: Icons.key, iconColor: GeoColors.primary, title: 'API Keys',
                  children: [
                    Row(children: [
                      Expanded(child: TextField(onChanged: (v) => setState(() => _newKeyName = v), controller: TextEditingController(text: _newKeyName), decoration: const InputDecoration(hintText: 'Key name...'), style: const TextStyle(color: GeoColors.onSurface, fontSize: 13))),
                      const SizedBox(width: 8),
                      GestureDetector(
                        onTap: _createKey,
                        child: Container(padding: const EdgeInsets.all(12), decoration: BoxDecoration(gradient: const LinearGradient(colors: [GeoColors.primary, GeoColors.primaryContainer]), borderRadius: BorderRadius.circular(10)), child: const Icon(Icons.add, color: GeoColors.onPrimary, size: 18)),
                      ),
                    ]),
                    if (_createdKey != null) ...[
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(color: GeoColors.tertiary.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          const Text('Save this key (shown once):', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: GeoColors.tertiary)),
                          const SizedBox(height: 6),
                          GestureDetector(
                            onTap: () { Clipboard.setData(ClipboardData(text: _createdKey!)); ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Copied!'))); },
                            child: Text(_createdKey!, style: GoogleFonts.firaCode(fontSize: 10, color: GeoColors.onSurface)),
                          ),
                        ]),
                      ),
                    ],
                    const SizedBox(height: 12),
                    ..._apiKeys.map((k) => _KeyTile(
                      name: k['name'] as String,
                      prefix: k['key_prefix'] as String,
                      active: k['active'] as bool,
                      permissions: List<String>.from(k['permissions'] ?? []),
                      onRevoke: () async {
                        await ref.read(apiClientProvider).revokeApiKey(k['id'] as int);
                        _loadData();
                      },
                    )),
                  ],
                ),
                const SizedBox(height: 20),

                // Webhooks
                _SectionCard(
                  icon: Icons.webhook, iconColor: GeoColors.tertiary, title: 'Webhooks',
                  children: [
                    TextField(onChanged: (v) => setState(() => _newWebhookUrl = v), decoration: const InputDecoration(hintText: 'https://n8n.example.com/webhook/...'), style: const TextStyle(color: GeoColors.onSurface, fontSize: 13)),
                    const SizedBox(height: 10),
                    Wrap(spacing: 6, runSpacing: 6, children: _events.map((e) {
                      final sel = _selectedEvents.contains(e);
                      return GestureDetector(
                        onTap: () => setState(() => sel ? _selectedEvents.remove(e) : _selectedEvents.add(e)),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          decoration: BoxDecoration(color: sel ? GeoColors.tertiary : GeoColors.surfaceContainerHighest, borderRadius: BorderRadius.circular(8)),
                          child: Text(e, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: sel ? GeoColors.background : GeoColors.onSurfaceVariant)),
                        ),
                      );
                    }).toList()),
                    const SizedBox(height: 10),
                    GestureDetector(
                      onTap: _createWebhook,
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        decoration: BoxDecoration(gradient: const LinearGradient(colors: [GeoColors.primary, GeoColors.primaryContainer]), borderRadius: BorderRadius.circular(10)),
                        alignment: Alignment.center,
                        child: const Text('REGISTER WEBHOOK', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: GeoColors.onPrimary, letterSpacing: 1)),
                      ),
                    ),
                    const SizedBox(height: 12),
                    ..._webhooks.map((h) => _WebhookTile(
                      url: h['url'] as String,
                      events: List<String>.from(h['events'] ?? []),
                      onDelete: () async {
                        await ref.read(apiClientProvider).deleteWebhook(h['id'] as int);
                        _loadData();
                      },
                    )),
                  ],
                ),
                const SizedBox(height: 20),

                // App
                _SectionCard(icon: Icons.phone_android, iconColor: GeoColors.secondary, title: 'App', children: [
                  _SimpleTile(icon: Icons.delete_outline, label: 'Clear Offline Cache', onTap: () async {
                    await OfflineCache.clearAll();
                    if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Cache cleared')));
                  }),
                  _SimpleTile(icon: Icons.info_outline, label: 'Version', trailing: '1.0.0'),
                  _SimpleTile(icon: Icons.logout, label: 'Sign Out', textColor: GeoColors.error, onTap: () async {
                    await ref.read(authProvider.notifier).logout();
                  }),
                ]),
              ],
            ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String title;
  final List<Widget> children;
  const _SectionCard({required this.icon, required this.iconColor, required this.title, required this.children});
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: GeoColors.surfaceContainerLow, borderRadius: BorderRadius.circular(16), border: Border.all(color: GeoColors.outlineVariant.withOpacity(0.1))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [Icon(icon, color: iconColor, size: 20), const SizedBox(width: 10), Text(title, style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w700, color: GeoColors.onSurface))]),
        const SizedBox(height: 16),
        ...children,
      ]),
    );
  }
}

class _KeyTile extends StatelessWidget {
  final String name, prefix;
  final bool active;
  final List<String> permissions;
  final VoidCallback onRevoke;
  const _KeyTile({required this.name, required this.prefix, required this.active, required this.permissions, required this.onRevoke});
  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: GeoColors.surfaceContainerHigh, borderRadius: BorderRadius.circular(10)),
      child: Row(children: [
        Container(width: 8, height: 8, decoration: BoxDecoration(shape: BoxShape.circle, color: active ? GeoColors.tertiary : GeoColors.outline)),
        const SizedBox(width: 12),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(name, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: GeoColors.onSurface)),
          Text('$prefix...', style: GoogleFonts.firaCode(fontSize: 10, color: GeoColors.onSurfaceVariant)),
        ])),
        if (active) GestureDetector(onTap: onRevoke, child: const Text('Revoke', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: GeoColors.error))),
      ]),
    );
  }
}

class _WebhookTile extends StatelessWidget {
  final String url;
  final List<String> events;
  final VoidCallback onDelete;
  const _WebhookTile({required this.url, required this.events, required this.onDelete});
  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: GeoColors.surfaceContainerHigh, borderRadius: BorderRadius.circular(10)),
      child: Row(children: [
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(url, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: GeoColors.onSurface), maxLines: 1, overflow: TextOverflow.ellipsis),
          const SizedBox(height: 4),
          Wrap(spacing: 4, children: events.map((e) => Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(color: GeoColors.tertiary.withOpacity(0.1), borderRadius: BorderRadius.circular(4)),
            child: Text(e, style: const TextStyle(fontSize: 8, fontWeight: FontWeight.w700, color: GeoColors.tertiary)),
          )).toList()),
        ])),
        GestureDetector(onTap: onDelete, child: const Text('Delete', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: GeoColors.error))),
      ]),
    );
  }
}

class _SimpleTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String? trailing;
  final Color? textColor;
  final VoidCallback? onTap;
  const _SimpleTile({required this.icon, required this.label, this.trailing, this.textColor, this.onTap});
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 10),
        child: Row(children: [
          Icon(icon, size: 18, color: textColor ?? GeoColors.onSurfaceVariant),
          const SizedBox(width: 12),
          Expanded(child: Text(label, style: TextStyle(fontSize: 14, color: textColor ?? GeoColors.onSurface))),
          if (trailing != null) Text(trailing!, style: const TextStyle(fontSize: 13, color: GeoColors.onSurfaceVariant)),
        ]),
      ),
    );
  }
}
