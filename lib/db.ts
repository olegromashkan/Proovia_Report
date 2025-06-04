import Database from 'better-sqlite3';

const db = new Database('database.db');

export function init() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS copy_of_tomorrow_trips (
      id TEXT PRIMARY KEY,
      data TEXT
    );
    CREATE TABLE IF NOT EXISTS event_stream (
      id TEXT PRIMARY KEY,
      data TEXT
    );
    CREATE TABLE IF NOT EXISTS drivers_report (
      id TEXT PRIMARY KEY,
      data TEXT
    );
    CREATE TABLE IF NOT EXISTS schedule_trips (
      id TEXT PRIMARY KEY,
      data TEXT
    );
  `);
}

init();

export default db;
