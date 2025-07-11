import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../lib/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const rows = db.prepare('SELECT id, name, email, created_at FROM training_tests ORDER BY created_at DESC').all();
    return res.status(200).json({ tests: rows });
  }

  if (req.method === 'POST') {
    const { name, email, answers } = req.body || {};
    if (!name || !email || !Array.isArray(answers)) {
      return res.status(400).json({ message: 'Missing fields' });
    }
    db.prepare('INSERT INTO training_tests (name, email, answers, scores) VALUES (?, ?, ?, ?)').run(
      name,
      email,
      JSON.stringify(answers),
      JSON.stringify([])
    );
    return res.status(200).json({ message: 'Saved' });
  }

  res.status(405).end();
}
