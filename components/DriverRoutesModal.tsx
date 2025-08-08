import { useEffect, useState } from 'react';
import Modal from './Modal';
import { getActualEnd } from '../lib/scheduleUtils';

interface Item {
    driver: string;
    date: string;
    route: string;
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

function getRouteColorClass(route: string): string {
    const upper = route.toUpperCase();
    const grey = ['EDINBURGH', 'GLASGOW', 'INVERNESS', 'ABERDEEN', 'EX+TR', 'TQ+PL'];
    if (grey.includes(upper)) return 'text-gray-400';
    const parts = upper.split('+');
    const has = (arr: string[]) => parts.some(p => arr.includes(p));
    const purple = ['WD', 'HA', 'UB', 'TW', 'KT', 'CR', 'BR', 'DA', 'RM', 'IG', 'EN', 'SM', 'W', 'NW', 'N', 'E', 'EC', 'SE', 'WC'];
    if (has(purple)) return 'text-purple-500';
    const yellow = ['LL', 'SY', 'SA'];
    if (has(yellow)) return 'text-yellow-500';
    const red = ['LA', 'CA', 'NE', 'DL', 'DH', 'SR', 'TS', 'HG', 'YO', 'HU', 'BD'];
    if (has(red)) return 'text-red-500';
    const blue = ['NR', 'IP', 'CO'];
    if (has(blue)) return 'text-blue-500';
    const green = ['ME', 'CT', 'TN', 'RH', 'BN', 'GU', 'PO', 'SO'];
    if (has(green)) return 'text-green-500';
    const pink = ['SP', 'BH', 'DT', 'TA', 'EX', 'TQ', 'PL', 'TR'];
    if (has(pink)) return 'text-pink-500';
    const light = ['ST', 'TF', 'WV', 'DY', 'HR', 'WR', 'B', 'WS', 'CV', 'NN'];
    if (has(light)) return 'text-teal-300';
    return 'text-white';
}

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
    const today = new Date();
    const sevenAgoDate = new Date();
    sevenAgoDate.setDate(today.getDate() - 6);
    const [start, setStart] = useState(formatDate(sevenAgoDate));
    const [end, setEnd] = useState(formatDate(today));
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            const t = new Date();
            const s = new Date();
            s.setDate(t.getDate() - 6);
            setStart(formatDate(s));
            setEnd(formatDate(t));
        }
    }, [open, driver]);

    useEffect(() => {
        if (!open) return;
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const params = new URLSearchParams({ start, end }).toString();
                const res = await fetch(`/api/driver-routes?${params}`);
                if (!res.ok) throw new Error('Failed to load routes');
                const data = await res.json();
                const all = (data.items || []) as Item[];
                const filtered = all.filter(it => it.driver.trim().toLowerCase() === driver.trim().toLowerCase());
                // sort by date descending then take latest 7
                const sorted = filtered.sort((a, b) => (a.date < b.date ? 1 : -1));
                setItems(sorted.slice(0, 7));
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
        <Modal open={open} onClose={onClose}>
            <h3 className="font-bold text-lg mb-2">Previous Routes - {driver}</h3>
            <div className="flex gap-2 mb-2">
                <label className="flex items-center gap-1">
                    <span>Start:</span>
                    <input type="date" className="input input-xs" value={start} onChange={e => setStart(e.target.value)} />
                </label>
                <label className="flex items-center gap-1">
                    <span>End:</span>
                    <input type="date" className="input input-xs" value={end} onChange={e => setEnd(e.target.value)} />
                </label>
            </div>
            {error && <div className="text-red-500 mb-2">{error}</div>}
            {loading ? (
                <div className="flex items-center justify-center p-4">
                    <div className="loading loading-spinner"></div>
                </div>
            ) : (
                <div className="overflow-auto max-h-96">
                    <table className="table table-xs table-zebra w-full text-xs">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Route</th>
                                <th>Start</th>
                                <th>Actual End</th>
                                <th>Punctuality</th>
                                <th>Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((it, idx) => {
                                const actualEnd = getActualEnd(
                                    it.end_time ? `${it.date}T${it.end_time}` : undefined,
                                    String(it.punctuality ?? '0')
                                );
                                return (
                                    <tr key={idx}>
                                        <td>{it.date}</td>
                                        <td className={getRouteColorClass(it.route)}>{it.route}</td>
                                        <td>{it.start_time || '-'}</td>
                                        <td>{actualEnd || '-'}</td>
                                        <td>{stylePunctuality(it.punctuality ?? null)}</td>
                                        <td className={`text-[color:${priceTextColor(it.price)}]`}>
                                            {it.price !== undefined && it.price !== null ? `£${it.price}` : '-'}
                                        </td>
                                    </tr>
                                );
                            })}
                            {items.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-center py-2">No routes found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
            <div className="modal-action">
                <button className="btn" onClick={onClose}>Close</button>
            </div>
        </Modal>
    );
}
