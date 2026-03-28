import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:geointel_mobile/core/theme.dart';

class AppShell extends StatelessWidget {
  final Widget child;
  const AppShell({super.key, required this.child});

  int _currentIndex(BuildContext context) {
    final location = GoRouterState.of(context).uri.toString();
    if (location == '/') return 0;
    if (location.startsWith('/territories')) return 1;
    if (location.startsWith('/leads')) return 2;
    if (location.startsWith('/settings')) return 3;
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    final index = _currentIndex(context);

    return Scaffold(
      body: child,
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: GeoColors.background.withOpacity(0.8),
          border: Border(top: BorderSide(color: GeoColors.surfaceContainerHighest.withOpacity(0.3))),
          boxShadow: [
            BoxShadow(color: GeoColors.primary.withOpacity(0.05), blurRadius: 12, offset: const Offset(0, -4)),
          ],
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _NavItem(icon: Icons.dashboard_rounded, label: 'Intelligence', isActive: index == 0, onTap: () => context.go('/')),
                _NavItem(icon: Icons.map_rounded, label: 'Territories', isActive: index == 1, onTap: () => context.go('/territories')),
                _NavItem(icon: Icons.person_search_rounded, label: 'Leads', isActive: index == 2, onTap: () => context.go('/leads')),
                _NavItem(icon: Icons.settings_rounded, label: 'Settings', isActive: index == 3, onTap: () => context.go('/settings')),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isActive;
  final VoidCallback onTap;

  const _NavItem({required this.icon, required this.label, required this.isActive, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: EdgeInsets.symmetric(horizontal: isActive ? 12 : 8, vertical: 6),
        decoration: BoxDecoration(
          color: isActive ? GeoColors.surfaceContainerLow : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: isActive ? GeoColors.primary : GeoColors.onSurfaceVariant.withOpacity(0.7), size: 24),
            const SizedBox(height: 4),
            Text(
              label.toUpperCase(),
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w500,
                letterSpacing: 0.8,
                color: isActive ? GeoColors.primary : GeoColors.onSurfaceVariant.withOpacity(0.7),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
