import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '50mb',
        },
    },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        if (req.method === 'GET') {
            const rows = db.prepare('SELECT data FROM schedule_trips_tool').all();
            const items = rows.map((r: any) => JSON.parse(r.data));
            return res.status(200).json(items);
        }

        if (req.method === 'DELETE') {
            db.exec('DELETE FROM schedule_trips_tool');
            return res.status(200).json({ message: 'Cleared' });
        }

        if (req.method === 'POST') {
            const payload = req.body;
            let trips: any[] = [];
            if (Array.isArray(payload)) trips = payload;
            else if (Array.isArray(payload.trips)) trips = payload.trips;
            else if (Array.isArray(payload.Schedule_Trips)) trips = payload.Schedule_Trips;
            else if (Array.isArray(payload.schedule_trips)) trips = payload.schedule_trips;
            else if (Array.isArray(payload.scheduleTrips)) trips = payload.scheduleTrips;
            if (!Array.isArray(trips)) {
                return res.status(400).json({ message: 'No schedule trips found' });
            }

            const del = db.prepare('DELETE FROM schedule_trips_tool');
            del.run();
            const stmt = db.prepare(
                "INSERT INTO schedule_trips_tool (id, data, created_at) VALUES (?, ?, datetime('now'))",
            );
            for (const item of trips) {
                const id = item.ID || item.id;
                if (!id) continue;
                stmt.run(id, JSON.stringify(item));
            }
            return res.status(200).json({ message: 'Saved' });
        }

        return res.status(405).json({ message: 'Method not allowed' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
}