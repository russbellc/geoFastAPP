import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ApiClient {
  static const String _baseUrl = 'http://192.168.1.52:8000/api/v1';
  static const String _tokenKey = 'auth_token';

  late final Dio _dio;
  String? _token;

  ApiClient() {
    _dio = Dio(BaseOptions(
      baseUrl: _baseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 30),
      headers: {'Content-Type': 'application/json'},
    ));

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) {
        if (_token != null) {
          options.headers['Authorization'] = 'Bearer $_token';
        }
        handler.next(options);
      },
      onError: (error, handler) {
        if (error.response?.statusCode == 401) {
          clearToken();
        }
        handler.next(error);
      },
    ));
  }

  Future<void> loadToken() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString(_tokenKey);
  }

  Future<void> setToken(String token) async {
    _token = token;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
  }

  Future<void> clearToken() async {
    _token = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
  }

  bool get isAuthenticated => _token != null;
  String get baseUrl => _baseUrl;

  // Auth
  Future<Map<String, dynamic>> login(String email, String password) async {
    final res = await _dio.post('/auth/login', data: {'email': email, 'password': password});
    return res.data;
  }

  Future<Map<String, dynamic>> register(String email, String password, String fullName) async {
    final res = await _dio.post('/auth/register', data: {
      'email': email, 'password': password, 'full_name': fullName,
    });
    return res.data;
  }

  Future<Map<String, dynamic>> getMe() async {
    final res = await _dio.get('/auth/me');
    return res.data;
  }

  // Businesses
  Future<Map<String, dynamic>> getBusinesses({int page = 1, int perPage = 20, String? category}) async {
    final params = <String, dynamic>{'page': page, 'per_page': perPage};
    if (category != null) params['category'] = category;
    final res = await _dio.get('/businesses', queryParameters: params);
    return res.data;
  }

  Future<Map<String, dynamic>> getBusinessProfile(int id) async {
    final res = await _dio.get('/businesses/$id/profile');
    return res.data;
  }

  Future<void> enrichBusiness(int id) async {
    await _dio.post('/businesses/$id/enrich');
  }

  // Scans
  Future<Map<String, dynamic>> createScan(Map<String, dynamic> data) async {
    final res = await _dio.post('/scans/territory', data: data);
    return res.data;
  }

  Future<Map<String, dynamic>> getScanStatus(int id) async {
    final res = await _dio.get('/scans/$id/status');
    return res.data;
  }

  Future<List<dynamic>> getScanHistory() async {
    final res = await _dio.get('/scans/history');
    return res.data;
  }

  // Stats
  Future<Map<String, dynamic>> getTerritoryStats(int id) async {
    final res = await _dio.get('/stats/territory/$id');
    return res.data;
  }

  Future<Map<String, dynamic>> getHealthStats() async {
    final res = await _dio.get('/stats/health');
    return res.data;
  }

  // Search
  Future<Map<String, dynamic>> semanticSearch(String query, {int limit = 10}) async {
    final res = await _dio.post('/search/semantic', data: {'query': query, 'limit': limit});
    return res.data;
  }

  // Competitors
  Future<List<dynamic>> getCompetitors() async {
    final res = await _dio.get('/competitors');
    return res.data;
  }

  Future<void> scanCompetitors() async {
    await _dio.post('/competitors/scan');
  }

  // API Keys
  Future<List<dynamic>> getApiKeys() async {
    final res = await _dio.get('/api-keys');
    return res.data;
  }

  Future<Map<String, dynamic>> createApiKey(String name, List<String> permissions) async {
    final res = await _dio.post('/api-keys', data: {'name': name, 'permissions': permissions});
    return res.data;
  }

  Future<void> revokeApiKey(int id) async {
    await _dio.delete('/api-keys/$id');
  }

  // Webhooks
  Future<List<dynamic>> getWebhooks() async {
    final res = await _dio.get('/webhooks');
    return res.data;
  }

  Future<Map<String, dynamic>> createWebhook(String url, List<String> events) async {
    final res = await _dio.post('/webhooks', data: {'url': url, 'events': events});
    return res.data;
  }

  Future<void> deleteWebhook(int id) async {
    await _dio.delete('/webhooks/$id');
  }

  // Export
  Future<String> getExportPdfUrl({int? territoryId}) {
    final params = territoryId != null ? '?territory_id=$territoryId' : '';
    return Future.value('$_baseUrl/export/pdf$params');
  }
}
