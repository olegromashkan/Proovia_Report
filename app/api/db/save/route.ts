import { NextResponse } from 'next/server';
import { dbSettingsSchema } from '@/lib/schemas';
import { saveSettings } from '@/lib/settings-store';
import { ensureFile } from '@/lib/fs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const settings = dbSettingsSchema.parse(body);
    if (settings.engine === 'duckdb' && settings.duckdbPath) {
      await ensureFile(settings.duckdbPath);
    }
    await saveSettings(settings);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
  }
}
