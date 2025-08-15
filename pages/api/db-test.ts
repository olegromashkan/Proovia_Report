import type { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';
import { pool as defaultPool } from '../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'POST') {
      const { host, port, user, password, database } = req.body || {};
      const testPool = new Pool({ host, port: Number(port), user, password, database });
      await testPool.query('SELECT 1');
      await testPool.end();
      return res.status(200).json({ ok: true });
    }
    await defaultPool.query('SELECT 1');
    return res.status(200).json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
