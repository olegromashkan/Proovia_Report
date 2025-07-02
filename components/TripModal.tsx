import { useEffect, useRef, useMemo } from 'react';
import Modal from './Modal';
import Icon from './Icon';
import { getFailureReason } from '../lib/failureReason';

interface Trip {
  ID: string;
  [key: string]: any;
}

interface Props {
  trip: Trip | null;
  onClose: () => void;
  allTrips: Trip[];
}

const geoCache = new Map<string, { lat: number; lon: number }>();

function parseMinutes(str: string | undefined): number {
  if (!str) return 0;
  const time = str.split(' ')[1] || str;
  const [h = '0', m = '0', s = '0'] = time.split(':');
  return Number(h) * 60 + Number(m) + Number(s) / 60;
}

export default function TripModal({ trip, onClose, allTrips }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<any>(null);

  const { driver, punctuality, status, statusColor, statusIcon } = useMemo(() => {
    if (!trip) return {};
    const driverName = trip['Trip.Driver1'] || trip['Driver'];
    const arrival = parseMinutes(trip.Arrival_Time || trip['Arrival_Time']);
    const done = parseMinutes(trip.Time_Completed || trip['Time_Completed']);
    const punctualityValue = arrival && done ? Math.round(done - arrival) : null;
    const tripStatus = trip.Status;
    
    return {
      driver: driverName,
      punctuality: punctualityValue,
      status: tripStatus,
      statusColor: tripStatus === 'Complete' ? 'text-success' : tripStatus === 'Failed' ? 'text-error' : 'text-warning',
      statusIcon: tripStatus === 'Complete' ? 'check' : tripStatus === 'Failed' ? 'ban' : 'clock'
    };
  }, [trip]);
  
  useEffect(() => {
    if (!trip || !mapRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    mapRef.current.innerHTML = '';
    const map = L.map(mapRef.current, { zoomControl: false }).setView([51.505, -0.09], 13);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap contributors © CARTO'
    }).addTo(map);

    const postcode = trip['Address.Postcode'];
    if (!postcode) return;

    const useCachedCoords = (coords: { lat: number; lon: number }) => {
        map.setView([coords.lat, coords.lon], 13);
        L.marker([coords.lat, coords.lon]).addTo(map);
    };

    if (geoCache.has(postcode)) {
        useCachedCoords(geoCache.get(postcode)!);
    } else {
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${postcode}`)
          .then((r) => r.json())
          .then((data) => {
            if (data && data.length > 0) {
              const { lat, lon } = data[0];
              const coords = { lat: parseFloat(lat), lon: parseFloat(lon) };
              geoCache.set(postcode, coords);
              useCachedCoords(coords);
            }
          }).catch(console.error);
    }
  }, [trip]);
  
  useEffect(() => {
    if (!trip || !chartRef.current) return;
    const Chart = (window as any).Chart;
    if (!Chart) return;
    
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const driverTrips = allTrips.filter(t => (t['Trip.Driver1'] || t['Driver']) === driver);
    const labels = driverTrips.map(t => `#${t['Order.OrderNumber']}`);
    const data = driverTrips.map(t => {
      const a = parseMinutes(t.Arrival_Time || t['Arrival_Time']);
      const d = parseMinutes(t.Time_Completed || t['Time_Completed']);
      return a && d ? d - a : 0;
    });

    chartInstanceRef.current = new Chart(chartRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: `Punctuality (min) for ${driver}`,
            data,
            borderColor: '#b53133',
            tension: 0.1,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          decimation: {
            enabled: true,
            algorithm: 'lttb',
            samples: 50,
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [trip, allTrips, driver]);

  if (!trip) return null;

  const orderNumber = trip['Order.OrderNumber'];
  const postcode = trip['Address.Postcode'];
  const geoCoords = postcode ? geoCache.get(postcode) : null;
  
  const InfoItem = ({ icon, label, value, action, className }: { icon: string, label: string, value?: React.ReactNode, action?: React.ReactNode, className?: string }) => (
    <div className={className}>
        <div className="text-xs text-base-content/60 flex items-center gap-1.5 mb-1">
            <Icon name={icon} /> {label}
        </div>
        <div className="font-semibold text-base-content flex items-center justify-between min-h-[2rem]">
            <span className="truncate">{value || 'N/A'}</span> {action}
        </div>
    </div>
  );

  return (
    <Modal open={!!trip} onClose={onClose} className="w-11/12 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
                    <div className="flex justify-between items-center">
                        <h2 className="card-title text-primary text-2xl">#{orderNumber}</h2>
                        <div className={`badge ${statusColor.replace('text-', 'badge-')} badge-lg badge-outline`}>{status}</div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                        <button onClick={() => navigator.clipboard.writeText(orderNumber)} className="px-2 py-1 text-xs rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-1"><Icon name="copy"/> Copy Order #</button>
                        <a href={`https://crm.proovia.uk/event-stream/order?search=${orderNumber}`} target="_blank" rel="noopener noreferrer" className="px-2 py-1 text-xs rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-1"><Icon name="upload"/> Photos</a>
                        <a href={`https://creatorapp.zoho.eu/dragrusu/copy-of-steeltrans-new/#Report:Copy_of_Tomorrow_trips?Order.OrderNumber=${orderNumber}`} target="_blank" rel="noopener noreferrer" className="px-2 py-1 text-xs rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-1"><Icon name="database"/> Zoho</a>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
                    <h3 className="text-md font-bold mb-2">Key Info</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <InfoItem icon="user-cog" label="Driver" value={driver} />
                        <InfoItem icon="up-right-from-square" label="Vehicle" value={trip['Vehicle.Reg']} />
                        <InfoItem icon="clock" label="Punctuality" value={punctuality !== null ? `${punctuality} min` : 'N/A'} />
                        <InfoItem icon="up-right-from-square" label="Auction" value={trip['Order.Auction']} />
                        {trip.Status === 'Failed' && (
                          <InfoItem
                            icon="triangle-exclamation"
                            label="Fail Reason"
                            value={getFailureReason(trip.Notes)}
                          />
                        )}
                    </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
                    <h3 className="text-md font-bold mb-2">Delivery</h3>
                    <div ref={mapRef} className="h-40 w-full rounded-2xl bg-gray-200 dark:bg-gray-700 shadow" />
                    {geoCoords && <a href={`https://www.google.com/maps?q=${geoCoords.lat},${geoCoords.lon}`} target="_blank" rel="noopener noreferrer" className="mt-2 w-full inline-block text-center px-4 py-2 text-sm bg-[#b53133] text-white rounded-md hover:bg-[#a12b2e]">Open in Google Maps</a>}
                </div>
            </div>
            
            <div className="lg:col-span-2 space-y-4">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
                    <h3 className="text-md font-bold mb-2">Route Details</h3>
                    <div className="grid sm:grid-cols-2 gap-x-4 gap-y-3">
                        <InfoItem icon="up-right-from-square" label="Start Location" value={trip['Trip.Start_Location']} />
                        <InfoItem icon="calendar" label="Start Time" value={trip['Trip.Start_Time']} />
                        <InfoItem icon="up-right-from-square" label="End Location" value={trip['Trip.End_Location']} />
                        <InfoItem icon="calendar" label="Arrival Time" value={trip.Arrival_Time} />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
                     <h3 className="text-md font-bold mb-2">Customer & Payment</h3>
                    <div className="grid sm:grid-cols-2 gap-x-4 gap-y-3">
                        <InfoItem icon="user-cog" label="Customer Name" value={trip['Customer.Full_Name']} />
                        <InfoItem icon="up-right-from-square" label="Postcode" value={postcode} />
                        <InfoItem icon="up-right-from-square" label="Payment Type" value={trip['Payment.Type']} />
                        <InfoItem icon="up-right-from-square" label="Price" value={trip['Order.Price'] ? `£${trip['Order.Price']}`: 'N/A'} />
                    </div>
                </div>
                
                 <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
                    <h3 className="text-md font-bold mb-2">Driver Performance Chart</h3>
                    <div className="h-48 relative"><canvas ref={chartRef} /></div>
                </div>
            </div>
        </div>
    </Modal>
  );
}