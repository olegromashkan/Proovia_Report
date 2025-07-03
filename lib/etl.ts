import { randomUUID } from 'crypto';
import db from './db';
import { parseDate } from './dateUtils';

export function processRoadCrew(fileContent: string): void {
  try {
    const data = JSON.parse(fileContent);
    const items: any[] = Array.isArray(data)
      ? data
      : data.Road_Crew || data.roadCrew || [];
    const stmt = db.prepare(
      `INSERT INTO drivers (id, full_name, email, contractor_name)
       VALUES (@id, @full_name, @email, @contractor_name)
       ON CONFLICT(full_name) DO UPDATE SET contractor_name = excluded.contractor_name`
    );
    const select = db.prepare('SELECT id FROM drivers WHERE full_name = ?');
    const tr = db.transaction((rows: any[]) => {
      for (const r of rows) {
        const fullName = r.Full_Name || r.full_name;
        if (!fullName) continue;
        const contractor = r.Contractor_Name || r.contractor_name || 'Unknown';
        const email = r.Email || r.email || null;
        const existing = select.get(fullName) as any;
        const id = existing?.id || randomUUID();
        stmt.run({ id, full_name: fullName, email, contractor_name: contractor });
      }
    });
    tr(items);
  } catch (err) {
    console.error('processRoadCrew failed', err);
  }
}

export function processScheduledTrips(fileContent: string): void {
  try {
    const data = JSON.parse(fileContent);
    const trips: any[] = Array.isArray(data)
      ? data
      : data.Scheduled_Trips || data.schedule_trips || data.scheduleTrips || [];
    const dates = new Set<string>();
    trips.forEach(t => {
      const raw = t.Start_Time || t['Start_Time'] || t['Trip.Start_Time'];
      const iso = parseDate(String(raw).split(' ')[0]);
      if (iso) dates.add(iso);
    });
    if (dates.size) {
      const placeholders = Array.from(dates).map(() => '?').join(',');
      db.prepare(`DELETE FROM trips WHERE trip_date IN (${placeholders})`).run(
        ...Array.from(dates)
      );
    }
    const stmt = db.prepare(`
      INSERT INTO trips (
        id, driver_id, trip_date, route_name, order_value, task_count,
        scheduled_start_time, scheduled_end_time
      ) VALUES (
        @id, @driver_id, @trip_date, @route_name, @order_value, @task_count,
        @scheduled_start_time, @scheduled_end_time
      ) ON CONFLICT(id) DO UPDATE SET
        driver_id=excluded.driver_id,
        trip_date=excluded.trip_date,
        route_name=excluded.route_name,
        order_value=excluded.order_value,
        task_count=excluded.task_count,
        scheduled_start_time=excluded.scheduled_start_time,
        scheduled_end_time=excluded.scheduled_end_time
    `);
    const selDriver = db.prepare('SELECT id FROM drivers WHERE full_name = ?');
    const tr = db.transaction((rows: any[]) => {
      for (const r of rows) {
        const rawStart = r.Start_Time || r['Start_Time'] || r['Trip.Start_Time'];
        const rawEnd = r.End_Time || r['End_Time'] || r['Trip.End_Time'];
        const iso = parseDate(String(rawStart).split(' ')[0]);
        if (!iso) continue;
        const driverName = r.Driver1 || r['Driver1'] || r.Driver;
        const driverRow = driverName ? (selDriver.get(driverName) as any) : null;
        const driver_id = driverRow ? driverRow.id : null;
        const cal = r.Calendar_Name || r['Calendar_Name'] || '';
        const m = String(cal).match(/\((\d+)\)/);
        const taskCount = m ? parseInt(m[1], 10) : null;
        const orderRaw =
          r.Order_Value || r['Order_Value'] || r.OrderValue || r['OrderValue'];
        const order_value = parseFloat(orderRaw);
        const route = String(cal).replace(/\(.*\)/, '').trim();
        const id = r.ID || r.Id || r.id || randomUUID();
        stmt.run({
          id,
          driver_id,
          trip_date: iso,
          route_name: route || null,
          order_value: isNaN(order_value) ? null : order_value,
          task_count: taskCount,
          scheduled_start_time: rawStart || null,
          scheduled_end_time: rawEnd || null,
        });
      }
    });
    tr(trips);
  } catch (err) {
    console.error('processScheduledTrips failed', err);
  }
}

function parseCsv(content: string): any[] {
  const lines = content.trim().split(/\r?\n/);
  if (lines.length === 0) return [];
  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).map(line => {
    const values = splitCsvLine(line);
    const obj: any = {};
    headers.forEach((h, i) => {
      obj[h] = values[i];
    });
    return obj;
  });
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else {
      if (ch === ',') {
        result.push(cur);
        cur = '';
      } else if (ch === '"') {
        inQuotes = true;
      } else {
        cur += ch;
      }
    }
  }
  result.push(cur);
  return result;
}

export function processTripHistory(fileContent: string): void {
  try {
    const rows = parseCsv(fileContent);
    const selTrip = db.prepare(
      'SELECT id FROM trips WHERE route_name LIKE ? AND trip_date = ?'
    );
    const upd = db.prepare(
      'UPDATE trips SET actual_start_time = ?, actual_end_time = ? WHERE id = ?'
    );
    const tr = db.transaction((items: any[]) => {
      for (const r of items) {
        const asset = r['Asset'] || r.Asset;
        const start = r['Start At'] || r['Start'] || r.start;
        const end = r['End At'] || r['End'] || r.end;
        const dateIso = parseDate(String(start).split(' ')[0]);
        if (!asset || !dateIso) continue;
        const van = String(asset).includes('-')
          ? String(asset).split('-')[1]
          : String(asset);
        const trip = selTrip.get(`%${van}%`, dateIso) as any;
        if (trip) {
          upd.run(start || null, end || null, trip.id);
        }
      }
    });
    tr(rows);
  } catch (err) {
    console.error('processTripHistory failed', err);
  }
}

function pick(obj: any, keys: string[]): any {
  if (!obj || typeof obj !== 'object') return undefined;
  for (const key of keys) {
    if (obj[key] !== undefined) return obj[key];
    const lower = key.toLowerCase();
    const found = Object.keys(obj).find(k => k.toLowerCase() === lower);
    if (found) return obj[found];
  }
  return undefined;
}

export function processEventStream(fileContent: string): void {
  try {
    const data = JSON.parse(fileContent);
    const events: any[] = Array.isArray(data)
      ? data
      : data.Event_Stream || data.events || [];
    const insAssign = db.prepare(
      'INSERT INTO van_assignments (assignment_time, driver_name, van_registration) VALUES (?, ?, ?)'
    );
    const insCheck = db.prepare(
      'INSERT INTO van_checks (check_time, van_registration, mileage, fuel, oil) VALUES (?, ?, ?, ?, ?)'
    );
    const tr = db.transaction((items: any[]) => {
      for (const e of items) {
        const ts =
          pick(e, ['Timestamp', 'timestamp', 'Time']) || new Date().toISOString();
        const driver = pick(e, ['Driver']);
        const van = pick(e, ['Vans', 'Van']);
        if (driver && van) {
          insAssign.run(ts, driver, van);
        }
        const type = pick(e, ['Type', 'Event', 'event_type']);
        if (String(type).toLowerCase() === 'van-check') {
          let payload: any = pick(e, ['Payload']);
          if (typeof payload === 'string') {
            try { payload = JSON.parse(payload); } catch {}
          }
          const vanId =
            pick(payload, ['van_registration', 'van_id', 'Van', 'Vans']) || van;
          const mileage = pick(payload, ['mileage']);
          const fuel = pick(payload, ['fuel']);
          const oil = pick(payload, ['oil']);
          const time =
            pick(payload, ['time', 'date', 'timestamp']) || ts;
          if (vanId) {
            insCheck.run(time, vanId, mileage ?? null, fuel ?? null, oil ?? null);
          }
        }
      }
    });
    tr(events);
  } catch (err) {
    console.error('processEventStream failed', err);
  }
}

export function processTodayLive(fileContent: string): void {
  try {
    const data = JSON.parse(fileContent);
    const tasks: any[] = Array.isArray(data)
      ? data
      : data.Today_live || data.tasks || [];
    const ignore = new Set([
      'Trip.Is_Locked',
      'Task_Date',
      'Order.Summary',
      'Checksum',
    ]);
    const selTrip = db.prepare(
      'SELECT trips.id FROM trips JOIN drivers ON trips.driver_id = drivers.id WHERE drivers.full_name = ? AND trip_date = ?'
    );
    const stmt = db.prepare(`
      INSERT INTO tasks (
        id, trip_id, order_number, task_type, status, failure_reason,
        postcode, time_arrival, time_completed, notes
      ) VALUES (
        @id, @trip_id, @order_number, @task_type, @status, @failure_reason,
        @postcode, @time_arrival, @time_completed, @notes
      ) ON CONFLICT(id) DO UPDATE SET
        trip_id=excluded.trip_id,
        order_number=excluded.order_number,
        task_type=excluded.task_type,
        status=excluded.status,
        failure_reason=excluded.failure_reason,
        postcode=excluded.postcode,
        time_arrival=excluded.time_arrival,
        time_completed=excluded.time_completed,
        notes=excluded.notes
    `);
    const tr = db.transaction((rows: any[]) => {
      for (const r of rows) {
        Object.keys(r).forEach(k => {
          if (ignore.has(k)) delete r[k];
        });
        const driver = r.Driver1 || r.Driver || r['Trip.Driver1'];
        const start = r.Start_Time || r['Start_Time'] || r['Trip.Start_Time'];
        const dateIso = parseDate(String(start).split(' ')[0]);
        if (!driver || !dateIso) continue;
        const tripRow = selTrip.get(driver, dateIso) as any;
        const trip_id = tripRow ? tripRow.id : null;
        const summary = r.Summary || '';
        const m = String(summary).match(/\b([A-Za-z_]+)\b/);
        const task_type = m ? m[1] : summary;
        const status = r.Status || '';
        let failure_reason: string | null = null;
        if (String(status).toLowerCase() === 'failed') {
          const notes = r.Notes || '';
          const fm = String(notes).match(/reason[:\-]?\s*(.*)/i);
          failure_reason = fm ? fm[1] : notes;
        }
        const id = r.ID || r.Id || r.id || randomUUID();
        stmt.run({
          id,
          trip_id,
          order_number: r.Order_OrderNumber || r['Order.OrderNumber'] || r.OrderNumber || null,
          task_type,
          status,
          failure_reason,
          postcode: r.Address_Postcode || r['Address.Postcode'] || r.Postcode || null,
          time_arrival: r.Arrival_Time || r['Arrival_Time'] || null,
          time_completed: r.Time_Completed || r['Time_Completed'] || null,
          notes: r.Notes || null,
        });
      }
    });
    tr(tasks);
  } catch (err) {
    console.error('processTodayLive failed', err);
  }
}
