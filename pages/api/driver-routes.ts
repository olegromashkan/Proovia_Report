import type { NextApiRequest, NextApiResponse } from 'next';
import { safeAll } from '../../lib/db';
import { parseDate } from '../../lib/dateUtils';
import { parseTimeToMinutes } from '../../lib/timeUtils';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { start, end, table } = req.query as {
    start?: string;
    end?: string;
    table?: string;
  };
  const today = new Date();
  const defaultEnd = today.toISOString().slice(0,10);
  const defaultStartDate = new Date(today);
  defaultStartDate.setDate(defaultStartDate.getDate() - 6);
  const defaultStart = defaultStartDate.toISOString().slice(0,10);
  const startDate = typeof start === 'string' ? start : defaultStart;
  const endDate = typeof end === 'string' ? end : defaultEnd;

  const tableName =
    table === 'copy_of_tomorrow_trips' ? 'copy_of_tomorrow_trips' : 'schedule_trips';
  const rows = safeAll(`SELECT data FROM ${tableName}`);
  const driverRows = safeAll('SELECT data FROM drivers_report');
  const driverMap: Record<string, string> = {};
  driverRows.forEach((r: any) => {
    const d = JSON.parse(r.data);
    if (d.Full_Name) {
      driverMap[d.Full_Name.trim().toLowerCase()] =
        d.Contractor_Name || 'Unknown';
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
      const rawDriver =
        item.Driver1 || item.Driver || item['Trip.Driver1'] || 'Unknown';
      const driver =
        typeof rawDriver === 'string' ? rawDriver.trim() : String(rawDriver);
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
        item.End_Time ||
        item['End_Time'] ||
        item['Trip.End_Time'] ||
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
        const convert = (str: string) => parseTimeToMinutes(str) ?? 0;
        punctuality = Math.round(convert(done) - convert(arrival));
      }

      const contractor = driverMap[driver.toLowerCase()] || 'Unknown';
      return { driver, contractor, route, calendar, date, start_time, end_time, punctuality, price };
    });

  res.status(200).json({ items });
}
