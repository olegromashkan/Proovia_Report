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
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      photo TEXT,
      header TEXT,
      role TEXT DEFAULT 'user',
      status TEXT DEFAULT 'offline',
      status_message TEXT,
      last_seen TEXT DEFAULT CURRENT_TIMESTAMP,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS friends (
      user_id INTEGER,
      friend_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      creator TEXT,
      assignee TEXT,
      text TEXT,
      due_at TEXT,
      completed INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender TEXT,
      receiver TEXT,
      text TEXT,
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
    'users',
  ];
  for (const table of tables) {
    try {
      db.exec(`ALTER TABLE ${table} ADD COLUMN created_at TEXT`);
    } catch {
      // ignore if column already exists
    }
  }
  try {
    db.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'admin'");
  } catch {
    // ignore if exists
  }
  try {
    db.exec("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'offline'");
  } catch {}
  try {
    db.exec("ALTER TABLE users ADD COLUMN status_message TEXT");
  } catch {}
  try {
    db.exec("ALTER TABLE users ADD COLUMN last_seen TEXT DEFAULT CURRENT_TIMESTAMP");
  } catch {}
  try {
    db.exec("ALTER TABLE tasks ADD COLUMN due_at TEXT");
  } catch {
    // ignore if exists
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
