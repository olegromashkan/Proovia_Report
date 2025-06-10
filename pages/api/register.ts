import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';
import { createHash } from 'crypto';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '5mb',
    },
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { username, password, photo, header } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ message: 'Missing username or password' });
  }
  const hashed = createHash('sha256').update(password).digest('hex');
  try {
    db.prepare('INSERT INTO users (username, password, photo, header) VALUES (?, ?, ?, ?)').run(username, hashed, photo || '', header || '');
    return res.status(200).json({ message: 'Registered' });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
}
