import fs from 'fs';
import path from 'path';

export function saveImage(data: string, folder: string): string {
  if (!data) return '';
  const match = data.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!match) return data;
  const ext = match[1];
  const buf = Buffer.from(match[2], 'base64');
  const dir = path.join(process.cwd(), 'public', folder);
  fs.mkdirSync(dir, { recursive: true });
  const name = `${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;
  fs.writeFileSync(path.join(dir, name), buf);
  return `/${folder}/${name}`;
}
