import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';
import { createHash } from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const current = req.cookies.user;
  if (!current) return res.status(401).end();
  const currentInfo = await db.prepare('SELECT role FROM users WHERE username = ?').get(current);
  if (!currentInfo) return res.status(401).end();
  const target = (req.query.username as string) || current;

  if (req.method === 'GET') {
    const user = await db
      .prepare('SELECT id, username, photo, header, role, status, status_message, last_seen FROM users WHERE username = ?')
      .get(target);
    if (!user) return res.status(404).end();
    return res.status(200).json({ user });
  }

  if (req.method === 'PUT') {
    if (target !== current && currentInfo.role !== 'admin') return res.status(403).end();
    const { password, role } = req.body || {};
    const updates: string[] = [];
    const params: any[] = [];
    if (password) {
      updates.push('password = ?');
      params.push(createHash('sha256').update(password).digest('hex'));
    }
    if (role && currentInfo.role === 'admin') {
      updates.push('role = ?');
      params.push(role);
    }
    if (!updates.length) return res.status(400).json({ message: 'No data' });
    params.push(target);
    await db
      .prepare(`UPDATE users SET ${updates.join(', ')} WHERE username = ?`)
      .run(...params);
    return res.status(200).json({ message: 'Updated' });
  }

  if (req.method === 'DELETE') {
    if (currentInfo.role !== 'admin' && target !== current) return res.status(403).end();
    await db.prepare('DELETE FROM users WHERE username = ?').run(target);
    if (target === current) res.setHeader('Set-Cookie', 'user=; Path=/; Max-Age=0');
    return res.status(200).json({ message: 'Deleted' });
  }

  res.status(405).end();
}
