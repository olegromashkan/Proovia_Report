import { access, mkdir, writeFile } from 'fs/promises';
import { constants } from 'fs';
import { dirname } from 'path';

export async function ensureFile(path: string) {
  try {
    await access(path, constants.F_OK);
  } catch {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, '');
  }
}
