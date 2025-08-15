export type DbEngine = 'mock' | 'duckdb';

export interface DbSettings {
  engine: DbEngine;
  duckdbPath?: string;
}

export interface DbPingResult {
  connected: boolean;
  version?: string;
  error?: string;
}

export interface DbAdapter {
  ping(): Promise<DbPingResult>;
}
