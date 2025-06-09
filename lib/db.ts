import Database from 'better-sqlite3';

const db = new Database('database.db');

export function init() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS copy_of_tomorrow_trips (
      id TEXT PRIMARY KEY,
      data TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS event_stream (
      id TEXT PRIMARY KEY,
      data TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS drivers_report (
      id TEXT PRIMARY KEY,
      data TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS van_checks (
      id TEXT PRIMARY KEY,
      data TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS schedule_trips (
      id TEXT PRIMARY KEY,
      data TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS csv_trips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT,
      message TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // ensure legacy databases have the created_at column
  const tables = [
    'copy_of_tomorrow_trips',
    'event_stream',
    'drivers_report',
    'schedule_trips',
    'csv_trips',
    'van_checks',
  ];
  for (const table of tables) {
    try {
      db.exec(`ALTER TABLE ${table} ADD COLUMN created_at TEXT`);
    } catch {
      // ignore if column already exists
    }
  }
}

init();

export function addNotification(type: string, message: string) {
  db.prepare('INSERT INTO notifications (type, message) VALUES (?, ?)').run(
    type,
    message,
  );
}

export default db;
