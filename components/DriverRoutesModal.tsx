import { useEffect, useState } from 'react';
import Modal from './Modal';
import { getActualEnd, getRoute, getRouteColorClass } from '../lib/scheduleUtils';
import { RouteGroup } from '../types/schedule';

interface Item {
    driver: string;
    date: string;
    route?: string;
    calendar: string;
    start_time?: string | null;
    end_time?: string | null;
    punctuality?: number | null;
    price?: number | string;
}

interface DriverRoutesModalProps {
    open: boolean;
    onClose: () => void;
    driver: string;
}

function formatDate(d: Date): string {
    return d.toISOString().slice(0, 10);
}

const DEFAULT_ROUTE_GROUPS: RouteGroup[] = [
    { name: '2DT', codes: ['EDINBURGH', 'GLASGOW', 'INVERNESS', 'ABERDEEN', 'EX+TR', 'TQ+PL'], isFull: true, color: 'text-gray-400' },
    { name: 'London', codes: ['WD', 'HA', 'UB', 'TW', 'KT', 'CR', 'BR', 'DA', 'RM', 'IG', 'EN', 'SM', 'W', 'NW', 'N', 'E', 'EC', 'SE', 'WC'], isFull: false, color: 'text-purple-500' },
    { name: 'Wales', codes: ['LL', 'SY', 'SA'], isFull: false, color: 'text-yellow-500' },
    { name: 'North', codes: ['LA', 'CA', 'NE', 'DL', 'DH', 'SR', 'TS', 'HG', 'YO', 'HU', 'BD'], isFull: false, color: 'text-red-500' },
    { name: 'East Midlands', codes: ['NR', 'IP', 'CO'], isFull: false, color: 'text-blue-500' },
    { name: 'South East', codes: ['ME', 'CT', 'TN', 'RH', 'BN', 'GU', 'PO', 'SO'], isFull: false, color: 'text-green-500' },
    { name: 'South West', codes: ['SP', 'BH', 'DT', 'TA', 'EX', 'TQ', 'PL', 'TR'], isFull: false, color: 'text-pink-500' },
    { name: 'West Midlands', codes: ['ST', 'TF', 'WV', 'DY', 'HR', 'WR', 'B', 'WS', 'CV', 'NN'], isFull: false, color: 'text-teal-300' },
];

function priceTextColor(val?: number | string) {
    const num = Number(val);
    if (isNaN(num)) return 'inherit';
    const min = 500;
    const mid = 650;
    const high = 800;
    const max = 950;
    let hue: number;
    if (num <= min) {
        hue = 50;
    } else if (num <= mid) {
        const ratio = (num - min) / (mid - min);
        hue = 0 + ratio * 60;
    } else if (num <= high) {
        const ratio = (num - mid) / (high - mid);
        hue = 60 + ratio * 60;
    } else if (num <= max) {
        const ratio = (num - high) / (max - high);
        hue = 120 + ratio * 90;
    } else {
        hue = 210;
    }
    const lightness = 40;
    const saturation = 100;
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

function stylePunctuality(val: number | null) {
    if (val === null) return <span className="text-gray-400">-</span>;
    if (val > 90) return <span className="text-red-600 font-semibold">{val}</span>;
    if (val > 45) return <span className="text-yellow-600 font-medium">{val}</span>;
    return <span className="text-green-600 font-medium">{val}</span>;
}

export default function DriverRoutesModal({ open, onClose, driver }: DriverRoutesModalProps) {
    const [start, setStart] = useState('');
    const [end, setEnd] = useState('');
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!open) return;
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const params = new URLSearchParams();
                if (start) params.append('start', start);
                if (end) params.append('end', end);
                const res = await fetch(`/api/driver-routes?${params}`);
                if (!res.ok) throw new Error('Failed to load routes');
                const data = await res.json();
                const all = (data.items || []) as Item[];
                const filtered = all.filter(it => it.driver.trim().toLowerCase() === driver.trim().toLowerCase());
                // sort by date descending
                const sorted = filtered.sort((a, b) => (a.date < b.date ? 1 : -1));
                setItems(sorted);
            } catch (err) {
                setError('Failed to load routes');
                setItems([]);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [open, start, end, driver]);

    return (
        <Modal open={open} onClose={onClose} className="w-11/12 max-w-5xl">
            <div className="w-full">
                <h3 className="font-bold text-xl mb-4">Previous Routes - {driver}</h3>
                <div className="flex gap-4 mb-4">
                    <label className="flex items-center gap-2">
                        <span className="text-sm font-medium">Start:</span>
                        <input
                            type="date"
                            className="input input-sm border border-gray-300 rounded px-3 py-1"
                            value={start}
                            onChange={e => setStart(e.target.value)}
                        />
                    </label>
                    <label className="flex items-center gap-2">
                        <span className="text-sm font-medium">End:</span>
                        <input
                            type="date"
                            className="input input-sm border border-gray-300 rounded px-3 py-1"
                            value={end}
                            onChange={e => setEnd(e.target.value)}
                        />
                    </label>
                </div>
                {error && <div className="text-red-500 mb-4 p-2 bg-red-50 border border-red-200 rounded">{error}</div>}
                {loading ? (
                    <div className="flex items-center justify-center p-8">
                        <div className="loading loading-spinner loading-lg"></div>
                    </div>
                ) : (
                    <div className="overflow-auto" style={{ maxHeight: '60vh' }}>
                        <table className="table table-sm w-full">
                            <thead className="sticky top-0 bg-base-200">
                                <tr>
                                    <th className="text-left p-3">Date</th>
                                    <th className="text-left p-3">Route</th>
                                    <th className="text-left p-3">Start Time</th>
                                    <th className="text-left p-3">Actual End</th>
                                    <th className="text-left p-3">Punctuality</th>
                                    <th className="text-left p-3">Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((it, idx) => {
                                    const actualEnd = getActualEnd(
                                        it.end_time ? `${it.date}T${it.end_time}` : undefined,
                                        String(it.punctuality ?? '0')
                                    );
                                    const route = getRoute(it.calendar);
                                    return (
                                        <tr key={idx} className="hover:bg-base-50">
                                            <td className="p-3">{it.date}</td>
                                            <td className={`p-3 ${getRouteColorClass(it.calendar, DEFAULT_ROUTE_GROUPS)}`}>
                                                {route || '-'}
                                            </td>
                                            <td className="p-3">{it.start_time || '-'}</td>
                                            <td className="p-3">{actualEnd || '-'}</td>
                                            <td className="p-3">{stylePunctuality(it.punctuality ?? null)}</td>
                                            <td className="p-3" style={{ color: priceTextColor(it.price) }}>
                                                {it.price !== undefined && it.price !== null ? `£${it.price}` : '-'}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {items.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="text-center py-8 text-gray-500">
                                            No routes found for the selected period
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
                <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-200">
                    <button className="btn btn-primary" onClick={onClose}>Close</button>
                </div>
            </div>
        </Modal>
    );
}