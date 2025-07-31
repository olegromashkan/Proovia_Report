import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const panelParam = Array.isArray(req.query.panel)
      ? req.query.panel[0]
      : req.query.panel;
    if (req.method === 'GET') {
      if (panelParam) {
        const row = db
          .prepare('SELECT content FROM schedule_notes WHERE panel = ?')
          .get(panelParam);
        return res.status(200).json({ panel: panelParam, content: row?.content || '' });
      }
      const rows = db.prepare('SELECT panel, content FROM schedule_notes').all();
      const obj: Record<string, string> = {};
      rows.forEach((r: any) => {
        obj[r.panel] = r.content;
      });
      return res.status(200).json(obj);
    }

    if (req.method === 'POST') {
      const { panel, content } = req.body || {};
      const p = panel || panelParam;
      if (!p) return res.status(400).json({ message: 'panel required' });
      db.prepare(
        'INSERT INTO schedule_notes (panel, content) VALUES (?, ?) ON CONFLICT(panel) DO UPDATE SET content=excluded.content'
      ).run(p, content || '');
      return res.status(200).json({ message: 'Saved' });
    }

    if (req.method === 'DELETE') {
      if (!panelParam) return res.status(400).json({ message: 'panel required' });
      db.prepare('DELETE FROM schedule_notes WHERE panel = ?').run(panelParam);
      return res.status(200).json({ message: 'Cleared' });
    }

    return res.status(405).end();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}
