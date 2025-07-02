import db from './lib/db';

function migrateTrips() {
  const rows = db.prepare('SELECT id, data FROM copy_of_tomorrow_trips').all();
  const insert = db.prepare(`
    INSERT INTO trips (
      id, order_number, driver_name, contractor_name, status,
      start_time, end_time, arrival_time, postcode, auction,
      price, notes
    ) VALUES (
      @id, @order_number, @driver_name, @contractor_name, @status,
      @start_time, @end_time, @arrival_time, @postcode, @auction,
      @price, @notes
    )`);
  const exists = db.prepare('SELECT 1 FROM trips WHERE id = ?');

  const tr = db.transaction(() => {
    for (const r of rows) {
      if (exists.get(r.id)) continue;
      try {
        const d = JSON.parse(r.data);
        insert.run({
          id: r.id,
          order_number: d['Order.OrderNumber'] || d.OrderNumber || null,
          driver_name: d['Trip.Driver1'] || d.Driver1 || null,
          contractor_name: d.Contractor_Name || d['Contractor_Name'] || null,
          status: d.Status || null,
          start_time: d['Trip.Start_Time'] || d.Start_Time || null,
          end_time: d.End_Time || null,
          arrival_time: d.Arrival_Time || null,
          postcode: d['Address.Postcode'] || null,
          auction: d['Order.Auction'] || null,
          price: d.Price || null,
          notes: d.Notes || null,
        });
      } catch {}
    }
  });
  tr();
}

function migrateDrivers() {
  const rows = db.prepare('SELECT id, data FROM drivers_report').all();
  const insert = db.prepare(`
    INSERT INTO drivers (
      id, full_name, contractor_name
    ) VALUES (@id, @full_name, @contractor_name)`);
  const exists = db.prepare('SELECT 1 FROM drivers WHERE id = ?');
  const tr = db.transaction(() => {
    for (const r of rows) {
      if (exists.get(r.id)) continue;
      try {
        const d = JSON.parse(r.data);
        insert.run({
          id: r.id,
          full_name: d.Full_Name || null,
          contractor_name: d.Contractor_Name || null,
        });
      } catch {}
    }
  });
  tr();
}

migrateTrips();
migrateDrivers();

console.log('Migration complete');
