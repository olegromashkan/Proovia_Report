import db from './db';
import { parseDate } from './dateUtils';

export function generateFullReportStats(): number {
  const tripRows = db.prepare('SELECT data FROM copy_of_tomorrow_trips').all();
  const driverRows = db.prepare('SELECT data FROM drivers_report').all();

  const driverToContractor: Record<string, string> = {};
  driverRows.forEach((r: any) => {
    const d = JSON.parse(r.data);
    if (d.Full_Name) {
      driverToContractor[d.Full_Name.trim()] = d.Contractor_Name || 'Unknown';
    }
  });

  const groups: Record<string, any[]> = {};
  tripRows.forEach((r: any) => {
    try {
      const item = JSON.parse(r.data);
      const raw =
        item['Trip.Start_Time'] || item['Start_Time'] || item.Start_Time || '';
      const iso = parseDate(String(raw).split(' ')[0]);
      if (!iso) return;
      if (!groups[iso]) groups[iso] = [];
      groups[iso].push(item);
    } catch {}
  });

  const insert = db.prepare(
    "INSERT OR REPLACE INTO full_report_stats (date, data, created_at) VALUES (?, ?, datetime('now'))",
  );
  let created = 0;

  for (const [date, items] of Object.entries(groups)) {
    let total = 0;
    let complete = 0;
    let failed = 0;
    let positiveTimeCompleted = 0;
    let positiveArrivalTime = 0;
    const driverStats: Record<string, { complete: number; failed: number }> = {};
    const postcodeCount: Record<string, number> = {};
    const auctionCount: Record<string, number> = {};
    const contractorStats: Record<string, { sum: number; count: number }> = {};

    items.forEach((item: any) => {
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
        item.Order_Value ||
        item['Order_Value'] ||
        item.OrderValue ||
        item['OrderValue'];
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

    const stats = {
      topDrivers,
      topPostcodes,
      topAuctions,
      topContractors,
      total,
      complete,
      failed,
      positiveTimeCompleted,
      positiveArrivalTime,
    };

    insert.run(date, JSON.stringify(stats));
    created += 1;
  }

  return created;
}
