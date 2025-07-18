import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';
import { parseDate } from '../../lib/dateUtils';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { date, trips } = req.body as { date?: string; trips?: any[] };
    if (typeof date !== 'string' || !Array.isArray(trips)) {
      return res.status(400).json({ message: 'Invalid body' });
    }

    const rows = db.prepare('SELECT id, data FROM schedule_trips').all();
    const delStmt = db.prepare('DELETE FROM schedule_trips WHERE id = ?');
    rows.forEach((r: any) => {
      const obj = JSON.parse(r.data);
      const raw = obj.Start_Time || obj['Start_Time'] || obj['Trip.Start_Time'];
      const iso = parseDate(String(raw).split(' ')[0]);
      if (iso === date) {
        delStmt.run(r.id);
      }
    });

    const insStmt = db.prepare(
      "INSERT OR REPLACE INTO schedule_trips (id, data, created_at) VALUES (?, ?, datetime('now'))"
    );
    for (const item of trips) {
      if (!item) continue;
      const id = item.ID || item.id;
      if (!id) continue;
      insStmt.run(id, JSON.stringify(item));
    }

    res.status(200).json({ message: 'Updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}
