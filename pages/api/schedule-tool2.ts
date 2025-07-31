import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';

const IGNORED_CALENDAR_PATTERNS = [
    'every 2nd day north',
    'everyday',
    'every 2nd south-west',
    'every 2nd day south',
    'South Wales 2nd',
];

const filterIgnored = (items: any[]) =>
    items.filter(
        (it) =>
            !IGNORED_CALENDAR_PATTERNS.some((pat) =>
                String(it.Calendar_Name || '').toLowerCase().includes(pat)
            )
    );

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
            const rows = db.prepare('SELECT data FROM schedule_trips_tool2').all();
            const items = rows.map((r: any) => JSON.parse(r.data));
            return res.status(200).json(filterIgnored(items));
        }

        if (req.method === 'DELETE') {
            db.exec('DELETE FROM schedule_trips_tool2');
            return res.status(200).json({ message: 'Cleared' });
        }

        if (req.method === 'POST') {
            const payload = req.body;
            const preserve = !!payload.preserveDrivers;
            let trips: any[] = [];
            if (Array.isArray(payload)) trips = payload;
            else if (Array.isArray(payload.trips)) trips = payload.trips;
            else if (Array.isArray(payload.Schedule_Trips)) trips = payload.Schedule_Trips;
            else if (Array.isArray(payload.schedule_trips)) trips = payload.schedule_trips;
            else if (Array.isArray(payload.scheduleTrips)) trips = payload.scheduleTrips;
            if (!Array.isArray(trips)) {
                return res.status(400).json({ message: 'No schedule trips found' });
            }

            if (preserve) {
                const rows = db.prepare('SELECT id, data FROM schedule_trips_tool2').all();
                const existing: Record<string, any> = {};
                rows.forEach((r: any) => {
                    const obj = JSON.parse(r.data);
                    existing[r.id] = {
                        Driver1: obj.Driver1,
                        fromLeftIndex: obj.fromLeftIndex,
                    };
                });
                trips = trips.map((it: any) => {
                    const id = it.ID || it.id;
                    if (!id) return it;
                    if (existing[id] !== undefined) {
                        return { ...it, ...existing[id] };
                    }
                    return it;
                });
            }

            trips = filterIgnored(trips);

            const del = db.prepare('DELETE FROM schedule_trips_tool2');
            del.run();
            const stmt = db.prepare(
                "INSERT INTO schedule_trips_tool2 (id, data, created_at) VALUES (?, ?, datetime('now'))",
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
