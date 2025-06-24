import Database from 'better-sqlite3';

declare global {
  // eslint-disable-next-line no-var
  var sqliteDb: Database | undefined;
}

const db: Database =
  global.sqliteDb || new Database('database.db', { timeout: 600000 });
if (!global.sqliteDb) {
  try {
    db.pragma('journal_mode = WAL');
  } catch (err) {
    console.error('Failed to set journal_mode to WAL', err);
  }
  try {
    db.pragma('busy_timeout = 600000');
  } catch (err) {
    console.error('Failed to set busy_timeout', err);
  }
  global.sqliteDb = db;
}

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

    CREATE TABLE IF NOT EXISTS chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      photo TEXT,
      pinned INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS chat_members (
      chat_id INTEGER,
      username TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id INTEGER,
      sender TEXT,
      receiver TEXT,
      text TEXT,
      reply_to INTEGER,
      pinned INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT,
      content TEXT,
      image TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT,
      type TEXT DEFAULT 'user'
    );
    CREATE TABLE IF NOT EXISTS post_likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER,
      username TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(post_id, username)
    );
    CREATE TABLE IF NOT EXISTS post_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER,
      username TEXT,
      text TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS legacy_totals (
      id INTEGER PRIMARY KEY,
      total_orders INTEGER,
      collection_total INTEGER,
      collection_complete INTEGER,
      collection_failed INTEGER,
      delivery_total INTEGER,
      delivery_complete INTEGER,
      delivery_failed INTEGER
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
    'posts',
    'post_likes',
    'post_comments',
    'chats',
    'chat_members',
    'messages',
  ];
  for (const table of tables) {
    try {
      db.exec(`ALTER TABLE ${table} ADD COLUMN created_at TEXT`);
    } catch {
      // ignore if column already exists
    }
  }
  function addColumnIfMissing(table: string, column: string, definition: string) {
    const info = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
    if (!info.find((c) => c.name === column)) {
      if (/current_timestamp/i.test(definition)) {
        // SQLite cannot add a column with a non-constant default, so create the
        // column without the default in this case.
        db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} TEXT`);
      } else {
        db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
      }
    }
  }

  addColumnIfMissing('users', 'role', "TEXT DEFAULT 'admin'");
  addColumnIfMissing('users', 'status', "TEXT DEFAULT 'offline'");
  addColumnIfMissing('users', 'status_message', 'TEXT');
  addColumnIfMissing('users', 'last_seen', 'TEXT DEFAULT CURRENT_TIMESTAMP');
  addColumnIfMissing('tasks', 'due_at', 'TEXT');
  addColumnIfMissing('posts', 'updated_at', 'TEXT');
  addColumnIfMissing('posts', 'type', "TEXT DEFAULT 'user'");
  addColumnIfMissing('messages', 'chat_id', 'INTEGER');
  addColumnIfMissing('messages', 'reply_to', 'INTEGER');
  addColumnIfMissing('messages', 'pinned', 'INTEGER DEFAULT 0');
  addColumnIfMissing('messages', 'image', 'TEXT');
  addColumnIfMissing('messages', 'edited_at', 'TEXT');
  addColumnIfMissing('messages', 'deleted', 'INTEGER DEFAULT 0');
  addColumnIfMissing('chats', 'photo', 'TEXT');
  addColumnIfMissing('chats', 'pinned', 'INTEGER DEFAULT 0');

  // seed legacy totals if not already present
  const legacyRow = db
    .prepare('SELECT 1 FROM legacy_totals WHERE id = 1')
    .get();
  if (!legacyRow) {
    db.prepare(
      `INSERT INTO legacy_totals (
        id,
        total_orders,
        collection_total,
        collection_complete,
        collection_failed,
        delivery_total,
        delivery_complete,
        delivery_failed
      ) VALUES (1, 457766, 232168, 217055, 15113, 222004, 217919, 4085)`,
    ).run();
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
