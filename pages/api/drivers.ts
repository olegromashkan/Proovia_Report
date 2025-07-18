import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const rows = db.prepare('SELECT id, data FROM drivers_report').all();
      const scheduleRows = db.prepare('SELECT data FROM schedule_trips').all();

      const routeCounts: Record<string, number> = {};
      scheduleRows.forEach((r: any) => {
        const d = JSON.parse(r.data);
        const name =
          d.Driver1 || d.Driver || d['Trip.Driver1'] || '';
        if (name) {
          const key = String(name).trim();
          routeCounts[key] = (routeCounts[key] || 0) + 1;
        }
      });

      const contractorSet = new Set<string>();

      const drivers = rows
        .map((r: any) => {
          const d = JSON.parse(r.data);
          const name = d.Full_Name || 'Unknown';
          const contractor = d.Contractor_Name || 'Unknown';
          contractorSet.add(contractor);
          return {
            id: r.id,
            name,
            contractor,
            routes: routeCounts[name] || 0,
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name));

      const contractors = Array.from(contractorSet).sort();

      return res.status(200).json({ drivers, contractors });
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

  if (req.method === 'DELETE') {
    try {
      const { ids } = (req.body || {}) as { ids?: string[] };
      if (Array.isArray(ids)) {
        const stmt = db.prepare('DELETE FROM drivers_report WHERE id = ?');
        const tr = db.transaction((arr: string[]) => {
          arr.forEach(id => stmt.run(id));
        });
        tr(ids);
        return res.status(200).json({ message: 'Deleted' });
      }

      const id = typeof req.query.id === 'string' ? req.query.id : null;
      if (id) {
        db.prepare('DELETE FROM drivers_report WHERE id = ?').run(id);
        return res.status(200).json({ message: 'Deleted' });
      }
      return res.status(400).json({ message: 'Missing id(s)' });
    } catch (err) {
      console.error('drivers DELETE error', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  res.status(405).end();
}
