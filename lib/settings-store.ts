import { readFile, writeFile } from 'fs/promises';
import { DbSettings } from './db/types';
import { ensureFile } from './fs';

const SETTINGS_PATH = './data/settings.json';
const defaultSettings: DbSettings = {
  engine: 'mock',
  duckdbPath: './data/analytics.duckdb',
};

let memory: DbSettings | null = null;

async function loadFromFile(): Promise<DbSettings> {
  try {
    await ensureFile(SETTINGS_PATH);
    const raw = await readFile(SETTINGS_PATH, 'utf-8');
    return raw ? (JSON.parse(raw) as DbSettings) : defaultSettings;
  } catch {
    return defaultSettings;
  }
}

export async function getSettings(): Promise<DbSettings> {
  if (memory) return memory;
  memory = await loadFromFile();
  return memory;
}

export async function saveSettings(settings: DbSettings): Promise<void> {
  memory = settings;
  try {
    await ensureFile(SETTINGS_PATH);
    await writeFile(SETTINGS_PATH, JSON.stringify(settings, null, 2));
  } catch {
    // ignore file write errors
  }
}
