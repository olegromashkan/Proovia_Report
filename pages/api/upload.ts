import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const payload = req.body;
    if (typeof payload !== 'object') {
      return res.status(400).json({ message: 'Invalid JSON' });
    }

    if (Array.isArray(payload.Copy_of_Tomorrow_trips)) {
      const stmt = db.prepare(
        'INSERT OR REPLACE INTO copy_of_tomorrow_trips (id, data, created_at) VALUES (?, ?, datetime(\'now\'))'
      );
      for (const item of payload.Copy_of_Tomorrow_trips) {
        stmt.run(item.ID, JSON.stringify(item));
      }
    }

    if (Array.isArray(payload.Event_Stream)) {
      const stmt = db.prepare(
        'INSERT OR REPLACE INTO event_stream (id, data, created_at) VALUES (?, ?, datetime(\'now\'))'
      );
      for (const item of payload.Event_Stream) {
        stmt.run(item.ID, JSON.stringify(item));
      }
    }

    if (Array.isArray(payload.Drivers_Report)) {
      const stmt = db.prepare(
        'INSERT OR REPLACE INTO drivers_report (id, data, created_at) VALUES (?, ?, datetime(\'now\'))'
      );
      for (const item of payload.Drivers_Report) {
        stmt.run(item.ID, JSON.stringify(item));
      }
    }

    if (Array.isArray(payload.Schedule_Trips)) {
      const stmt = db.prepare(
        'INSERT OR REPLACE INTO schedule_trips (id, data, created_at) VALUES (?, ?, datetime(\'now\'))'
      );
      for (const item of payload.Schedule_Trips) {
        stmt.run(item.ID, JSON.stringify(item));
      }
    }

    res.status(200).json({ message: 'Uploaded' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}
