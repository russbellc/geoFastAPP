import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geointel_mobile/core/router.dart';
import 'package:geointel_mobile/core/theme.dart';

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

class GeoIntelApp extends StatelessWidget {
  const GeoIntelApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'GeoIntel',
      debugShowCheckedModeBanner: false,
      theme: GeoTheme.dark,
      routerConfig: router,
    );
  }
}
