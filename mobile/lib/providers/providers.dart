import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geointel_mobile/core/api_client.dart';

/// Global API client provider
final apiClientProvider = Provider<ApiClient>((ref) => ApiClient());

/// Auth state
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref.read(apiClientProvider));
});

class AuthState {
  final bool isAuthenticated;
  final bool isLoading;
  final Map<String, dynamic>? user;
  final String? error;

  const AuthState({
    this.isAuthenticated = false,
    this.isLoading = true,
    this.user,
    this.error,
  });

  AuthState copyWith({bool? isAuthenticated, bool? isLoading, Map<String, dynamic>? user, String? error}) {
    return AuthState(
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      isLoading: isLoading ?? this.isLoading,
      user: user ?? this.user,
      error: error,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final ApiClient _api;

  AuthNotifier(this._api) : super(const AuthState()) {
    checkAuth();
  }

  Future<void> checkAuth() async {
    try {
      await _api.loadToken();
      if (_api.isAuthenticated) {
        final user = await _api.getMe();
        state = AuthState(isAuthenticated: true, isLoading: false, user: user);
      } else {
        state = const AuthState(isAuthenticated: false, isLoading: false);
      }
    } catch (_) {
      state = const AuthState(isAuthenticated: false, isLoading: false);
    }
  }

  Future<void> login(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final res = await _api.login(email, password);
      await _api.setToken(res['access_token']);
      final user = await _api.getMe();
      state = AuthState(isAuthenticated: true, isLoading: false, user: user);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> register(String fullName, String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      await _api.register(email, password, fullName);
      // Auto-login after successful registration
      final res = await _api.login(email, password);
      await _api.setToken(res['access_token']);
      final user = await _api.getMe();
      state = AuthState(isAuthenticated: true, isLoading: false, user: user);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  void clearError() {
    state = state.copyWith(error: null);
  }

  Future<void> logout() async {
    await _api.clearToken();
    state = const AuthState(isAuthenticated: false, isLoading: false);
  }
}

/// Businesses provider
final businessesProvider = FutureProvider.family<Map<String, dynamic>, Map<String, dynamic>>((ref, params) async {
  final api = ref.read(apiClientProvider);
  return api.getBusinesses(
    page: params['page'] as int? ?? 1,
    perPage: params['per_page'] as int? ?? 20,
    category: params['category'] as String?,
  );
});

/// Territory stats provider
final territoryStatsProvider = FutureProvider.family<Map<String, dynamic>, int>((ref, id) async {
  return ref.read(apiClientProvider).getTerritoryStats(id);
});

/// Health stats provider
final healthStatsProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  return ref.read(apiClientProvider).getHealthStats();
});

/// Scan history provider
final scanHistoryProvider = FutureProvider<List<dynamic>>((ref) async {
  return ref.read(apiClientProvider).getScanHistory();
});
