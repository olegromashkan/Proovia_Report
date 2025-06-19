import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';
import { generateSummaryForDate } from '../../lib/summaryPosts';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { date } = req.query as { date?: string };
  if (!date) return res.status(400).json({ message: 'Missing date' });
  if (req.method === 'POST') {
    const created = generateSummaryForDate(date);
    return res.status(200).json({ created });
  }
  if (req.method === 'DELETE') {
    db.prepare("DELETE FROM posts WHERE type = 'summary' AND date(created_at) = date(?)").run(date);
    return res.status(200).json({ message: 'Deleted' });
  }
  res.status(405).end();
}
