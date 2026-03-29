import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geointel_mobile/core/router.dart';
import 'package:geointel_mobile/core/theme.dart';
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

    return MaterialApp.router(
      title: 'GeoIntel',
      debugShowCheckedModeBanner: false,
      theme: GeoTheme.dark,
      routerConfig: router,
    );
  }
}
