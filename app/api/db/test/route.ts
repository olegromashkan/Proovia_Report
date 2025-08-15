import { NextResponse } from 'next/server';
import { dbSettingsSchema } from '@/lib/schemas';
import { getDbAdapter } from '@/lib/db/factory';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const settings = dbSettingsSchema.parse(body);
    const adapter = getDbAdapter(settings);
    const res = await adapter.ping();
    return NextResponse.json({ ok: res.connected, version: res.version, error: res.error });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
  }
}
