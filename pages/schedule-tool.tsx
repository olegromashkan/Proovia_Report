import { useEffect, useState, DragEvent, ChangeEvent, useRef, KeyboardEvent, useMemo } from 'react';
import Layout from '../components/Layout';
import Icon from '../components/Icon';
import { parseTimeToMinutes } from '../lib/timeUtils';

interface Trip {
    ID: string;
    Start_Time?: string;
    End_Time?: string;
    Driver1?: string;
    Contractor?: string;
    Punctuality?: string;
    Calendar_Name?: string;
    Order_Value?: string;
    isAssigned?: boolean;
    fromLeftIndex?: number; // For right trips, to track origin in left
}

const IGNORED_CALENDAR_PATTERNS = [
    'every 2nd day north',
    'everyday',
    'every 2nd south-west',
    'every 2nd day south',
];

const filterIgnored = <T extends { Calendar_Name?: string }>(items: T[]) =>
    items.filter(
        (it) =>
            !IGNORED_CALENDAR_PATTERNS.some((pat) =>
                (it.Calendar_Name || '').toLowerCase().includes(pat)
            )
    );

export default function ScheduleTool() {
    const [itemsLeft, setItemsLeft] = useState<Trip[]>([]);
    const [itemsRight, setItemsRight] = useState<Trip[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [notification, setNotification] = useState<string | null>(null);
    const [warningModal, setWarningModal] = useState<{ action: () => void } | null>(null);
    const leftLoaded = useRef(false);
    const rightLoaded = useRef(false);
    const PANELS = [
        { name: 'Newbie', color: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700 text-green-700 dark:text-green-300' },
        { name: 'Mechanic', color: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300' },
        { name: 'Loading 2DT', color: 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700 text-orange-700 dark:text-orange-300' },
        { name: 'Trainers', color: 'bg-pink-50 dark:bg-pink-900/30 border-pink-200 dark:border-pink-700 text-pink-700 dark:text-pink-300' },
        { name: 'Agreements', color: 'bg-yellow-50 dark:bg-green-900/30 border-yellow-200 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300' },
        { name: 'Return 2DT', color: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700 text-red-700 dark:text-red-300' },
        { name: 'OFF/STB', color: 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300' },
        { name: 'Available Drivers', color: 'bg-gray-50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300' },
    ];
    const [notes, setNotes] = useState<Record<string, string>>({});
    const [editingRightIndex, setEditingRightIndex] = useState<number | null>(null);
    const [editValue, setEditValue] = useState<string>('');
    const [sortLeft, setSortLeft] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null);
    const [sortRight, setSortRight] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null);

    const updateLeft = (updater: (arr: Trip[]) => Trip[]) => {
        setItemsLeft((arr) => {
            const updated = updater(arr);
            if (leftLoaded.current) saveLeft(updated);
            return updated;
        });
    };

    const updateRight = (updater: (arr: Trip[]) => Trip[]) => {
        setItemsRight((arr) => {
            const updated = updater(arr);
            if (rightLoaded.current) saveRight(updated);
            return updated;
        });
    };

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

    const loadNotes = async () => {
        try {
            const res = await fetch('/api/schedule-notes');
            if (!res.ok) throw new Error('failed');
            const data = await res.json();
            setNotes(data);
        } catch (err) {
            console.error(err);
        }
    };

    const saveNote = async (panel: string, content: string) => {
        await fetch('/api/schedule-notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ panel, content }),
        });
    };

    const clearNote = async (panel: string) => {
        await fetch(`/api/schedule-notes?panel=${encodeURIComponent(panel)}`, {
            method: 'DELETE',
        });
        setNotes((n) => ({ ...n, [panel]: '' }));
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
            updateLeft(() => sortItems(filterIgnored(lJson)));
            updateRight(() => filterIgnored(rJson));
        } catch (err) {
            console.error(err);
            setError('Failed to load data');
        }
    };

    useEffect(() => {
        load();
        loadNotes();
    }, []);

    useEffect(() => {
        leftLoaded.current = true;
        rightLoaded.current = true;
    }, []);

    const processFile = async (files: FileList | null) => {
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

            trips = filterIgnored(trips);

            const byDate: Record<string, any[]> = {};
            trips.forEach(t => {
                const d = t.Date_field;
                if (!d) return;
                if (!byDate[d]) byDate[d] = [];
                byDate[d].push(t);
            });
            const dates = Object.keys(byDate).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
            const leftTrips = dates[0] ? byDate[dates[0]] : [];
            const rightTrips = dates[1] ? byDate[dates[1]] : [];

            const [lRes, rRes] = await Promise.all([
                fetch('/api/schedule-tool', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ trips: leftTrips, preserveDrivers: true }),
                }),
                fetch('/api/schedule-tool2', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ trips: rightTrips, preserveDrivers: true }),
                }),
            ]);
            if (!lRes.ok || !rRes.ok) throw new Error('Upload failed');
            load();
        } catch (err) {
            console.error(err);
            setError('Failed to upload file');
        }
    };

    const handleNoteChange = (panel: string, value: string) => {
        setNotes((n) => ({ ...n, [panel]: value }));
        saveNote(panel, value);
        // Re-sort itemsLeft when Available Drivers note changes
        if (panel === 'Available Drivers') {
            updateLeft(() => sortItems(itemsLeft));
        }
    };

    const handleInputFile = (e: ChangeEvent<HTMLInputElement>) => {
        processFile(e.target.files);
        e.target.value = '';
    };
    const handleDropFile = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        processFile(e.dataTransfer.files);
    };


    const clearAllLeft = async () => {
        await fetch('/api/schedule-tool', { method: 'DELETE' });
        setItemsLeft([]);
    };
    const clearAllRight = async () => {
        await fetch('/api/schedule-tool2', { method: 'DELETE' });
        setItemsRight([]);
    };

    const applyLeftSort = (key: string) => {
        const dir: 'asc' | 'desc' = sortLeft && sortLeft.key === key && sortLeft.dir === 'asc' ? 'desc' : 'asc';
        setSortLeft({ key, dir });
        updateLeft((arr) => {
            const oldIndex: Record<string, number> = {};
            arr.forEach((it, idx) => { if (it.ID) oldIndex[it.ID] = idx; });
            const sorted = sortBy(arr, key, dir, true);
            const newIndex: Record<string, number> = {};
            sorted.forEach((it, idx) => { if (it.ID) newIndex[it.ID] = idx; });
            updateRight((rArr) => rArr.map(r => {
                if (r.fromLeftIndex !== undefined) {
                    const leftItem = arr[r.fromLeftIndex];
                    if (leftItem && leftItem.ID && newIndex[leftItem.ID] !== undefined) {
                        return { ...r, fromLeftIndex: newIndex[leftItem.ID] };
                    }
                }
                return r;
            }));
            return sorted;
        });
    };

    const applyRightSort = (key: string) => {
        const dir: 'asc' | 'desc' = sortRight && sortRight.key === key && sortRight.dir === 'asc' ? 'desc' : 'asc';
        setSortRight({ key, dir });
        updateRight((arr) => sortBy(arr, key, dir));
    };

    // Helper function to extract text after the first space
    const getTextAfterSpace = (text?: string) => {
        if (!text) return '';
        const index = text.indexOf(' ');
        return index !== -1 ? text.substring(index + 1) : text;
    };

    // Helper to parse HH:mm or similar time strings into minutes
    const parseTime = (time?: string): number => {
        if (!time) return NaN;
        const minutes = parseTimeToMinutes(getTextAfterSpace(time));
        return minutes === null ? NaN : minutes;
    };

    // Helper to compute Actual End time = End_Time plus Punctuality minutes
    const getActualEnd = (endTime?: string, punctuality?: string) => {
        if (!endTime) return '';
        const endDate = new Date(endTime);
        if (isNaN(endDate.getTime())) return '';
        const mins = parseInt(punctuality || '0', 10);
        const actual = new Date(endDate.getTime() + (isNaN(mins) ? 0 : mins) * 60000);
        return actual.toTimeString().slice(0, 5);
    };

    // Helper function to extract Calendar: after ":" up to "("
    const getCalendar = (text?: string) => {
        if (!text) return '';
        const colonIndex = text.indexOf(':');
        if (colonIndex === -1) return '';
        const parenIndex = text.indexOf('(', colonIndex);
        if (parenIndex === -1) return text.substring(colonIndex + 1).trim();
        return text.substring(colonIndex + 1, parenIndex).trim();
    };

    // Helper function to get Route: just getCalendar
    const getRoute = (text?: string) => {
        return getCalendar(text);
    };

    // Helper function to extract Tasks: after "(" up to ")"
    const getTasks = (text?: string) => {
        if (!text) return '';
        const openParen = text.indexOf('(');
        if (openParen === -1) return '';
        const closeParen = text.indexOf(')', openParen);
        if (closeParen === -1) return text.substring(openParen + 1).trim();
        return text.substring(openParen + 1, closeParen).trim();
    };

    // Helper function to extract VH: after "-" up to next "-"
    const getVH = (text?: string) => {
        if (!text) return '';
        const firstDash = text.indexOf('-');
        if (firstDash === -1) return '';
        const secondDash = text.indexOf('-', firstDash + 1);
        if (secondDash === -1) return text.substring(firstDash + 1).trim();
        return text.substring(firstDash + 1, secondDash).trim();
    };

    const specialCodes = new Set(['LA', 'EX', 'CA', 'TQ', 'NE', 'ME', 'CT', 'SA', 'NR']);

    // Helper function to check if route has special code
    const hasSpecialCode = (calendarName?: string) => {
        const calendar = getCalendar(calendarName);
        if (!calendar) return false;
        if (calendar.includes('EX+TR')) return false;
        const parts = calendar.split('+');
        return parts.some(part => specialCodes.has(part.trim()));
    };

    // Helper function to get color class for driver based on notes
    const getDriverColor = (driverName: string | undefined) => {
        if (!driverName) return '';
        for (const panel of PANELS) {
            if (panel.name !== 'Available Drivers' && notes[panel.name]?.includes(driverName)) {
                return panel.color;
            }
        }
        return '';
    };

    // Helper function to get color class for route
    const getRouteColorClass = (route?: string): string => {
        if (!route) return 'text-white';
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
    };

    const categories = [
        { name: '2DT', codes: ['EDINBURGH', 'GLASGOW', 'INVERNESS', 'ABERDEEN', 'EX+TR', 'TQ+PL'], isFull: true, color: 'text-gray-400' },
        { name: 'London', codes: ['WD', 'HA', 'UB', 'TW', 'KT', 'CR', 'BR', 'DA', 'RM', 'IG', 'EN', 'SM', 'W', 'NW', 'N', 'E', 'EC', 'SE', 'WC'], isFull: false, color: 'text-purple-500' },
        { name: 'Wales', codes: ['LL', 'SY', 'SA'], isFull: false, color: 'text-yellow-500' },
        { name: 'North', codes: ['LA', 'CA', 'NE', 'DL', 'DH', 'SR', 'TS', 'HG', 'YO', 'HU', 'BD'], isFull: false, color: 'text-red-500' },
        { name: 'East Midlands', codes: ['NR', 'IP', 'CO'], isFull: false, color: 'text-blue-500' },
        { name: 'South East', codes: ['ME', 'CT', 'TN', 'RH', 'BN', 'GU', 'PO', 'SO'], isFull: false, color: 'text-green-500' },
        { name: 'South West', codes: ['SP', 'BH', 'DT', 'TA', 'EX', 'TQ', 'PL', 'TR'], isFull: false, color: 'text-pink-500' },
        { name: 'West Midlands', codes: ['ST', 'TF', 'WV', 'DY', 'HR', 'WR', 'B', 'WS', 'CV', 'NN'], isFull: false, color: 'text-teal-300' },
    ];

    const getCategory = (route: string): string => {
        const upper = route.toUpperCase();
        for (const cat of categories) {
            if (cat.isFull) {
                if (cat.codes.includes(upper)) return cat.name;
            } else {
                const parts = upper.split('+').map(p => p.trim());
                if (parts.some(p => cat.codes.includes(p))) return cat.name;
            }
        }
        return 'Other';
    };

    const computeStats = (items: Trip[]) => {
        const counts: Record<string, number> = {};
        let total = 0;
        items.forEach(it => {
            const route = getRoute(it.Calendar_Name);
            const cat = getCategory(route);
            counts[cat] = (counts[cat] || 0) + 1;
            total++;
        });
        return { counts, total };
    };

    const sortItems = (items: Trip[]): Trip[] => {
        const allowedDrivers = (notes['Available Drivers'] || '').split('\n').map(d => d.trim()).filter(d => d);
        return [...items].sort((a, b) => {
            const aIsAllowed = allowedDrivers.includes(a.Driver1 || '');
            const bIsAllowed = allowedDrivers.includes(b.Driver1 || '');
            if (aIsAllowed && !bIsAllowed) return -1;
            if (!aIsAllowed && bIsAllowed) return 1;
            return 0; // Maintain relative order within allowed and non-allowed groups
        });
    };

    const sortBy = (arr: Trip[], key: string, dir: 'asc' | 'desc', isLeft = false): Trip[] => {
        const allowedDrivers = (notes['Available Drivers'] || '')
            .split('\n')
            .map(d => d.trim())
            .filter(d => d);

        const getValue = (it: Trip): any => {
            switch (key) {
                case 'Start':
                    return parseTime(it.Start_Time);
                case 'End':
                    return parseTime(it.End_Time);
                case 'ActualEnd':
                    return parseTime(getActualEnd(it.End_Time, it.Punctuality));
                case 'Driver1':
                    return (it.Driver1 || '').toLowerCase();
                case 'Contractor':
                    return (it.Contractor || '').toLowerCase();
                case 'VH':
                    return getVH(it.Calendar_Name).toLowerCase();
                case 'Route':
                    return getRoute(it.Calendar_Name).toLowerCase();
                case 'Tasks':
                    return parseFloat(getTasks(it.Calendar_Name) || '0');
                case 'Order_Value':
                    return parseFloat(it.Order_Value || '0');
                case 'Punctuality':
                    return parseFloat(it.Punctuality || '0');
                default:
                    return (it as any)[key];
            }
        };

        return [...arr].sort((a, b) => {
            if (isLeft) {
                const aIsAllowed = allowedDrivers.includes(a.Driver1 || '');
                const bIsAllowed = allowedDrivers.includes(b.Driver1 || '');
                if (aIsAllowed && !bIsAllowed) return -1;
                if (!aIsAllowed && bIsAllowed) return 1;
            }
            const va = getValue(a);
            const vb = getValue(b);

            if (typeof va === 'number' && typeof vb === 'number') {
                if (isNaN(va) && isNaN(vb)) return 0;
                if (isNaN(va)) return dir === 'asc' ? 1 : -1;
                if (isNaN(vb)) return dir === 'asc' ? -1 : 1;
                return dir === 'asc' ? va - vb : vb - va;
            }

            const sva = String(va);
            const svb = String(vb);
            if (sva < svb) return dir === 'asc' ? -1 : 1;
            if (sva > svb) return dir === 'asc' ? 1 : -1;
            return 0;
        });
    };

    const leftStats = computeStats(itemsLeft);
    const rightStats = computeStats(itemsRight);

    const amountRangeLeft = useMemo(() => {
        const vals = itemsLeft.map(it => parseFloat(it.Order_Value || '0')).filter(v => !isNaN(v));
        if (vals.length === 0) return { min: 0, max: 0 };
        return { min: Math.min(...vals), max: Math.max(...vals) };
    }, [itemsLeft]);

    const amountRangeRight = useMemo(() => {
        const vals = itemsRight.map(it => parseFloat(it.Order_Value || '0')).filter(v => !isNaN(v));
        if (vals.length === 0) return { min: 0, max: 0 };
        return { min: Math.min(...vals), max: Math.max(...vals) };
    }, [itemsRight]);

    const getAmountColor = (val: string | undefined, range: { min: number; max: number }) => {
        const num = parseFloat(val || '');
        if (isNaN(num)) return 'text-gray-500'; // Default color for invalid values
        const ratio = range.max === range.min ? 0 : (num - range.min) / (range.max - range.min);
        const hue = 0 + ratio * 120; // Red (0) to Green (120)
        return `hsl(${hue}, 70%, 50%)`; // Suitable for text color
    };

    const renderStats = (stats: { counts: Record<string, number>, total: number }) => (
        <div className="text-xs mb-2 flex flex-wrap gap-2">
            {categories.map(cat => (
                <span
                    key={cat.name}
                    className={`px-2 py-1 rounded-full ${cat.color} bg-opacity-20 ${cat.color.replace('text-', 'bg-')} font-semibold`}
                >
                    {cat.name}: {stats.counts[cat.name] || 0}
                </span>
            ))}
            <span
                className="px-2 py-1 rounded-full text-white bg-opacity-20 bg-gray-500 font-semibold"
            >
                Other: {stats.counts['Other'] || 0}
            </span>
            <span
                className="px-2 py-1 rounded-full text-white bg-opacity-20 bg-gray-700 font-semibold"
            >
                Total: {stats.total}
            </span>

        </div>
    );

    const handleUndo = (leftIdx: number) => {
        updateRight((arr) => {
            const copy = [...arr];
            const rightIdx = copy.findIndex((item) => item.fromLeftIndex === leftIdx);
            if (rightIdx !== -1) {
                copy[rightIdx] = { ...copy[rightIdx], Driver1: '', fromLeftIndex: undefined };
            }
            return copy;
        });
        updateLeft((arr) => {
            const copy = [...arr];
            copy[leftIdx] = { ...copy[leftIdx], isAssigned: false };
            return sortItems(copy);
        });
    };

    const handleUndoFromRight = (leftIdx: number) => {
        updateRight((arr) => {
            const copy = [...arr];
            const rightIdx = copy.findIndex((item) => item.fromLeftIndex === leftIdx);
            if (rightIdx !== -1) {
                copy[rightIdx] = { ...copy[rightIdx], Driver1: '', fromLeftIndex: undefined };
                updateLeft((leftArr) => {
                    const leftCopy = [...leftArr];
                    leftCopy[leftIdx] = { ...leftCopy[leftIdx], isAssigned: false, Driver1: leftCopy[leftIdx].Driver1 || copy[rightIdx].Driver1 };
                    return sortItems(leftCopy);
                });
            }
            return copy;
        });
    };

    const handleEditBlur = (idx: number) => {
        const newDriverName = editValue.trim();
        if (newDriverName && itemsRight.some(item => item.Driver1 === newDriverName && item.ID !== itemsRight[idx].ID)) {
            setWarningModal({
                action: () => {
                    updateRight((arr) => {
                        const copy = [...arr];
                        const oldName = copy[idx].Driver1;
                        copy[idx] = { ...copy[idx], Driver1: newDriverName };
                        if (copy[idx].fromLeftIndex !== undefined && newDriverName !== oldName) {
                            copy[idx].fromLeftIndex = undefined;
                        }
                        return copy;
                    });
                    setWarningModal(null);
                    setEditingRightIndex(null);
                }
            });
            return;
        }
        updateRight((arr) => {
            const copy = [...arr];
            const oldName = copy[idx].Driver1;
            copy[idx] = { ...copy[idx], Driver1: newDriverName };
            if (copy[idx].fromLeftIndex !== undefined && newDriverName !== oldName) {
                copy[idx].fromLeftIndex = undefined;
            }
            return copy;
        });
        setEditingRightIndex(null);
    };

    const handleEditKeyDown = (e: KeyboardEvent<HTMLInputElement>, idx: number) => {
        if (e.key === 'Enter') {
            handleEditBlur(idx);
        }
    };

    const allowedDrivers = (notes['Available Drivers'] || '').split('\n').map(d => d.trim()).filter(d => d);

    return (
        <Layout title="Schedule Tool" fullWidth>
            <div className="w-full min-h-screen p-0 m-0">

                <div className="flex gap-4 w-full min-h-full">
                    <div className="flex-1 min-w-0 flex flex-col">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="flex-1" />
                            <button onClick={clearAllLeft} className="btn btn-error btn-xs w-24">
                                Clear
                            </button>
                        </div>
                        {renderStats(leftStats)}
                        <div className="overflow-auto flex-1 max-h-[calc(100vh-180px)]">
                            <table className="table table-xs table-zebra w-full">
                                <thead>
                                    <tr>
                                        <th onClick={() => applyLeftSort('Start')}>Start</th>
                                        <th onClick={() => applyLeftSort('End')}>End</th>
                                        <th onClick={() => applyLeftSort('ActualEnd')}>Actual End</th>
                                        <th onClick={() => applyLeftSort('Driver1')}>Driver</th>
                                        <th onClick={() => applyLeftSort('Contractor')}>Contractor</th>
                                        <th onClick={() => applyLeftSort('VH')} className="text-right">VH</th>
                                        <th onClick={() => applyLeftSort('Route')}>Route</th>
                                        <th onClick={() => applyLeftSort('Tasks')}>Tasks</th>
                                        <th onClick={() => applyLeftSort('Order_Value')}>Amount</th>
                                        <th onClick={() => applyLeftSort('Punctuality')}>Punctuality</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {itemsLeft.map((it, idx) => {
                                        const driverColor = getDriverColor(it.Driver1);
                                        const routeColor = getRouteColorClass(it.Calendar_Name);
                                        const isAllowed = allowedDrivers.includes(it.Driver1 || '');
                                        return (
                                            <tr key={it.ID} className="hover:bg-gray-200 dark:hover:bg-gray-700">
                                                <td>{getTextAfterSpace(it.Start_Time)}</td>
                                                <td>{getTextAfterSpace(it.End_Time)}</td>
                                                <td>{getActualEnd(it.End_Time, it.Punctuality)}</td>
                                                <td
                                                    draggable={isAllowed && !it.isAssigned}
                                                    onDragStart={(e) => e.dataTransfer.setData('text/plain', JSON.stringify({ table: 'left', index: idx, name: it.Driver1 }))}
                                                    onDragOver={(e) => e.preventDefault()}
                                                    className={`${driverColor} ${it.isAssigned ? 'text-gray-500 line-through' : ''}`}
                                                >
                                                    {hasSpecialCode(it.Calendar_Name) && <span className="text-orange-500 font-bold">!! </span>}
                                                    {it.isAssigned ? (
                                                        <div className="relative inline-block">
                                                            <span>{it.Driver1}</span>
                                                            <span
                                                                className="underline cursor-pointer text-blue-500 ml-2"
                                                                onClick={() => handleUndoFromRight(idx)}
                                                            >
                                                                undo
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {!isAllowed && <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-1"></span>}
                                                            <span className={!isAllowed ? 'text-gray-500' : ''}>{it.Driver1}</span>
                                                        </>
                                                    )}
                                                </td>
                                                <td>{it.Contractor}</td>
                                                <td className="whitespace-nowrap text-right">{getVH(it.Calendar_Name)}</td>
                                                <td className={`whitespace-nowrap ${routeColor}`}>{getRoute(it.Calendar_Name)}</td>
                                                <td className="whitespace-nowrap">{getTasks(it.Calendar_Name)}</td>
                                                <td className="whitespace-nowrap" style={{ color: getAmountColor(it.Order_Value, amountRangeLeft) }}>
                                                    {it.Order_Value}
                                                </td>                                                <td className="whitespace-nowrap">{it.Punctuality}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="flex-1" />
                            <button onClick={clearAllRight} className="btn btn-error btn-xs w-24">
                                Clear
                            </button>
                        </div>
                        {renderStats(rightStats)}
                        <div className="overflow-auto flex-1 max-h-[calc(100vh-180px)]">
                            <table className="table table-xs table-zebra w-full">
                                <thead>
                                    <tr>
                                        <th onClick={() => applyRightSort('Start')}>Start</th>
                                        <th onClick={() => applyRightSort('End')}>End</th>
                                        <th onClick={() => applyRightSort('Driver1')}>Driver</th>
                                        <th onClick={() => applyRightSort('Contractor')}>Contractor</th>
                                        <th onClick={() => applyRightSort('VH')} className="text-right">VH</th>
                                        <th onClick={() => applyRightSort('Route')}>Route</th>
                                        <th onClick={() => applyRightSort('Tasks')}>Tasks</th>
                                        <th onClick={() => applyRightSort('Order_Value')}>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {itemsRight.map((it, idx) => {
                                        const driverColor = getDriverColor(it.Driver1);
                                        const routeColor = getRouteColorClass(it.Calendar_Name);
                                        const isEditing = editingRightIndex === idx;
                                        return (
                                            <tr key={it.ID} className="hover:bg-gray-200 dark:hover:bg-gray-700">
                                                <td>{getTextAfterSpace(it.Start_Time)}</td>
                                                <td>{getTextAfterSpace(it.End_Time)}</td>
                                                <td
                                                    draggable
                                                    onDragStart={(e) => e.dataTransfer.setData('text/plain', JSON.stringify({ table: 'right', index: idx, name: it.Driver1 }))}
                                                    onDragOver={(e) => e.preventDefault()}
                                                    onDrop={(e) => {
                                                        e.preventDefault();
                                                        const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                                                        const name = data.name;
                                                        if (!name) return;
                                                        const isDuplicate = itemsRight.some(item => item.Driver1 === name && item.ID !== it.ID);
                                                        if (isDuplicate) {
                                                            setWarningModal({
                                                                action: () => {
                                                                    updateRight((arr) => {
                                                                        const copy = [...arr];
                                                                        copy[idx] = { ...copy[idx], Driver1: name };
                                                                        if (data.table === 'right') {
                                                                            if (data.index === idx) return copy; // self drop
                                                                            copy[data.index] = { ...copy[data.index], Driver1: '' };
                                                                            if (copy[data.index].fromLeftIndex !== undefined) {
                                                                                copy[idx].fromLeftIndex = copy[data.index].fromLeftIndex;
                                                                                copy[data.index].fromLeftIndex = undefined;
                                                                            }
                                                                        } else if (data.table === 'left') {
                                                                            copy[idx].fromLeftIndex = data.index;
                                                                            updateLeft((leftArr) => {
                                                                                const leftCopy = [...leftArr];
                                                                                leftCopy[data.index] = { ...leftCopy[data.index], isAssigned: true };
                                                                                return sortItems(leftCopy);
                                                                            });
                                                                        }
                                                                        return copy;
                                                                    });
                                                                    setWarningModal(null);
                                                                }
                                                            });
                                                            return;
                                                        }
                                                        updateRight((arr) => {
                                                            const copy = [...arr];
                                                            copy[idx] = { ...copy[idx], Driver1: name };
                                                            if (data.table === 'right') {
                                                                if (data.index === idx) return copy; // self drop
                                                                copy[data.index] = { ...copy[data.index], Driver1: '' };
                                                                if (copy[data.index].fromLeftIndex !== undefined) {
                                                                    copy[idx].fromLeftIndex = copy[data.index].fromLeftIndex;
                                                                    copy[data.index].fromLeftIndex = undefined;
                                                                }
                                                            } else if (data.table === 'left') {
                                                                copy[idx].fromLeftIndex = data.index;
                                                                updateLeft((leftArr) => {
                                                                    const leftCopy = [...leftArr];
                                                                    leftCopy[data.index] = { ...leftCopy[data.index], isAssigned: true };
                                                                    return sortItems(leftCopy);
                                                                });
                                                            }
                                                            return copy;
                                                        });
                                                    }}
                                                    className={driverColor}
                                                    onDoubleClick={() => {
                                                        if (!isEditing) {
                                                            setEditingRightIndex(idx);
                                                            setEditValue(it.Driver1 || '');
                                                        }
                                                    }}
                                                >
                                                    {hasSpecialCode(it.Calendar_Name) && <span className="text-orange-500 font-bold">!! </span>}
                                                    {isEditing ? (
                                                        <input
                                                            type="text"
                                                            value={editValue}
                                                            onChange={(e) => setEditValue(e.target.value)}
                                                            onBlur={() => handleEditBlur(idx)}
                                                            onKeyDown={(e) => handleEditKeyDown(e, idx)}
                                                            autoFocus
                                                            className="input input-xs w-full"
                                                        />
                                                    ) : (
                                                        it.Driver1
                                                    )}
                                                </td>
                                                <td>{it.Contractor}</td>
                                                <td className="whitespace-nowrap text-right">{getVH(it.Calendar_Name)}</td>
                                                <td className={`whitespace-nowrap ${routeColor}`}>{getRoute(it.Calendar_Name)}</td>
                                                <td className="whitespace-nowrap">{getTasks(it.Calendar_Name)}</td>
                                                <td className="whitespace-nowrap" style={{ color: getAmountColor(it.Order_Value, amountRangeRight) }}>
                                                    {it.Order_Value}
                                                </td>                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="w-72 flex flex-col gap-1 max-h-screen overflow-y-auto p-2">
                        <div className="flex items-center gap-2 mb-4">
                            <div
                                className="flex-1 border-2 border-dashed rounded-md p-3 text-center cursor-pointer bg-white dark:bg-gray-700 dark:border-gray-500 dark:text-gray-200"
                                onDrop={handleDropFile}
                            >
                                <input id="fileAll" type="file" accept=".json" onChange={handleInputFile} className="hidden" />
                                <label htmlFor="fileAll" className="flex items-center justify-center gap-1 text-sm">
                                    <Icon name="file-arrow-up" className="text-xl" />
                                    JSON
                                </label>
                            </div>
                            <button onClick={() => { clearAllLeft(); clearAllRight(); }} className="btn btn-error btn-xs w-24">
                                Clear All
                            </button>
                        </div>
                        <div className="text-base font-bold text-base-content mb-1">Notes</div>
                        {PANELS.map((panel) => (
                            <div key={panel.name} className={`card ${panel.color} shadow-sm`}>
                                <div className="card-body p-2">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="text-xs font-semibold">{panel.name}</h3>
                                        <button
                                            onClick={() => clearNote(panel.name)}
                                            className="btn btn-ghost btn-xs p-0.5 min-h-0 h-4 w-4 opacity-60 hover:opacity-100"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    <textarea
                                        className="textarea w-full text-xs bg-white dark:bg-gray-800 bg-opacity-90 dark:bg-opacity-90 focus:bg-opacity-100 dark:focus:bg-opacity-100 transition-all duration-200 resize-none border-[0.5px] dark:border-opacity-50 p-1.5 rounded-md"
                                        rows={6}
                                        placeholder={`Notes for ${panel.name}...`}
                                        value={notes[panel.name] || ''}
                                        onChange={(e) => handleNoteChange(panel.name, e.target.value)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                {notification && (
                    <div className="toast toast-top toast-center">
                        <div className="alert alert-error">
                            <span>{notification}</span>
                        </div>
                    </div>
                )}
                {warningModal && (
                    <div className="modal modal-open">
                        <div className="modal-box">
                            <h3 className="font-bold text-lg">Warning: Driver already exists in the right table!</h3>
                            <p className="py-4">Do you want to continue anyway?</p>
                            <div className="modal-action">
                                <button className="btn" onClick={() => setWarningModal(null)}>Cancel</button>
                                <button className="btn btn-warning" onClick={() => {
                                    warningModal.action();
                                }}>Continue anyway</button>
                            </div>
                        </div>
                    </div>
                )}
                {error && <p className="text-red-600 mt-2 text-sm">{error}</p>}
            </div>
        </Layout>
    );
}
