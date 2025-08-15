import Database from 'duckdb';
import { DbAdapter, DbPingResult } from '../types';

export function createDuckDbAdapter(path: string): DbAdapter {
  const db = new Database(path);
  return {
    async ping(): Promise<DbPingResult> {
      try {
        const conn = db.connect();
        const version: string = await new Promise((resolve, reject) => {
          conn.all("SELECT version() AS version", (err, rows) => {
            if (err) reject(err);
            else resolve(rows[0].version as string);
          });
        });
        conn.close();
        return { connected: true, version };
      } catch (e: any) {
        return { connected: false, error: e.message };
      }
    },
  };
}
