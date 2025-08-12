import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT) || 5432,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
});

function mapParams(sql: string, params: any[]) {
  let index = 1;
  const text = sql.replace(/\?/g, () => `$${index++}`);
  return { text, values: params };
}

function prepare(sql: string) {
  const stmt: any = {
    all: (...params: any[]) => {
      const { text, values } = mapParams(sql, params);
      return pool.query(text, values).then((res) => res.rows);
    },
    get: (...params: any[]) => {
      const { text, values } = mapParams(sql, params);
      return pool.query(text, values).then((res) => res.rows[0]);
    },
    run: (...params: any[]) => {
      const { text, values } = mapParams(sql, params);
      return pool.query(text, values);
    },
  };
  return stmt;
}

function exec(sql: string) {
  return pool.query(sql);
}

export function safeAll<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const stmt = prepare(sql);
  if (Array.isArray(params)) return stmt.all(...params);
  return stmt.all();
}

export function safeGet<T = any>(sql: string, params?: any[]): Promise<T | undefined> {
  const stmt = prepare(sql);
  if (Array.isArray(params)) return stmt.get(...params);
  return stmt.get();
}

export function safeRun(sql: string, params?: any[]): Promise<any> {
  const stmt = prepare(sql);
  if (Array.isArray(params)) return stmt.run(...params);
  return stmt.run();
}

export function addNotification(type: string, message: string) {
  return safeRun('INSERT INTO notifications (type, message) VALUES (?, ?)', [type, message]);
}

export { pool };

export default { prepare, exec };
