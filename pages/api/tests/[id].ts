import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../lib/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query as { id?: string };
  if (!id) return res.status(400).end();

  if (req.method === 'GET') {
    const row = db.prepare('SELECT * FROM training_tests WHERE id = ?').get(id);
    if (!row) return res.status(404).end();
    return res.status(200).json({
      test: {
        id: row.id,
        name: row.name,
        email: row.email,
        test_id: row.test_id,
        created_at: row.created_at,
        answers: row.answers ? JSON.parse(row.answers) : [],
        scores: row.scores ? JSON.parse(row.scores) : []
      }
    });
  }

  if (req.method === 'PUT') {
    const { scores } = req.body || {};
    db.prepare('UPDATE training_tests SET scores = ? WHERE id = ?').run(
      JSON.stringify(scores || []),
      id
    );
    return res.status(200).json({ message: 'Updated' });
  }

  res.status(405).end();
}
