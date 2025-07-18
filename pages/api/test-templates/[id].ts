import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../lib/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query as { id?: string };
  if (!id) return res.status(400).end();

  if (req.method === 'GET') {
    const row = db.prepare('SELECT * FROM test_templates WHERE id = ?').get(id);
    if (!row) return res.status(404).end();
    return res.status(200).json({
      template: {
        id: row.id,
        name: row.name,
        created_at: row.created_at,
        questions: row.questions ? JSON.parse(row.questions) : []
      }
    });
  }

  if (req.method === 'PUT') {
    const { name, questions } = req.body || {};
    db.prepare('UPDATE test_templates SET name = ?, questions = ? WHERE id = ?').run(
      name,
      JSON.stringify(questions || []),
      id
    );
    return res.status(200).json({ message: 'Updated' });
  }

  res.status(405).end();
}
