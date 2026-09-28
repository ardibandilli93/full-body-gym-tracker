import * as SQLite from 'expo-sqlite';

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function migrate(database: SQLite.SQLiteDatabase): Promise<void> {
  const result = await database.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const version = result?.user_version ?? 0;

  if (version < 1) {
    await database.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS profiles (
        owner_id TEXT PRIMARY KEY NOT NULL,
        payload_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS plans (
        id TEXT PRIMARY KEY NOT NULL,
        owner_id TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 0,
        revision INTEGER NOT NULL DEFAULT 1,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS plans_owner_active_idx
        ON plans(owner_id, is_active);

      CREATE TABLE IF NOT EXISTS workout_sessions (
        id TEXT PRIMARY KEY NOT NULL,
        owner_id TEXT NOT NULL,
        local_date TEXT NOT NULL,
        plan_day_id TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('in_progress', 'complete')),
        payload_json TEXT NOT NULL,
        revision INTEGER NOT NULL DEFAULT 1,
        sync_state TEXT NOT NULL DEFAULT 'pending',
        started_at TEXT NOT NULL,
        finished_at TEXT,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS sessions_owner_date_idx
        ON workout_sessions(owner_id, local_date DESC);
      CREATE INDEX IF NOT EXISTS sessions_owner_status_idx
        ON workout_sessions(owner_id, status);
      CREATE INDEX IF NOT EXISTS sessions_owner_day_idx
        ON workout_sessions(owner_id, plan_day_id, started_at DESC);

      CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        owner_id TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        operation TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        last_error TEXT
      );

      CREATE INDEX IF NOT EXISTS sync_queue_owner_created_idx
        ON sync_queue(owner_id, created_at);

      PRAGMA user_version = 1;
    `);
  }
}

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync('full-body.db').then(async (database) => {
      await migrate(database);
      return database;
    });
  }
  return databasePromise;
}
