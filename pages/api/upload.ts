import type { NextApiRequest, NextApiResponse } from 'next';
import db, { addNotification } from '../../lib/db';
import { generateSummaryPosts } from '../../lib/summaryPosts';
import { generateFullReportStats } from '../../lib/fullReportStats';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '500mb',
    },
  },
};

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
        "INSERT OR REPLACE INTO copy_of_tomorrow_trips (id, data, created_at) VALUES (?, ?, datetime('now'))",
      );
      const tr = db.transaction((items: any[]) => {
        for (const item of items) {
          stmt.run(item.ID, JSON.stringify(item));
        }
      });
      tr(payload.Copy_of_Tomorrow_trips);
      addNotification('upload', `Uploaded ${payload.Copy_of_Tomorrow_trips.length} tomorrow trips`);
    }

    if (Array.isArray(payload.Event_Stream)) {
      const stmt = db.prepare(
        "INSERT OR REPLACE INTO event_stream (id, data, created_at) VALUES (?, ?, datetime('now'))",
      );
      const tr = db.transaction((items: any[]) => {
        for (const item of items) {
          stmt.run(item.ID, JSON.stringify(item));
        }
      });
      tr(payload.Event_Stream);
      addNotification('upload', `Uploaded ${payload.Event_Stream.length} event stream items`);
    }

    if (Array.isArray(payload.Drivers_Report)) {
      const stmt = db.prepare(
        "INSERT OR REPLACE INTO drivers_report (id, data, created_at) VALUES (?, ?, datetime('now'))",
      );
      const tr = db.transaction((items: any[]) => {
        for (const item of items) {
          stmt.run(item.ID, JSON.stringify(item));
        }
      });
      tr(payload.Drivers_Report);
      addNotification('upload', `Uploaded ${payload.Drivers_Report.length} drivers report items`);
    }

    if (Array.isArray(payload.Van_Checks)) {
      const stmt = db.prepare(
        "INSERT OR REPLACE INTO van_checks (id, data, created_at) VALUES (?, ?, datetime('now'))",
      );
      const tr = db.transaction((items: any[]) => {
        for (const item of items) {
          const id = item.id || item.ID || `${item.van_id}-${item.date}`;
          stmt.run(id, JSON.stringify(item));
        }
      });
      tr(payload.Van_Checks);
      addNotification('upload', `Uploaded ${payload.Van_Checks.length} van checks`);
    }

    if (Array.isArray(payload.Schedule_Trips)) {
      const stmt = db.prepare(
        "INSERT OR REPLACE INTO schedule_trips (id, data, created_at) VALUES (?, ?, datetime('now'))",
      );
      const tr = db.transaction((items: any[]) => {
        for (const item of items) {
          stmt.run(item.ID, JSON.stringify(item));
        }
      });
      tr(payload.Schedule_Trips);
      addNotification('upload', `Uploaded ${payload.Schedule_Trips.length} schedule trips`);
    }

    if (Array.isArray(payload.csvTrips)) {
      const stmt = db.prepare(
        "INSERT INTO csv_trips (data, created_at) VALUES (?, datetime('now'))",
      );
      const tr = db.transaction((rows: any[]) => {
        for (const row of rows) {
          stmt.run(JSON.stringify(row));
        }
      });
      tr(payload.csvTrips);
      addNotification('upload', `Uploaded ${payload.csvTrips.length} csv trips`);
    }

    generateSummaryPosts();
    generateFullReportStats();
    res.status(200).json({ message: 'Uploaded' });
  } catch (err: any) {
    console.error(err);
    if (err && (err.statusCode === 413 || err.status === 413)) {
      addNotification('error', 'Upload failed: payload too large');
      return res.status(413).json({ message: 'Payload too large' });
    }
    addNotification('error', 'Upload failed');
    res.status(500).json({ message: 'Server error' });
  }
}
