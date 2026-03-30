import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geointel_mobile/core/router.dart';
import 'package:geointel_mobile/core/theme.dart';
import 'package:geointel_mobile/providers/providers.dart';
import 'package:geointel_mobile/screens/auth/login_screen.dart';
import 'package:geointel_mobile/widgets/onboarding_flow.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.light,
    systemNavigationBarColor: GeoColors.background,
    systemNavigationBarIconBrightness: Brightness.light,
  ));

  runApp(const ProviderScope(child: GeoIntelApp()));
}

class GeoIntelApp extends StatefulWidget {
  const GeoIntelApp({super.key});

  @override
  State<GeoIntelApp> createState() => _GeoIntelAppState();
}

class _GeoIntelAppState extends State<GeoIntelApp> {
  bool _showOnboarding = false;
  bool _checked = false;

  @override
  void initState() {
    super.initState();
    _checkOnboarding();
  }

  Future<void> _checkOnboarding() async {
    final show = await OnboardingFlow.shouldShow();
    setState(() {
      _showOnboarding = show;
      _checked = true;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (!_checked) {
      return MaterialApp(
        theme: GeoTheme.dark,
        debugShowCheckedModeBanner: false,
        home: const Scaffold(
          body: Center(child: CircularProgressIndicator(color: GeoColors.primary)),
        ),
      );
    }

    if (_showOnboarding) {
      return MaterialApp(
        title: 'GeoIntel',
        debugShowCheckedModeBanner: false,
        theme: GeoTheme.dark,
        home: OnboardingFlow(
          onComplete: () => setState(() => _showOnboarding = false),
        ),
      );
    }

    return MaterialApp(
      title: 'GeoIntel',
      debugShowCheckedModeBanner: false,
      theme: GeoTheme.dark,
      home: const _AuthGate(),
    );
  }
}

class _AuthGate extends ConsumerWidget {
  const _AuthGate();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);

    // Still checking auth status
    if (authState.isLoading && !authState.isAuthenticated) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator(color: GeoColors.primary)),
      );
    }

    // Not authenticated — show login
    if (!authState.isAuthenticated) {
      return LoginScreen(
        onAuthenticated: () {
          // Force rebuild by invalidating — the watch above will pick up the new state
        },
      );
    }

    // Authenticated — show the router
    return MaterialApp.router(
      title: 'GeoIntel',
      debugShowCheckedModeBanner: false,
      theme: GeoTheme.dark,
      routerConfig: router,
    );
  }
}
