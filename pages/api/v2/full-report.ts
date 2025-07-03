import type { NextApiRequest, NextApiResponse } from 'next';
import { createHash } from 'crypto';
import db from '../../../lib/db';
import { parseDate } from '../../../lib/dateUtils';
import { getCache, setCache } from '../../../lib/cache';

const TARGET_LOCATION = 'Wood Lane, BIRMINGHAM B24, GB';
const MIN_HOUR = 4;
const MAX_HOUR = 11; // not inclusive

function formatTime(date: Date | null): string {
  if (!date) return 'N/A';
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function calcTimes(rows: any[]) {
  const mentions = rows.filter(
    (r) =>
      r['Trip Start Location'] === TARGET_LOCATION ||
      r['Trip End Location'] === TARGET_LOCATION,
  );
  if (mentions.length === 0) {
    return { first: 'N/A', last: 'N/A', duration: '00:00' };
  }

  const startTimes = mentions
    .filter((r) => r['Trip Start Location'] === TARGET_LOCATION)
    .map((r) => new Date(r['Start At']))
    .filter((d) => !isNaN(d.getTime()));
  const endTimes = mentions
    .filter((r) => r['Trip End Location'] === TARGET_LOCATION)
    .map((r) => new Date(r['End At']))
    .filter((d) => !isNaN(d.getTime()));

  const firstOverall = [...startTimes, ...endTimes].reduce(
    (a, b) => (a && a < b ? a : b),
    startTimes[0] || endTimes[0],
  );
  const lastOverall = [...startTimes, ...endTimes].reduce(
    (a, b) => (a && a > b ? a : b),
    startTimes[0] || endTimes[0],
  );

  if (!firstOverall || !lastOverall) {
    return { first: 'N/A', last: 'N/A', duration: '00:00' };
  }

  const diffMs = lastOverall.getTime() - firstOverall.getTime();
  const diffMin = Math.round(diffMs / 60000);
  const hours = String(Math.floor(diffMin / 60)).padStart(2, '0');
  const mins = String(Math.abs(diffMin % 60)).padStart(2, '0');

  return {
    first: formatTime(firstOverall),
    last: formatTime(lastOverall),
    duration: `${hours}:${mins}`,
  };
}

function computeStartTimes(start: string, end: string) {
  const startDate = start ? new Date(start) : null;
  const endDate = end ? new Date(end + 'T23:59:59') : null;
  const csvRows = db.prepare('SELECT data FROM csv_trips').all();
  const events = db.prepare('SELECT data FROM event_stream').all();
  const schedules = db.prepare('SELECT data FROM schedule_trips').all();
  const drivers = db.prepare('SELECT data FROM drivers_report').all();

  const csv = csvRows.map((r: any) => JSON.parse(r.data));
  const eventData = events.map((r: any) => JSON.parse(r.data));
  const schedData = schedules.map((r: any) => JSON.parse(r.data));
  const driverData = drivers.map((r: any) => JSON.parse(r.data));

  const vanToDriver: Record<string, string> = {};
  eventData.forEach((e: any) => {
    if (e.Vans) {
      const d = typeof e.Driver === 'string' ? e.Driver.trim() : 'Unknown';
      vanToDriver[e.Vans] = d || 'Unknown';
    }
  });

  const driverToStart: Record<string, any> = {};
  schedData.forEach((s: any) => {
    if (typeof s.Driver1 === 'string' && s.Driver1.trim()) {
      driverToStart[s.Driver1.trim()] = s.Start_Time;
    }
  });

  const driverToContractor: Record<string, string> = {};
  driverData.forEach((d: any) => {
    if (typeof d.Full_Name === 'string' && d.Full_Name.trim()) {
      driverToContractor[d.Full_Name.trim()] = d.Contractor_Name || 'Unknown';
    }
  });

  const groups: Record<string, any[]> = {};
  csv.forEach((row: any) => {
    const d1 = new Date(row['Start At']);
    const d2 = new Date(row['End At']);
    row['Start At'] = d1;
    row['End At'] = d2;
    const dateIso = (d1 || d2)?.toISOString().slice(0, 10) ?? null;
    if (
      (startDate && dateIso && dateIso < start) ||
      (endDate && dateIso && dateIso > end)
    ) {
      return;
    }
    const asset = row['Asset'];
    if (!groups[asset]) groups[asset] = [];
    groups[asset].push(row);
  });

  const results: any[] = [];
  const allVans = Object.keys(groups).map((a) =>
    a.includes('-') ? a.split('-')[1] : a,
  );

  for (const [assetFull, rows] of Object.entries(groups)) {
    const vanId = assetFull.includes('-') ? assetFull.split('-')[1] : assetFull;
    const driver = vanToDriver[vanId] || 'Unknown';
    const contractor =
      driver !== 'Unknown' ? driverToContractor[driver] || 'Unknown' : 'Unknown';
    const sched = driverToStart[driver];
    const schedDate = sched ? formatTime(new Date(sched)) : 'Unknown';
    const schedDay = sched
      ? String(new Date(sched).getDate()).padStart(2, '0')
      : 'Unknown';

    const filtered = rows.filter((r) => {
      if (!r['Start At'] || !r['End At']) return false;
      const sh = r['Start At'].getHours();
      const eh = r['End At'].getHours();
      return sh >= MIN_HOUR && sh < MAX_HOUR && eh >= MIN_HOUR && eh < MAX_HOUR;
    });
    const info = calcTimes(filtered);
    results.push({
      Asset: vanId,
      Driver: driver,
      Contractor_Name: contractor,
      Date: schedDay,
      Start_Time: schedDate,
      First_Mention_Time: info.first,
      Last_Mention_Time: info.last,
      Duration: info.duration,
    });
  }

  const processedIds = new Set(results.map((r) => r.Asset));
  const vansNotInEvents = allVans.filter((v) => !(v in vanToDriver));

  vansNotInEvents.forEach((vanId) => {
    if (processedIds.has(vanId)) return;
    const rows = Object.values(groups)
      .flat()
      .filter((r) => String(r['Asset']).includes(vanId));
    const filtered = rows.filter((r: any) => {
      if (!r['Start At'] || !r['End At']) return false;
      const sh = r['Start At'].getHours();
      const eh = r['End At'].getHours();
      return sh >= MIN_HOUR && sh < MAX_HOUR && eh >= MIN_HOUR && eh < MAX_HOUR;
    });
    const info = calcTimes(filtered);
    results.push({
      Asset: vanId,
      Driver: 'No Driver in Event File',
      Contractor_Name: 'Unknown',
      Date: 'Unknown',
      Start_Time: 'Unknown',
      First_Mention_Time: info.first,
      Last_Mention_Time: info.last,
      Duration: info.duration,
    });
  });

  return results.sort((a, b) => a.Asset.localeCompare(b.Asset));
}

function computeVanChecks(start: string, end: string) {
  const startDate = start ? new Date(start) : null;
  const endDate = end ? new Date(end + 'T23:59:59') : null;

  const rows = db.prepare('SELECT data FROM van_checks').all();
  let items = rows.map((r: any) => JSON.parse(r.data));

  const eventRows = db.prepare('SELECT data FROM event_stream').all();
  for (const r of eventRows) {
    try {
      const e = JSON.parse(r.data);
      let payload: any = {};
      if (typeof e.Payload === 'string') {
        try {
          payload = JSON.parse(e.Payload);
        } catch {}
      } else if (e.Payload && typeof e.Payload === 'object') {
        payload = e.Payload;
      }
      const pick = (obj: any, keys: string[]): any => {
        if (!obj || typeof obj !== 'object') return undefined;
        for (const key of keys) {
          if (obj[key] !== undefined) return obj[key];
          const lower = key.toLowerCase();
          const found = Object.keys(obj).find((k) => k.toLowerCase() === lower);
          if (found) return obj[found];
        }
        return undefined;
      };
      const vanId =
        pick(e, ['van_id', 'Vans', 'Van', 'vanID', 'VanID']) ||
        pick(payload, ['van_id', 'Vans', 'Van', 'vanID', 'VanID']);
      const driverId =
        pick(e, ['driver_id', 'Driver', 'driver']) ||
        pick(payload, ['driver_id', 'Driver', 'driver']);
      const tools = pick(e, ['tools', 'Tools']) || pick(payload, ['tools', 'Tools']);
      const parameters =
        pick(e, ['parameters', 'Parameters', 'params', 'Params']) ||
        pick(payload, ['parameters', 'Parameters', 'params', 'Params']);
      const checks =
        pick(e, ['checks', 'Checks']) ||
        pick(payload, ['checks', 'Checks']);
      const date =
        pick(e, ['date', 'Date', 'created_at', 'timestamp']) ||
        pick(payload, ['date', 'Date', 'created_at', 'timestamp']);

      if (vanId || tools || parameters || checks || driverId) {
        items.push({ van_id: vanId, driver_id: driverId, date, tools, parameters, checks });
      }
    } catch {
      // ignore invalid rows
    }
  }

  items = items.filter((it) => {
    if (!it.van_id) return false;
    if (!it.date) return false;
    const d = new Date(it.date);
    return !isNaN(d.getTime());
  });

  if (startDate || endDate) {
    items = items.filter((it) => {
      const d = new Date(it.date);
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      return true;
    });
  }

  return items;
}

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
    startSearch = '',
    startContractor = '',
    vanSearch = '',
    vanContractor = '',
    sortField = 'Order.OrderNumber',
    sortDir = 'asc',
    startSortField = 'Driver',
    startSortDir = 'asc',
  } = req.query as Record<string, string>;

  const cacheKey = 'full-report:' + JSON.stringify(req.query);
  const cached = getCache<any>(cacheKey);
  if (cached) {
    if (req.headers['if-none-match'] === cached.etag) {
      res.status(304).end();
      return;
    }
    res.setHeader('ETag', cached.etag);
    res.status(200).json(cached.value);
    return;
  }

  const startDate = start ? start : '';
  const endDate = end ? end : '';

  const driverRows = db.prepare('SELECT data FROM drivers_report').all();
  const driverToContractor: Record<string, string> = {};
  driverRows.forEach((r: any) => {
    const d = JSON.parse(r.data);
    if (d.Full_Name) {
      driverToContractor[d.Full_Name.trim()] = d.Contractor_Name || 'Unknown';
    }
  });

  const params: any[] = [];
  let where = 'WHERE 1=1';
  if (startDate) {
    where += ' AND d >= ?';
    params.push(startDate);
  }
  if (endDate) {
    where += ' AND d <= ?';
    params.push(endDate);
  }
  if (status) {
    where += ' AND status = ?';
    params.push(status.toLowerCase());
  }
  if (auction) {
    where += ' AND auction = ?';
    params.push(auction.toLowerCase());
  }
  if (contractor) {
    const drivers = Object.keys(driverToContractor)
      .filter((d) => driverToContractor[d] === contractor)
      .map((d) => d.toLowerCase());
    if (drivers.length === 0) {
      const payload = {
        trips: [],
        startData: [],
        vanChecks: [],
        topDrivers: [],
        topPostcodes: [],
        topAuctions: [],
        topContractors: [],
        stats: {
          total: 0,
          complete: 0,
          failed: 0,
          positiveTimeCompleted: 0,
          positiveArrivalTime: 0,
        },
      };
      const etag = createHash('sha1')
        .update(JSON.stringify(payload))
        .digest('hex');
      setCache(cacheKey, payload, 5 * 60 * 1000, etag);
      res.setHeader('ETag', etag);
      return res.status(200).json(payload);
    }
    where += ` AND driver IN (${drivers.map(() => '?').join(',')})`;
    params.push(...drivers);
  }
  if (search) {
    const q = `%${search.toLowerCase()}%`;
    where +=
      ' AND (orderNumber LIKE ? OR postcode LIKE ? OR driver LIKE ?)';
    params.push(q, q, q);
  }

  const query = `
    SELECT data FROM (
      SELECT data,
             parse_date(
               COALESCE(
                 json_extract(data,'$.Start_Time'),
                 json_extract(data,'$."Start_Time"'),
                 json_extract(data,'$."Trip.Start_Time"'),
                 json_extract(data,'$.Predicted_Time'),
                 json_extract(data,'$."Predicted_Time"')
               )
             ) AS d,
             lower(json_extract(data,'$.Status')) AS status,
             lower(json_extract(data,'$."Order.Auction"')) AS auction,
             lower(COALESCE(json_extract(data,'$."Trip.Driver1"'), json_extract(data,'$.Driver1'), json_extract(data,'$.Driver'))) AS driver,
             CAST(json_extract(data,'$.Order.OrderNumber') AS TEXT) AS orderNumber,
             lower(CAST(json_extract(data,'$.Address.Postcode') AS TEXT)) AS postcode
        FROM copy_of_tomorrow_trips
    ) t
    ${where}
  `;
  const tripRows = db.prepare(query).all(...params) as Array<{ data: string }>;
  let trips = tripRows.map((r) => JSON.parse(r.data));

  trips.sort((a, b) => {
    const av = getValue(a, sortField);
    const bv = getValue(b, sortField);
    if (av === bv) return 0;
    if (av === undefined) return 1;
    if (bv === undefined) return -1;
    return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
  });

  let startData = computeStartTimes(startDate, endDate);

  if (startSearch) {
    const q = startSearch.toLowerCase();
    startData = startData.filter(
      (r) =>
        String(r.Asset).toLowerCase().includes(q) ||
        String(r.Driver).toLowerCase().includes(q),
    );
  }

  if (startContractor) {
    startData = startData.filter(
      (r) => String(r.Contractor_Name) === startContractor,
    );
  }

  startData.sort((a, b) => {
    const av = getValue(a, startSortField);
    const bv = getValue(b, startSortField);
    if (av === bv) return 0;
    if (av === undefined) return 1;
    if (bv === undefined) return -1;
    return startSortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
  });

  let vanChecks = computeVanChecks(startDate, endDate);

  if (vanSearch) {
    const q = vanSearch.toLowerCase();
    vanChecks = vanChecks.filter(
      (v) =>
        String(v.van_id).toLowerCase().includes(q) ||
        String(v.driver_id).toLowerCase().includes(q),
    );
  }

  if (vanContractor) {
    vanChecks = vanChecks.filter(
      (v) => driverToContractor[v.driver_id] === vanContractor,
    );
  }

  // --------- Additional statistics ---------
  let total = 0;
  let complete = 0;
  let failed = 0;
  let positiveTimeCompleted = 0;
  let positiveArrivalTime = 0;

  interface DriverStat { complete: number; failed: number }
  const driverStats: Record<string, DriverStat> = {};
  const postcodeCount: Record<string, number> = {};
  const auctionCount: Record<string, number> = {};
  interface ContractorStat { sum: number; count: number }
  const contractorStats: Record<string, ContractorStat> = {};

  trips.forEach((item: any) => {
    total += 1;
    const status = String(item.Status || '').toLowerCase();
    if (status === 'complete') complete += 1;
    if (status === 'failed') failed += 1;

    const driver =
      item['Trip.Driver1'] || item.Driver1 || item.Driver || 'Unknown';
    const contractor = driverToContractor[driver] || 'Unknown';

    if (!driverStats[driver]) driverStats[driver] = { complete: 0, failed: 0 };
    if (status === 'complete') driverStats[driver].complete += 1;
    if (status === 'failed') driverStats[driver].failed += 1;

    const priceVal =
      item.Order_Value || item['Order_Value'] || item.OrderValue || item['OrderValue'];
    const price = priceVal !== undefined ? parseFloat(String(priceVal)) : NaN;
    if (!isNaN(price)) {
      if (!contractorStats[contractor])
        contractorStats[contractor] = { sum: 0, count: 0 };
      contractorStats[contractor].sum += price;
      contractorStats[contractor].count += 1;
    }

    const pc = item['Address.Postcode'] || item.Postcode;
    if (pc) {
      const key = String(pc);
      postcodeCount[key] = (postcodeCount[key] || 0) + 1;
    }

    const auc = item['Order.Auction'];
    if (auc) {
      const key = String(auc);
      auctionCount[key] = (auctionCount[key] || 0) + 1;
    }

    const wh =
      item['Address.Working_Hours'] ||
      item.Address_Working_Hours ||
      item['Address.Working_Hours'];
    const timeCompleted =
      item.Time_Completed || item['Time_Completed'] || item['Trip.Time_Completed'];
    const arrival =
      item.Arrival_Time || item['Arrival_Time'] || item['Trip.Arrival_Time'];

    if (wh && timeCompleted && arrival) {
      const matches = String(wh).match(/\d{2}:\d{2}/g);
      const endTime = matches?.[1];
      if (endTime) {
        const [h, m] = endTime.split(':').map(Number);
        const tcDate = new Date(timeCompleted);
        const whEndForTC = new Date(tcDate);
        whEndForTC.setHours(h, m, 0, 0);
        const arrDate = new Date(arrival);
        const whEndForArr = new Date(arrDate);
        whEndForArr.setHours(h, m, 0, 0);

        if (tcDate >= whEndForTC) positiveTimeCompleted++;
        if (arrDate >= whEndForArr) positiveArrivalTime++;
      }
    }
  });

  const topDrivers = Object.entries(driverStats)
    .map(([driver, s]) => ({
      driver,
      complete: s.complete,
      failed: s.failed,
    }))
    .sort((a, b) => b.complete + b.failed - (a.complete + a.failed))
    .slice(0, 3);

  const topPostcodes = Object.entries(postcodeCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const topAuctions = Object.entries(auctionCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const topContractors = Object.entries(contractorStats)
    .map(([name, s]) => [name, s.sum / s.count] as [string, number])
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  const payload = {
    trips,
    startData,
    vanChecks,
    topDrivers,
    topPostcodes,
    topAuctions,
    topContractors,
    stats: {
      total,
      complete,
      failed,
      positiveTimeCompleted,
      positiveArrivalTime,
    },
  };
  const etag = createHash('sha1')
    .update(JSON.stringify(payload))
    .digest('hex');
  setCache(cacheKey, payload, 5 * 60 * 1000, etag);
  res.setHeader('ETag', etag);
  res.status(200).json(payload);
}
