import { useEffect, useState, DragEvent, ChangeEvent } from 'react';
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
    const [items, setItems] = useState<Trip[]>([]);
    const [error, setError] = useState<string | null>(null);

    const load = async () => {
        try {
            const res = await fetch('/api/schedule-tool');
            if (!res.ok) throw new Error('failed');
            const json = await res.json();
            setItems(json);
        } catch (err) {
            console.error(err);
            setError('Failed to load data');
        }
    };

    useEffect(() => {
        load();
    }, []);

    const processFiles = async (files: FileList | null) => {
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
            const res = await fetch('/api/schedule-tool', {
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

    const handleInput = (e: ChangeEvent<HTMLInputElement>) => {
        processFiles(e.target.files);
        e.target.value = '';
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        processFiles(e.dataTransfer.files);
    };

    const handleDrag = (e: DragEvent<HTMLDivElement>) => e.preventDefault();

    const clearAll = async () => {
        await fetch('/api/schedule-tool', { method: 'DELETE' });
        setItems([]);
    };

    return (
        <Layout title="Schedule Tool">
            <h1 className="text-2xl font-bold mb-4">Schedule Trips Tool</h1>
            <div
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer bg-white dark:bg-gray-700 dark:border-gray-500 dark:text-gray-200"
                onDrop={handleDrop}
                onDragOver={handleDrag}
            >
                <input id="file" type="file" accept=".json" onChange={handleInput} className="hidden" />
                <label htmlFor="file" className="flex flex-col items-center gap-2">
                    <Icon name="file-arrow-up" className="text-3xl" />
                    <span>Drag schedule trips JSON here or click to select</span>
                </label>
            </div>
            {error && <p className="text-red-600 mt-2">{error}</p>}
            <button onClick={clearAll} className="btn btn-error mt-4">
                Clear All
            </button>
            <div className="overflow-auto mt-6">
                <table className="table table-sm table-zebra">
                    <thead>
                        <tr>
                            <th>Start_Time</th>
                            <th>End_Time</th>
                            <th>Driver1</th>
                            <th>Calendar_Name</th>
                            <th>Order_Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((it) => (
                            <tr key={it.ID}>
                                <td>{it.Start_Time}</td>
                                <td>{it.End_Time}</td>
                                <td>{it.Driver1}</td>
                                <td>{it.Calendar_Name}</td>
                                <td>{it.Order_Value}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Layout>
    );
}
