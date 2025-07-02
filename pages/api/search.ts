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

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (!q) return res.status(200).json({ items: [] });

  const results = db
    .prepare(
      `SELECT id,
              json_extract(data,'$.Order.OrderNumber') AS orderNumber,
              json_extract(data,'$.Address.Postcode') AS postcode,
              json_extract(data,'$.Order.Account_Name') AS accountName
         FROM copy_of_tomorrow_trips
        WHERE CAST(json_extract(data,'$.Order.OrderNumber') AS TEXT) LIKE '%' || ? || '%'
           OR LOWER(CAST(json_extract(data,'$.Address.Postcode') AS TEXT)) LIKE '%' || LOWER(?) || '%'
           OR LOWER(CAST(json_extract(data,'$.Order.Account_Name') AS TEXT)) LIKE '%' || LOWER(?) || '%'
        LIMIT 20`
    )
    .all(q, q, q) as Array<{ id: string; orderNumber: string; postcode: string; accountName: string }>;

  let suggest: string[] = [];
  if (results.length === 0) {
    const fieldValues = db
      .prepare("SELECT json_extract(data,'$.Order.OrderNumber') AS num FROM copy_of_tomorrow_trips")
      .all()
      .map((r: any) => String(r.num));
    const distances = fieldValues.map((v) => ({ v, d: levenshtein(v.toLowerCase(), q.toLowerCase()) }));
    distances.sort((a, b) => a.d - b.d);
    suggest = distances.slice(0, 5).map((d) => d.v);
  }

  res.status(200).json({
    items: results.map((r) => ({
      id: r.id,
      order: r.orderNumber,
      postcode: r.postcode,
    })),
    suggest,
  });
}
