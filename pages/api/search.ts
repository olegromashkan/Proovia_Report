import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';

function levenshtein(a: string, b: string) {
  const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return dp[a.length][b.length];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (!q) return res.status(200).json({ items: [] });

  const rows = await db.prepare('SELECT id, data FROM copy_of_tomorrow_trips').all();
  const items = rows.map((r: any) => ({ id: r.id, ...JSON.parse(r.data) }));

  const results = items
    .filter((it) =>
      String(it['Order.OrderNumber']).includes(q) ||
      String(it['Address.Postcode'] || '').toLowerCase().includes(q.toLowerCase()) ||
      String(it['Order.Account_Name'] || '').toLowerCase().includes(q.toLowerCase())
    )
    .slice(0, 20);

  let suggest: string[] = [];
  if (results.length === 0) {
    const fieldValues = items.map((it) => String(it['Order.OrderNumber']));
    const distances = fieldValues.map((v) => ({ v, d: levenshtein(v.toLowerCase(), q.toLowerCase()) }));
    distances.sort((a, b) => a.d - b.d);
    suggest = distances.slice(0, 5).map((d) => d.v);
  }

  res.status(200).json({
    items: results.map((r) => ({
      id: r.id,
      order: r['Order.OrderNumber'],
      postcode: r['Address.Postcode'],
    })),
    suggest,
  });
}
