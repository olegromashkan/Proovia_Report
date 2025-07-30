import { useEffect, useState, DragEvent, ChangeEvent, useRef } from 'react';
import Layout from '../components/Layout';
import Icon from '../components/Icon';

interface Trip {
    ID: string;
    Start_Time?: string;
    End_Time?: string;
    Driver1?: string;
    Calendar_Name?: string;
    Order_Value?: string;
}

export default function ScheduleTool() {
    const [itemsLeft, setItemsLeft] = useState<Trip[]>([]);
    const [itemsRight, setItemsRight] = useState<Trip[]>([]);
    const [error, setError] = useState<string | null>(null);
    const leftLoaded = useRef(false);
    const rightLoaded = useRef(false);

    const saveLeft = async (items: Trip[]) => {
        await fetch('/api/schedule-tool', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ trips: items }),
        });
    };

    const saveRight = async (items: Trip[]) => {
        await fetch('/api/schedule-tool2', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ trips: items }),
        });
    };

    const load = async () => {
        try {
            const [lRes, rRes] = await Promise.all([
                fetch('/api/schedule-tool'),
                fetch('/api/schedule-tool2'),
            ]);
            if (!lRes.ok || !rRes.ok) throw new Error('failed');
            const lJson = await lRes.json();
            const rJson = await rRes.json();
            setItemsLeft(lJson);
            setItemsRight(rJson);
        } catch (err) {
            console.error(err);
            setError('Failed to load data');
        }
    };

    useEffect(() => {
        load();
    }, []);

    useEffect(() => {
        if (leftLoaded.current) {
            saveLeft(itemsLeft);
        } else {
            leftLoaded.current = true;
        }
    }, [itemsLeft]);

    useEffect(() => {
        if (rightLoaded.current) {
            saveRight(itemsRight);
        } else {
            rightLoaded.current = true;
        }
    }, [itemsRight]);

    const processFiles = async (files: FileList | null, side: 'left' | 'right') => {
        if (!files || files.length === 0) return;
        const file = files[0];
        try {
            const text = await file.text();
            const parsed = JSON.parse(text);
            let trips: any[] = [];
            if (Array.isArray(parsed)) trips = parsed;
            else if (Array.isArray(parsed.trips)) trips = parsed.trips;
            else if (Array.isArray(parsed.Schedule_Trips)) trips = parsed.Schedule_Trips;
            else if (Array.isArray(parsed.schedule_trips)) trips = parsed.schedule_trips;
            else if (Array.isArray(parsed.scheduleTrips)) trips = parsed.scheduleTrips;
            if (!Array.isArray(trips)) throw new Error('No schedule trips found');
            const res = await fetch(side === 'left' ? '/api/schedule-tool' : '/api/schedule-tool2', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ trips }),
            });
            if (!res.ok) throw new Error('Upload failed');
            load();
        } catch (err) {
            console.error(err);
            setError('Failed to upload file');
        }
    };

    const handleInputLeft = (e: ChangeEvent<HTMLInputElement>) => {
        processFiles(e.target.files, 'left');
        e.target.value = '';
    };
    const handleInputRight = (e: ChangeEvent<HTMLInputElement>) => {
        processFiles(e.target.files, 'right');
        e.target.value = '';
    };

    const handleDropLeft = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        processFiles(e.dataTransfer.files, 'left');
    };
    const handleDropRight = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        processFiles(e.dataTransfer.files, 'right');
    };

    const handleDrag = (e: DragEvent<HTMLDivElement>) => e.preventDefault();

    const clearAllLeft = async () => {
        await fetch('/api/schedule-tool', { method: 'DELETE' });
        setItemsLeft([]);
    };
    const clearAllRight = async () => {
        await fetch('/api/schedule-tool2', { method: 'DELETE' });
        setItemsRight([]);
    };

    return (
        <Layout title="Schedule Tool">
            <div className="w-full min-h-screen p-0 m-0">
                <div className="flex gap-4 w-full min-h-full">
                    <div className="flex-1 min-w-0 flex flex-col">
                        <div className="flex items-center gap-2 mb-2">
                            <div
                                className="flex-1 border-2 border-dashed rounded-md p-3 text-center cursor-pointer bg-white dark:bg-gray-700 dark:border-gray-500 dark:text-gray-200"
                                onDrop={handleDropLeft}
                                onDragOver={handleDrag}
                            >
                                <input id="fileLeft" type="file" accept=".json" onChange={handleInputLeft} className="hidden" />
                                <label htmlFor="fileLeft" className="flex items-center justify-center gap-1 text-sm">
                                    <Icon name="file-arrow-up" className="text-xl" />
                                    JSON
                                </label>
                            </div>
                            <button onClick={clearAllLeft} className="btn btn-error btn-xs w-24">
                                Clear
                            </button>
                        </div>
                        <div className="overflow-auto flex-1 max-h-[calc(100vh-180px)]">
                            <table className="table table-xs table-zebra w-full">
                                <thead>
                                    <tr>
                                        <th>Start</th>
                                        <th>End</th>
                                        <th>Driver</th>
                                        <th>Calendar</th>
                                        <th>Order</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {itemsLeft.map((it, idx) => (
                                        <tr key={it.ID}>
                                            <td>{it.Start_Time}</td>
                                            <td>{it.End_Time}</td>
                                            <td
                                                draggable
                                                onDragStart={(e) => e.dataTransfer.setData('text/plain', JSON.stringify({ table: 'left', index: idx, name: it.Driver1 }))}
                                                onDragOver={(e) => e.preventDefault()}
                                                onDrop={(e) => {
                                                    e.preventDefault();
                                                    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                                                    const name = data.name;
                                                    if (!name) return;
                                                    setItemsLeft((arr) => {
                                                        const copy = [...arr];
                                                        copy[idx] = { ...copy[idx], Driver1: name };
                                                        if (data.table === 'left') {
                                                            copy[data.index] = { ...copy[data.index], Driver1: '' };
                                                        }
                                                        return copy;
                                                    });
                                                    if (data.table === 'right') {
                                                        setItemsRight((arr) => {
                                                            const copy = [...arr];
                                                            copy[data.index] = { ...copy[data.index], Driver1: '' };
                                                            return copy;
                                                        });
                                                    }
                                                }}
                                            >
                                                {it.Driver1}
                                            </td>
                                            <td>{it.Calendar_Name}</td>
                                            <td>{it.Order_Value}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col">
                        <div className="flex items-center gap-2 mb-2">
                            <div
                                className="flex-1 border-2 border-dashed rounded-md p-3 text-center cursor-pointer bg-white dark:bg-gray-700 dark:border-gray-500 dark:text-gray-200"
                                onDrop={handleDropRight}
                                onDragOver={handleDrag}
                            >
                                <input id="fileRight" type="file" accept=".json" onChange={handleInputRight} className="hidden" />
                                <label htmlFor="fileRight" className="flex items-center justify-center gap-1 text-sm">
                                    <Icon name="file-arrow-up" className="text-xl" />
                                    JSON
                                </label>
                            </div>
                            <button onClick={clearAllRight} className="btn btn-error btn-xs w-24">
                                Clear
                            </button>
                        </div>
                        <div className="overflow-auto flex-1 max-h-[calc(100vh-180px)]">
                            <table className="table table-xs table-zebra w-full">
                                <thead>
                                    <tr>
                                        <th>Start</th>
                                        <th>End</th>
                                        <th>Driver</th>
                                        <th>Calendar</th>
                                        <th>Order</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {itemsRight.map((it, idx) => (
                                        <tr key={it.ID}>
                                            <td>{it.Start_Time}</td>
                                            <td>{it.End_Time}</td>
                                            <td
                                                draggable
                                                onDragStart={(e) => e.dataTransfer.setData('text/plain', JSON.stringify({ table: 'right', index: idx, name: it.Driver1 }))}
                                                onDragOver={(e) => e.preventDefault()}
                                                onDrop={(e) => {
                                                    e.preventDefault();
                                                    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                                                    const name = data.name;
                                                    if (!name) return;
                                                    setItemsRight((arr) => {
                                                        const copy = [...arr];
                                                        copy[idx] = { ...copy[idx], Driver1: name };
                                                        if (data.table === 'right') {
                                                            copy[data.index] = { ...copy[data.index], Driver1: '' };
                                                        }
                                                        return copy;
                                                    });
                                                    if (data.table === 'left') {
                                                        setItemsLeft((arr) => {
                                                            const copy = [...arr];
                                                            copy[data.index] = { ...copy[data.index], Driver1: '' };
                                                            return copy;
                                                        });
                                                    }
                                                }}
                                            >
                                                {it.Driver1}
                                            </td>
                                            <td>{it.Calendar_Name}</td>
                                            <td>{it.Order_Value}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                {error && <p className="text-red-600 mt-2 text-sm">{error}</p>}
            </div>
        </Layout>
    );
}