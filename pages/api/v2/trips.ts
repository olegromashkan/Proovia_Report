import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../lib/db';
import { parseDate } from '../../../lib/dateUtils';

function getValue(obj: any, path: string) {
  return path.split('.').reduce((o, p) => (o ? o[p] : undefined), obj);
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const {
    start = '',
    end = '',
    status = '',
    contractor = '',
    auction = '',
    search = '',
    sortField = 'Order.OrderNumber',
    sortDir = 'asc',
    limit = '50',
    offset = '0'
  } = req.query as Record<string, string>;

  const driverRows = db.prepare('SELECT data FROM drivers_report').all();
  const driverToContractor: Record<string, string> = {};
  driverRows.forEach((r: any) => {
    const d = JSON.parse(r.data);
    if (d.Full_Name) {
      driverToContractor[d.Full_Name.trim()] = d.Contractor_Name || 'Unknown';
    }
  });

  const tripRows = db.prepare('SELECT data FROM copy_of_tomorrow_trips').all();
  let trips = tripRows.map((r: any) => JSON.parse(r.data));

  if (start || end) {
    trips = trips.filter((item: any) => {
      const raw =
        item['Trip.Start_Time'] ||
        item['Start_Time'] ||
        item.Start_Time ||
        '';
      if (!raw) return false;
      const iso = parseDate(String(raw).split(' ')[0]);
      if (!iso) return false;
      if (start && iso < start) return false;
      if (end && iso > end) return false;
      return true;
    });
  }

  if (status) {
    const s = status.toLowerCase();
    trips = trips.filter(
      (t) => String(t.Status || '').toLowerCase() === s,
    );
  }

  if (contractor) {
    trips = trips.filter((t) => {
      const driver = t['Trip.Driver1'] || t.Driver1 || '';
      return driverToContractor[driver] === contractor;
    });
  }

  if (auction) {
    const a = auction.toLowerCase();
    trips = trips.filter(
      (t) => String(t['Order.Auction'] || '').toLowerCase() === a,
    );
  }

  if (search) {
    const q = search.toLowerCase();
    trips = trips.filter((t) => {
      const order = String(t['Order.OrderNumber'] || '').toLowerCase();
      const postcode = String(t['Address.Postcode'] || '').toLowerCase();
      const driver = String(t['Trip.Driver1'] || '').toLowerCase();
      return order.includes(q) || postcode.includes(q) || driver.includes(q);
    });
  }

  trips.sort((a, b) => {
    const av = getValue(a, sortField);
    const bv = getValue(b, sortField);
    if (av === bv) return 0;
    if (av === undefined) return 1;
    if (bv === undefined) return -1;
    return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
  });

  const o = parseInt(offset, 10) || 0;
  const l = parseInt(limit, 10) || 50;
  const paged = trips.slice(o, o + l);

  res.status(200).json({ trips: paged, total: trips.length });
}
