import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../lib/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const rows = db.prepare('SELECT id, name, created_at FROM test_templates ORDER BY created_at DESC').all();
    return res.status(200).json({ templates: rows });
  }

  if (req.method === 'POST') {
    const { name, questions } = req.body || {};
    if (!name || !Array.isArray(questions)) {
      return res.status(400).json({ message: 'Missing fields' });
    }
    const result = db.prepare('INSERT INTO test_templates (name, questions) VALUES (?, ?)').run(
      name,
      JSON.stringify(questions)
    );
    return res.status(200).json({ id: result.lastInsertRowid });
  }

  res.status(405).end();
}
