import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:geointel_mobile/screens/dashboard/dashboard_screen.dart';
import 'package:geointel_mobile/screens/map/map_screen.dart';
import 'package:geointel_mobile/screens/leads/leads_screen.dart';
import 'package:geointel_mobile/screens/scan/scan_screen.dart';
import 'package:geointel_mobile/screens/profile/profile_screen.dart';
import 'package:geointel_mobile/screens/settings/settings_screen.dart';
import 'package:geointel_mobile/widgets/app_shell.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();
final _shellNavigatorKey = GlobalKey<NavigatorState>();

final router = GoRouter(
  navigatorKey: _rootNavigatorKey,
  initialLocation: '/',
  routes: [
    ShellRoute(
      navigatorKey: _shellNavigatorKey,
      builder: (context, state, child) => AppShell(child: child),
      routes: [
        GoRoute(path: '/', builder: (_, __) => const DashboardScreen()),
        GoRoute(path: '/territories', builder: (_, __) => const MapScreen()),
        GoRoute(path: '/leads', builder: (_, __) => const LeadsScreen()),
        GoRoute(path: '/settings', builder: (_, __) => const SettingsScreen()),
      ],
    ),
    GoRoute(path: '/scan', builder: (_, __) => const ScanScreen()),
    GoRoute(
      path: '/profile/:id',
      builder: (_, state) => ProfileScreen(
        businessId: int.parse(state.pathParameters['id'] ?? '0'),
      ),
    ),
  ],
);
