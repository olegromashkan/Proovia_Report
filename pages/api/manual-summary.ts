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
    const tsDate = new Date(date);
    tsDate.setDate(tsDate.getDate() + 1);
    const ts = tsDate.toISOString().slice(0, 10) + ' 00:00:00';
    db.prepare("DELETE FROM posts WHERE type = 'summary' AND date(created_at) = date(?)").run(ts);
    return res.status(200).json({ message: 'Deleted' });
  }
  res.status(405).end();
}
