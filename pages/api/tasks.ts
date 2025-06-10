import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const username = req.cookies.user;
  if (!username) return res.status(401).end();

  if (req.method === 'GET') {
    const rows = db.prepare('SELECT * FROM tasks WHERE assignee = ? OR creator = ? ORDER BY created_at DESC').all(username, username);
    return res.status(200).json({ tasks: rows });
  }

  if (req.method === 'POST') {
    const { assignee, text } = req.body || {};
    if (!assignee || !text) return res.status(400).json({ message: 'Missing fields' });
    db.prepare('INSERT INTO tasks (creator, assignee, text) VALUES (?, ?, ?)').run(username, assignee, text);
    return res.status(200).json({ message: 'Created' });
  }

  if (req.method === 'PUT') {
    const { id, completed } = req.body || {};
    if (!id) return res.status(400).end();
    db.prepare('UPDATE tasks SET completed = ? WHERE id = ?').run(completed ? 1 : 0, id);
    return res.status(200).json({ message: 'Updated' });
  }

  res.status(405).end();
}
