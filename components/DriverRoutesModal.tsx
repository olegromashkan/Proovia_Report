import { useEffect, useState } from 'react';
import Modal from './Modal';

interface Item {
    driver: string;
    date: string;
    route: string;
    start_time?: string | null;
    end_time?: string | null;
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
                    <table className="table table-xs w-full">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Route</th>
                                <th>Start</th>
                                <th>End</th>
                                <th>Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((it, idx) => (
                                <tr key={idx}>
                                    <td>{it.date}</td>
                                    <td>{it.route}</td>
                                    <td>{it.start_time || '-'}</td>
                                    <td>{it.end_time || '-'}</td>
                                    <td>{it.price ?? '-'}</td>
                                </tr>
                            ))}
                            {items.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center py-2">No routes found</td>
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
