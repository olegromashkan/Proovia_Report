import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';
import { createHash } from 'crypto';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ message: 'Missing username or password' });
  }
  const hashed = createHash('sha256').update(password).digest('hex');
  const user = db.prepare('SELECT id FROM users WHERE username = ? AND password = ?').get(username, hashed);
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  res.setHeader('Set-Cookie', `user=${username}; Path=/; HttpOnly`);
  return res.status(200).json({ message: 'Logged in' });
}
