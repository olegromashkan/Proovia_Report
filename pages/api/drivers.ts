import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const rows = db.prepare('SELECT id, data FROM drivers_report').all();
      const drivers = rows
        .map((r: any) => {
          const d = JSON.parse(r.data);
          return {
            id: r.id,
            name: d.Full_Name || 'Unknown',
            contractor: d.Contractor_Name || 'Unknown',
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name));
      return res.status(200).json({ drivers });
    } catch (err) {
      console.error('drivers GET error', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  if (req.method === 'PUT') {
    const { id, contractor } = req.body || {};
    if (!id || typeof contractor !== 'string') {
      return res.status(400).json({ message: 'Invalid data' });
    }
    try {
      const row = db
        .prepare('SELECT data FROM drivers_report WHERE id = ?')
        .get(id);
      if (!row) return res.status(404).json({ message: 'Not found' });
      const data = JSON.parse(row.data);
      data.Contractor_Name = contractor;
      db.prepare('UPDATE drivers_report SET data = ? WHERE id = ?').run(
        JSON.stringify(data),
        id,
      );
      return res.status(200).json({ message: 'Updated' });
    } catch (err) {
      console.error('drivers PUT error', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  res.status(405).end();
}
