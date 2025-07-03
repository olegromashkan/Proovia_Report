import type { NextApiRequest, NextApiResponse } from 'next';
import { generateFullReportStats } from '../../lib/fullReportStats';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }
  const created = generateFullReportStats();
  res.status(200).json({ created });
}
