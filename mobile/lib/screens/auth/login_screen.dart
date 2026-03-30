import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:geointel_mobile/core/theme.dart';
import 'package:geointel_mobile/providers/providers.dart';

class LoginScreen extends ConsumerStatefulWidget {
  final VoidCallback onAuthenticated;

  const LoginScreen({super.key, required this.onAuthenticated});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _nameController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  bool _isRegisterMode = false;
  bool _obscurePassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    final email = _emailController.text.trim();
    final password = _passwordController.text.trim();

    if (_isRegisterMode) {
      final name = _nameController.text.trim();
      await ref.read(authProvider.notifier).register(name, email, password);
    } else {
      await ref.read(authProvider.notifier).login(email, password);
    }

    final state = ref.read(authProvider);
    if (state.isAuthenticated) {
      widget.onAuthenticated();
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Form(
              key: _formKey,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const SizedBox(height: 40),
                  // Logo
                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [
                          GeoColors.primary,
                          GeoColors.inversePrimary,
                        ],
                      ),
                    ),
                    child: const Icon(
                      Icons.explore,
                      size: 40,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    'GeoIntel',
                    style: GoogleFonts.manrope(
                      fontSize: 32,
                      fontWeight: FontWeight.w800,
                      color: GeoColors.onSurface,
                      letterSpacing: -1,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Centro de Inteligencia',
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      color: GeoColors.onSurfaceVariant,
                      letterSpacing: 1.5,
                    ),
                  ),
                  const SizedBox(height: 48),

                  // Error message
                  if (authState.error != null) ...[
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: GeoColors.errorContainer.withOpacity(0.3),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: GeoColors.error.withOpacity(0.3)),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.error_outline, color: GeoColors.error, size: 20),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              _parseError(authState.error!),
                              style: GoogleFonts.inter(
                                color: GeoColors.error,
                                fontSize: 13,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // Name field (register mode only)
                  if (_isRegisterMode) ...[
                    TextFormField(
                      controller: _nameController,
                      decoration: InputDecoration(
                        hintText: 'Nombre Completo',
                        prefixIcon: const Icon(Icons.person_outline, color: GeoColors.onSurfaceVariant),
                      ),
                      style: GoogleFonts.inter(color: GeoColors.onSurface),
                      textInputAction: TextInputAction.next,
                      validator: (v) {
                        if (_isRegisterMode && (v == null || v.trim().isEmpty)) {
                          return 'Ingresa tu nombre';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 14),
                  ],

                  // Email field
                  TextFormField(
                    controller: _emailController,
                    decoration: InputDecoration(
                      hintText: 'Correo electronico',
                      prefixIcon: const Icon(Icons.email_outlined, color: GeoColors.onSurfaceVariant),
                    ),
                    style: GoogleFonts.inter(color: GeoColors.onSurface),
                    keyboardType: TextInputType.emailAddress,
                    textInputAction: TextInputAction.next,
                    validator: (v) {
                      if (v == null || v.trim().isEmpty) return 'Ingresa tu correo';
                      if (!v.contains('@')) return 'Correo no valido';
                      return null;
                    },
                  ),
                  const SizedBox(height: 14),

                  // Password field
                  TextFormField(
                    controller: _passwordController,
                    decoration: InputDecoration(
                      hintText: 'Contrasena',
                      prefixIcon: const Icon(Icons.lock_outline, color: GeoColors.onSurfaceVariant),
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscurePassword ? Icons.visibility_off : Icons.visibility,
                          color: GeoColors.onSurfaceVariant,
                        ),
                        onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                      ),
                    ),
                    style: GoogleFonts.inter(color: GeoColors.onSurface),
                    obscureText: _obscurePassword,
                    textInputAction: TextInputAction.done,
                    onFieldSubmitted: (_) => _submit(),
                    validator: (v) {
                      if (v == null || v.trim().isEmpty) return 'Ingresa tu contrasena';
                      if (v.length < 6) return 'Minimo 6 caracteres';
                      return null;
                    },
                  ),
                  const SizedBox(height: 24),

                  // Submit button
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        gradient: const LinearGradient(
                          colors: [GeoColors.primary, GeoColors.inversePrimary],
                        ),
                      ),
                      child: ElevatedButton(
                        onPressed: authState.isLoading ? null : _submit,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.transparent,
                          shadowColor: Colors.transparent,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: authState.isLoading
                            ? const SizedBox(
                                width: 22,
                                height: 22,
                                child: CircularProgressIndicator(
                                  color: Colors.white,
                                  strokeWidth: 2.5,
                                ),
                              )
                            : Text(
                                _isRegisterMode ? 'Crear Cuenta' : 'Iniciar Sesion',
                                style: GoogleFonts.inter(
                                  fontWeight: FontWeight.w700,
                                  fontSize: 15,
                                  color: Colors.white,
                                  letterSpacing: 0.5,
                                ),
                              ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Toggle login/register
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        _isRegisterMode ? 'Ya tienes cuenta?' : 'No tienes cuenta?',
                        style: GoogleFonts.inter(
                          color: GeoColors.onSurfaceVariant,
                          fontSize: 14,
                        ),
                      ),
                      TextButton(
                        onPressed: () {
                          setState(() {
                            _isRegisterMode = !_isRegisterMode;
                          });
                          // Clear error on toggle
                          ref.read(authProvider.notifier).clearError();
                        },
                        child: Text(
                          _isRegisterMode ? 'Iniciar Sesion' : 'Registrarse',
                          style: GoogleFonts.inter(
                            color: GeoColors.primary,
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  String _parseError(String error) {
    if (error.contains('DioException')) {
      if (error.contains('connection')) return 'Error de conexion. Verifica tu red.';
      if (error.contains('401') || error.contains('403')) return 'Credenciales incorrectas.';
      if (error.contains('409')) return 'Este correo ya esta registrado.';
      if (error.contains('422')) return 'Datos invalidos. Verifica los campos.';
      return 'Error del servidor. Intenta de nuevo.';
    }
    return error;
  }
}
