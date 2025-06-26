import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';

export const config = {
  api: { bodyParser: { sizeLimit: '5mb' } }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const backgrounds = await db
      .prepare('SELECT id, url FROM backgrounds ORDER BY id DESC')
      .all();
    return res.status(200).json({ backgrounds });
  }

  const user = req.cookies.user;
  if (!user) return res.status(401).end();
  const info = (await db
    .prepare('SELECT role FROM users WHERE username = ?')
    .get(user)) as any;
  if (!info || info.role !== 'admin') return res.status(403).end();

  if (req.method === 'POST') {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ message: 'No url' });
    await db.prepare('INSERT INTO backgrounds (url) VALUES (?)').run(url);
    return res.status(200).json({ message: 'Added' });
  }

  if (req.method === 'DELETE') {
    const { id } = req.query as { id?: string };
    if (!id) return res.status(400).end();
    await db.prepare('DELETE FROM backgrounds WHERE id = ?').run(id);
    return res.status(200).json({ message: 'Deleted' });
  }

  res.status(405).end();
}
