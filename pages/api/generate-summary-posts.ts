import type { NextApiRequest, NextApiResponse } from 'next';
import { generateSummaryPosts } from '../../lib/summaryPosts';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }
  const created = await generateSummaryPosts();
  res.status(200).json({ created });
}
