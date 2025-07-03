import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs/promises';
import path from 'path';
import {
  processRoadCrew,
  processScheduledTrips,
  processTripHistory,
  processEventStream,
  processTodayLive,
} from '../../lib/etl';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const filename =
    (req.query.name as string) || (req.headers['x-file-name'] as string);
  if (!filename) {
    return res.status(400).json({ message: 'Missing filename' });
  }

  try {
    const buffer: Buffer = await new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      req.on('data', (c) => chunks.push(c));
      req.on('end', () => resolve(Buffer.concat(chunks)));
      req.on('error', reject);
    });

    const dir = path.join(process.cwd(), 'uploads');
    await fs.mkdir(dir, { recursive: true });
    const filePath = path.join(dir, filename);
    await fs.writeFile(filePath, buffer);

    const text = buffer.toString('utf8');
    setTimeout(() => {
      try {
        if (/road\s*crew/i.test(filename)) processRoadCrew(text);
        else if (/scheduled\s*trips/i.test(filename))
          processScheduledTrips(text);
        else if (/trip\s*history/i.test(filename)) processTripHistory(text);
        else if (/event\s*stream/i.test(filename)) processEventStream(text);
        else if (/today\s*live/i.test(filename)) processTodayLive(text);
      } catch (err) {
        console.error('ETL processing failed', err);
      }
    }, 0);

    res.status(202).json({ message: 'Processing started' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}
