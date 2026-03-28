import 'dart:convert';
import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart' as p;

class OfflineCache {
  static Database? _db;

  static Future<Database> get database async {
    if (_db != null) return _db!;
    final dbPath = await getDatabasesPath();
    _db = await openDatabase(
      p.join(dbPath, 'geointel_cache.db'),
      version: 1,
      onCreate: (db, version) async {
        await db.execute('''
          CREATE TABLE businesses (
            id INTEGER PRIMARY KEY,
            data TEXT NOT NULL,
            cached_at INTEGER NOT NULL
          )
        ''');
        await db.execute('''
          CREATE TABLE profiles (
            business_id INTEGER PRIMARY KEY,
            data TEXT NOT NULL,
            cached_at INTEGER NOT NULL
          )
        ''');
        await db.execute('''
          CREATE TABLE api_cache (
            key TEXT PRIMARY KEY,
            data TEXT NOT NULL,
            cached_at INTEGER NOT NULL
          )
        ''');
      },
    );
    return _db!;
  }

  // Cache businesses
  static Future<void> cacheBusinesses(List<Map<String, dynamic>> businesses) async {
    final db = await database;
    final batch = db.batch();
    final now = DateTime.now().millisecondsSinceEpoch;
    for (final biz in businesses) {
      batch.insert('businesses', {
        'id': biz['id'],
        'data': jsonEncode(biz),
        'cached_at': now,
      }, conflictAlgorithm: ConflictAlgorithm.replace);
    }
    await batch.commit(noResult: true);
  }

  static Future<List<Map<String, dynamic>>> getCachedBusinesses() async {
    final db = await database;
    final rows = await db.query('businesses', orderBy: 'id DESC', limit: 200);
    return rows.map((r) => jsonDecode(r['data'] as String) as Map<String, dynamic>).toList();
  }

  // Cache profiles
  static Future<void> cacheProfile(int businessId, Map<String, dynamic> profile) async {
    final db = await database;
    await db.insert('profiles', {
      'business_id': businessId,
      'data': jsonEncode(profile),
      'cached_at': DateTime.now().millisecondsSinceEpoch,
    }, conflictAlgorithm: ConflictAlgorithm.replace);
  }

  static Future<Map<String, dynamic>?> getCachedProfile(int businessId) async {
    final db = await database;
    final rows = await db.query('profiles', where: 'business_id = ?', whereArgs: [businessId]);
    if (rows.isEmpty) return null;
    return jsonDecode(rows.first['data'] as String) as Map<String, dynamic>;
  }

  // Generic API cache
  static Future<void> cacheResponse(String key, dynamic data) async {
    final db = await database;
    await db.insert('api_cache', {
      'key': key,
      'data': jsonEncode(data),
      'cached_at': DateTime.now().millisecondsSinceEpoch,
    }, conflictAlgorithm: ConflictAlgorithm.replace);
  }

  static Future<dynamic> getCachedResponse(String key, {int maxAgeMinutes = 30}) async {
    final db = await database;
    final rows = await db.query('api_cache', where: 'key = ?', whereArgs: [key]);
    if (rows.isEmpty) return null;
    final cachedAt = rows.first['cached_at'] as int;
    final age = DateTime.now().millisecondsSinceEpoch - cachedAt;
    if (age > maxAgeMinutes * 60 * 1000) return null; // expired
    return jsonDecode(rows.first['data'] as String);
  }

  // Clear all cache
  static Future<void> clearAll() async {
    final db = await database;
    await db.delete('businesses');
    await db.delete('profiles');
    await db.delete('api_cache');
  }

  // Cache size in bytes (approximate)
  static Future<int> cacheSize() async {
    final db = await database;
    final result = await db.rawQuery("SELECT SUM(LENGTH(data)) as total FROM businesses UNION ALL SELECT SUM(LENGTH(data)) FROM profiles UNION ALL SELECT SUM(LENGTH(data)) FROM api_cache");
    int total = 0;
    for (final row in result) {
      total += (row['total'] as int?) ?? 0;
    }
    return total;
  }
}
