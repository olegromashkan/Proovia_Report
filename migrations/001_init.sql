-- PostgreSQL initial schema

CREATE TABLE drivers (
    id SERIAL PRIMARY KEY,
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT
);

CREATE TABLE trips (
    id SERIAL PRIMARY KEY,
    trip_date DATE NOT NULL,
    route_name TEXT,
    driver_id INT REFERENCES drivers(id),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    is_locked BOOLEAN DEFAULT false,
    notes TEXT
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    trip_id INT REFERENCES trips(id),
    order_number TEXT NOT NULL,
    description TEXT,
    summary TEXT,
    current_location TEXT,
    order_status TEXT,
    payment_status TEXT,
    payment_type TEXT,
    payment_reference TEXT,
    auction TEXT,
    warehouse_locations TEXT,
    high_priority BOOLEAN DEFAULT false,
    total_amount NUMERIC(10,2),
    amount_due NUMERIC(10,2),
    total_volume NUMERIC(10,2),
    driver_total NUMERIC(10,2),
    time_completed TIMESTAMP,
    arrival_time TIMESTAMP
);

CREATE TABLE addresses (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id),
    contact_name TEXT,
    company_name TEXT,
    address_line TEXT,
    postcode TEXT,
    latitude NUMERIC(9,6),
    longitude NUMERIC(9,6),
    phone TEXT,
    email TEXT,
    working_hours TEXT,
    level TEXT
);

CREATE INDEX idx_trips_trip_date ON trips(trip_date);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_addresses_postcode ON addresses(postcode);
