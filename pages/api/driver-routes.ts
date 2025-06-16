import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function parseDate(value: string | undefined): string | null {
  if (!value) return null;
  const [d, mon, rest] = value.split('-');
  if (!d || !mon || !rest) return null;
  const [y] = rest.split(' ');
  const mIndex = MONTHS.indexOf(mon);
  if (mIndex === -1) return null;
  return `${y}-${String(mIndex + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { start, end } = req.query;
  const today = new Date();
  const defaultEnd = today.toISOString().slice(0,10);
  const defaultStartDate = new Date(today);
  defaultStartDate.setDate(defaultStartDate.getDate() - 29);
  const defaultStart = defaultStartDate.toISOString().slice(0,10);
  const startDate = typeof start === 'string' ? start : defaultStart;
  const endDate = typeof end === 'string' ? end : defaultEnd;

  const rows = db.prepare('SELECT data FROM schedule_trips').all();
  const driverRows = db.prepare('SELECT data FROM drivers_report').all();
  const driverMap: Record<string, string> = {};
  driverRows.forEach((r: any) => {
    const d = JSON.parse(r.data);
    if (d.Full_Name) {
      driverMap[d.Full_Name.trim()] = d.Contractor_Name || 'Unknown';
    }
  });
  const items = rows
    .map((r: any) => JSON.parse(r.data))
    .filter((item: any) => {
      const raw = item.Start_Time || item['Start_Time'] || item['Trip.Start_Time'];
      if (!raw) return false;
      const iso = parseDate(String(raw).split(' ')[0]);
      if (!iso) return false;
      return iso >= startDate && iso <= endDate;
    })
    .map((item: any) => {
      const driver = item.Driver1 || item.Driver || item['Trip.Driver1'] || 'Unknown';
      const route =
        item.Route_Name ||
        item.Route ||
        item.RouteName ||
        item['Trip.Name'] ||
        `${item.Start_Location || item['Trip.Start_Location'] || ''} - ${item.End_Location || item['Trip.End_Location'] || ''}`;
      const calendar =
        item.Calendar_Name ||
        item['Calendar_Name'] ||
        item.Calendar ||
        item['Calendar'] ||
        item.CalendarName ||
        item['CalendarName'] ||
        'Unknown';

      const rawStart =
        item.Start_Time ||
        item['Start_Time'] ||
        item['Trip.Start_Time'];
      const date = parseDate(String(rawStart).split(' ')[0]) || 'Unknown';
      const start_time = rawStart ? String(rawStart).split(' ')[1] || String(rawStart) : null;

      const rawEnd =
        item.Time_Completed ||
        item['Time_Completed'] ||
        item['Trip.Time_Completed'] ||
        item.Arrival_Time ||
        item['Arrival_Time'] ||
        item['Trip.Arrival_Time'];
      const end_time = rawEnd ? String(rawEnd).split(' ')[1] || String(rawEnd) : null;

      const arrival =
        item.Arrival_Time ||
        item['Arrival_Time'] ||
        item['Trip.Arrival_Time'];
      const done =
        item.Time_Completed ||
        item['Time_Completed'] ||
        item['Trip.Time_Completed'];
      let punctuality: number | null = null;

      const price =
        item.Order_Value ||
        item['Order_Value'] ||
        item.OrderValue ||
        item['OrderValue'];

      const rawPunc =
        item.Punctuality ||
        item['Punctuality'] ||
        item['Trip.Punctuality'];
      if (rawPunc !== undefined && rawPunc !== null && rawPunc !== '') {
        const n = Number(rawPunc);
        if (!isNaN(n)) punctuality = n;
      }

      if (punctuality === null && arrival && done) {
        const parseMinutes = (str: string) => {
          const time = str.split(' ')[1] || str;
          const [h = '0', m = '0', s = '0'] = time.split(':');
          const result = Number(h) * 60 + Number(m) + Number(s) / 60;
          return isFinite(result) ? result : 0;
        };
        punctuality = Math.round(parseMinutes(done) - parseMinutes(arrival));
      }

      const contractor = driverMap[driver] || 'Unknown';
      return { driver, contractor, route, calendar, date, start_time, end_time, punctuality, price };
    });

  res.status(200).json({ items });
}
