import { NextResponse } from 'next/server';
import { getSettings } from '@/lib/settings-store';
import { getDbAdapter } from '@/lib/db/factory';

export async function GET() {
  const settings = await getSettings();
  const adapter = getDbAdapter(settings);
  const res = await adapter.ping();
  return NextResponse.json({
    engine: settings.engine,
    connected: res.connected,
    version: res.version,
  });
}
