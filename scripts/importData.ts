import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { pool } from '../lib/db';

interface Driver {
  id?: number;
  full_name: string;
  phone?: string;
  email?: string;
}

interface Trip {
  id?: number;
  trip_date: string;
  route_name?: string;
  driver_id?: number;
  start_time?: string;
  end_time?: string;
  is_locked?: boolean;
  notes?: string;
}

interface Order {
  id?: number;
  trip_id?: number;
  order_number: string;
  description?: string;
  summary?: string;
  current_location?: string;
  order_status?: string;
  payment_status?: string;
  payment_type?: string;
  payment_reference?: string;
  auction?: string;
  warehouse_locations?: string;
  high_priority?: boolean;
  total_amount?: number;
  amount_due?: number;
  total_volume?: number;
  driver_total?: number;
  time_completed?: string;
  arrival_time?: string;
}

interface Address {
  id?: number;
  order_id?: number;
  contact_name?: string;
  company_name?: string;
  address_line?: string;
  postcode?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  working_hours?: string;
  level?: string;
}

async function importDrivers(drivers: Driver[]) {
  for (const d of drivers) {
    await pool.query(
      `INSERT INTO drivers (id, full_name, phone, email)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone, email = EXCLUDED.email`,
      [d.id, d.full_name, d.phone, d.email],
    );
  }
}

async function importTrips(trips: Trip[]) {
  for (const t of trips) {
    await pool.query(
      `INSERT INTO trips (id, trip_date, route_name, driver_id, start_time, end_time, is_locked, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (id) DO UPDATE SET trip_date = EXCLUDED.trip_date, route_name = EXCLUDED.route_name, driver_id = EXCLUDED.driver_id,
         start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time, is_locked = EXCLUDED.is_locked, notes = EXCLUDED.notes`,
      [t.id, t.trip_date, t.route_name, t.driver_id, t.start_time, t.end_time, t.is_locked, t.notes],
    );
  }
}

async function importOrders(orders: Order[]) {
  for (const o of orders) {
    await pool.query(
      `INSERT INTO orders (id, trip_id, order_number, description, summary, current_location, order_status, payment_status, payment_type, payment_reference, auction, warehouse_locations, high_priority, total_amount, amount_due, total_volume, driver_total, time_completed, arrival_time)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
       ON CONFLICT (id) DO UPDATE SET trip_id = EXCLUDED.trip_id, order_number = EXCLUDED.order_number, description = EXCLUDED.description,
         summary = EXCLUDED.summary, current_location = EXCLUDED.current_location, order_status = EXCLUDED.order_status,
         payment_status = EXCLUDED.payment_status, payment_type = EXCLUDED.payment_type, payment_reference = EXCLUDED.payment_reference,
         auction = EXCLUDED.auction, warehouse_locations = EXCLUDED.warehouse_locations, high_priority = EXCLUDED.high_priority,
         total_amount = EXCLUDED.total_amount, amount_due = EXCLUDED.amount_due, total_volume = EXCLUDED.total_volume,
         driver_total = EXCLUDED.driver_total, time_completed = EXCLUDED.time_completed, arrival_time = EXCLUDED.arrival_time`,
      [
        o.id,
        o.trip_id,
        o.order_number,
        o.description,
        o.summary,
        o.current_location,
        o.order_status,
        o.payment_status,
        o.payment_type,
        o.payment_reference,
        o.auction,
        o.warehouse_locations,
        o.high_priority,
        o.total_amount,
        o.amount_due,
        o.total_volume,
        o.driver_total,
        o.time_completed,
        o.arrival_time,
      ],
    );
  }
}

async function importAddresses(addresses: Address[]) {
  for (const a of addresses) {
    await pool.query(
      `INSERT INTO addresses (id, order_id, contact_name, company_name, address_line, postcode, latitude, longitude, phone, email, working_hours, level)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       ON CONFLICT (id) DO UPDATE SET order_id = EXCLUDED.order_id, contact_name = EXCLUDED.contact_name,
         company_name = EXCLUDED.company_name, address_line = EXCLUDED.address_line, postcode = EXCLUDED.postcode,
         latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude, phone = EXCLUDED.phone, email = EXCLUDED.email,
         working_hours = EXCLUDED.working_hours, level = EXCLUDED.level`,
      [
        a.id,
        a.order_id,
        a.contact_name,
        a.company_name,
        a.address_line,
        a.postcode,
        a.latitude,
        a.longitude,
        a.phone,
        a.email,
        a.working_hours,
        a.level,
      ],
    );
  }
}

export async function importJson(path: string) {
  const data = JSON.parse(fs.readFileSync(path, 'utf-8'));
  if (Array.isArray(data.drivers)) await importDrivers(data.drivers);
  if (Array.isArray(data.trips)) await importTrips(data.trips);
  if (Array.isArray(data.orders)) await importOrders(data.orders);
  if (Array.isArray(data.addresses)) await importAddresses(data.addresses);
}

export async function importCsv(path: string, type: 'drivers' | 'trips' | 'orders' | 'addresses') {
  const records = parse(fs.readFileSync(path, 'utf-8'), { columns: true, skip_empty_lines: true });
  switch (type) {
    case 'drivers':
      await importDrivers(records as Driver[]);
      break;
    case 'trips':
      await importTrips(records as Trip[]);
      break;
    case 'orders':
      await importOrders(records as Order[]);
      break;
    case 'addresses':
      await importAddresses(records as Address[]);
      break;
  }
}

if (require.main === module) {
  // Example usage:
  // await importJson('data.json');
  // await importCsv('orders.csv', 'orders');
  console.log('Import helpers ready');
}
