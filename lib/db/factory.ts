import { DbAdapter, DbSettings } from './types';
import { createMockAdapter } from './adapters/mock';
import { createDuckDbAdapter } from './adapters/duckdb';

export function getDbAdapter(settings: DbSettings): DbAdapter {
  if (settings.engine === 'mock') return createMockAdapter();
  return createDuckDbAdapter(settings.duckdbPath ?? './data/analytics.duckdb');
}
