import { createClient } from '@clickhouse/client';

declare global {
  // eslint-disable-next-line no-var
  var clickhouseClient: ReturnType<typeof createClient> | undefined;
}

const client =
  global.clickhouseClient ||
  createClient({
    host: process.env.CLICKHOUSE_HOST || 'http://localhost:8123',
    username: process.env.CLICKHOUSE_USERNAME || 'default',
    password: process.env.CLICKHOUSE_PASSWORD || '',
  });

if (!global.clickhouseClient) {
  global.clickhouseClient = client;
}

function escapeValue(val: any): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return String(val);
  return `'${String(val).replace(/'/g, "''")}'`;
}

function format(sql: string, params: any[]): string {
  let i = 0;
  return sql.replace(/\?/g, () => escapeValue(params[i++]));
}

async function exec(sql: string) {
  await client.exec({ query: sql });
}

async function query(sql: string) {
  const rs = await client.query({ query: sql, format: 'JSONEachRow' });
  return (await rs.json()) as any[];
}

export function prepare(sql: string) {
  return {
    all: async (...params: any[]) => query(format(sql, params)),
    get: async (...params: any[]) => {
      const rows = await query(format(sql, params));
      return rows[0];
    },
    run: async (...params: any[]) => exec(format(sql, params)),
  };
}

export async function init() {
  const statements = [
    `CREATE TABLE IF NOT EXISTS copy_of_tomorrow_trips (id String, data String, created_at DateTime DEFAULT now()) ENGINE = MergeTree() ORDER BY id`,
    `CREATE TABLE IF NOT EXISTS event_stream (id String, data String, created_at DateTime DEFAULT now()) ENGINE = MergeTree() ORDER BY id`,
    `CREATE TABLE IF NOT EXISTS drivers_report (id String, data String, created_at DateTime DEFAULT now()) ENGINE = MergeTree() ORDER BY id`,
    `CREATE TABLE IF NOT EXISTS van_checks (id String, data String, created_at DateTime DEFAULT now()) ENGINE = MergeTree() ORDER BY id`,
    `CREATE TABLE IF NOT EXISTS schedule_trips (id String, data String, created_at DateTime DEFAULT now()) ENGINE = MergeTree() ORDER BY id`,
    `CREATE TABLE IF NOT EXISTS csv_trips (id Int64, data String, created_at DateTime DEFAULT now()) ENGINE = MergeTree() ORDER BY id`,
    `CREATE TABLE IF NOT EXISTS notifications (id Int64, type String, message String, created_at DateTime DEFAULT now()) ENGINE = MergeTree() ORDER BY id`,
    `CREATE TABLE IF NOT EXISTS users (id Int64, username String, password String, photo String, header String, role String, status String, status_message String, last_seen DateTime, created_at DateTime DEFAULT now()) ENGINE = MergeTree() ORDER BY id`,
    `CREATE TABLE IF NOT EXISTS friends (user_id Int64, friend_id Int64, created_at DateTime DEFAULT now()) ENGINE = MergeTree() ORDER BY (user_id, friend_id)`,
    `CREATE TABLE IF NOT EXISTS tasks (id Int64, creator String, assignee String, text String, due_at String, completed UInt8 DEFAULT 0, created_at DateTime DEFAULT now()) ENGINE = MergeTree() ORDER BY id`,
    `CREATE TABLE IF NOT EXISTS chats (id Int64, name String, photo String, pinned UInt8 DEFAULT 0, created_at DateTime DEFAULT now()) ENGINE = MergeTree() ORDER BY id`,
    `CREATE TABLE IF NOT EXISTS chat_members (chat_id Int64, username String, created_at DateTime DEFAULT now()) ENGINE = MergeTree() ORDER BY (chat_id, username)`,
    `CREATE TABLE IF NOT EXISTS messages (id Int64, chat_id Int64, sender String, receiver String, text String, reply_to Int64, pinned UInt8 DEFAULT 0, image String, edited_at String, deleted UInt8 DEFAULT 0, created_at DateTime DEFAULT now()) ENGINE = MergeTree() ORDER BY id`,
    `CREATE TABLE IF NOT EXISTS posts (id Int64, username String, content String, image String, created_at DateTime DEFAULT now(), updated_at String, type String DEFAULT 'user') ENGINE = MergeTree() ORDER BY id`,
    `CREATE TABLE IF NOT EXISTS post_likes (id Int64, post_id Int64, username String, created_at DateTime DEFAULT now()) ENGINE = MergeTree() ORDER BY id`,
    `CREATE TABLE IF NOT EXISTS post_comments (id Int64, post_id Int64, username String, text String, created_at DateTime DEFAULT now()) ENGINE = MergeTree() ORDER BY id`,
    `CREATE TABLE IF NOT EXISTS backgrounds (id Int64, url String) ENGINE = MergeTree() ORDER BY id`,
    `CREATE TABLE IF NOT EXISTS legacy_totals (id Int64, total_orders Int64, collection_total Int64, collection_complete Int64, collection_failed Int64, delivery_total Int64, delivery_complete Int64, delivery_failed Int64) ENGINE = MergeTree() ORDER BY id`,
  ];
  for (const q of statements) {
    await exec(q);
  }
}

init().catch((err) => console.error('Init failed', err));

export async function addNotification(type: string, message: string) {
  await prepare('INSERT INTO notifications (type, message, created_at) VALUES (?, ?, now())').run(
    type,
    message,
  );
}

const db = { prepare };
export default db;
