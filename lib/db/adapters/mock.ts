import { DbAdapter, DbPingResult } from '../types';

export function createMockAdapter(): DbAdapter {
  return {
    async ping(): Promise<DbPingResult> {
      return { connected: true, version: 'mock-1.0' };
    },
  };
}
