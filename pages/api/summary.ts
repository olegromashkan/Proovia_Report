import type { NextApiRequest, NextApiResponse } from 'next';
import { createHash } from 'crypto';
import db from '../../lib/db';
import { getCache, setCache } from '../../lib/cache';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const cached = getCache<any>('summary');
  if (cached) {
    if (req.headers['if-none-match'] === cached.etag) {
      res.status(304).end();
      return;
    }
    res.setHeader('ETag', cached.etag);
    res.status(200).json(cached.value);
    return;
  }

  const row = db
    .prepare(
      `SELECT
        COUNT(*) AS total,
        COALESCE(SUM(CASE WHEN lower(status) = 'complete' THEN 1 ELSE 0 END), 0) AS complete,
        COALESCE(SUM(CASE WHEN lower(status) = 'failed' THEN 1 ELSE 0 END), 0) AS failed,
        COALESCE(SUM(CASE WHEN arrival IS NOT NULL AND done IS NOT NULL THEN minutes(done) - minutes(arrival) ELSE 0 END), 0) AS diff
       FROM (
         SELECT
           json_extract(data,'$.Status') AS status,
           COALESCE(json_extract(data,'$.Arrival_Time'), json_extract(data,'$."Arrival_Time"')) AS arrival,
           COALESCE(json_extract(data,'$.Time_Completed'), json_extract(data,'$."Time_Completed"')) AS done
         FROM copy_of_tomorrow_trips
       ) t`
    )
    .get() as { total: number; complete: number; failed: number; diff: number };

  const legacy = db
    .prepare('SELECT total_orders, collection_complete, collection_failed, delivery_complete, delivery_failed FROM legacy_totals WHERE id = 1')
    .get() || {
      total_orders: 0,
      collection_complete: 0,
      collection_failed: 0,
      delivery_complete: 0,
      delivery_failed: 0,
    };

  const total = row.total + (legacy.total_orders || 0);
  const complete =
    row.complete + legacy.collection_complete + legacy.delivery_complete;
  const failed = row.failed + legacy.collection_failed + legacy.delivery_failed;
  const avgPunctuality = row.total ? Math.round(row.diff / row.total) : 0;
  const payload = { total, complete, failed, avgPunctuality };
  const etag = createHash('sha1').update(JSON.stringify(payload)).digest('hex');
  setCache('summary', payload, 5 * 60 * 1000, etag);
  res.setHeader('ETag', etag);
  res.status(200).json(payload);
}
