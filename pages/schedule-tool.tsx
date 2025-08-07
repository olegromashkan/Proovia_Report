import { useEffect, useState, DragEvent, ChangeEvent, useRef, KeyboardEvent, useMemo, MouseEvent } from 'react';
import Layout from '../components/Layout';
import Icon from '../components/Icon';
import Modal from '../components/Modal';
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
interface RouteGroup {
    name: string;
    codes: string[];
    isFull: boolean;
    color: string;
}
const DEFAULT_IGNORED_PATTERNS = [
    'every 2nd day north',
    'everyday',
    'every 2nd south-west',
    'every 2nd day south',
    'South Wales 2nd',
];
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
const DEFAULT_TIME_SETTINGS = {
    lateEndHour: 20,
    earlyStartHour: 7,
    earlyEndHour: 17,
    lateStartHour: 9,
    restMessage: 'Driver has had too little rest between shifts.',
    earlyMessage: 'Consider assigning this driver to an earlier start time.',
    enableRestWarning: true,
    enableEarlyWarning: true,
};
export default function ScheduleTool() {
    const [itemsLeft, setItemsLeft] = useState<Trip[]>([]);
    const [itemsRight, setItemsRight] = useState<Trip[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [notification, setNotification] = useState<string | null>(null);
    const [warningModal, setWarningModal] = useState<{ action: () => void } | null>(null);
    const [mergeModal, setMergeModal] = useState<{ original: string; suggested: string }[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const leftLoaded = useRef(false);
    const rightLoaded = useRef(false);
    const PANELS = [
        { name: 'Newbie', color: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700 text-green-700 dark:text-green-300', icon: 'person' },
        { name: 'Mechanic', color: 'bg-blue-50 dark:bg-gray-900/30 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300', icon: 'wrench' },
        { name: 'Loading 2DT', color: 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700 text-orange-700 dark:text-orange-300', icon: 'truck' },
        { name: 'Trainers', color: 'bg-pink-50 dark:bg-pink-900/30 border-pink-200 dark:border-pink-700 text-pink-700 dark:text-pink-300', icon: 'journal-check' },
        {
            name: 'Agreements', color: 'bg-yellow-50 dark:bg-green-900/30 border-yellow-200 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300', icon: 'check2-all'
        },
        { name: 'Return 2DT', color: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700 text-red-700 dark:text-red-300', icon: 'arrow-return-right' },
        {
            name: 'OFF/STB', color: 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300', icon: 'cup-hot'
        },
        { name: 'Available Drivers', color: 'bg-gray-50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300', icon: 'rocket-takeoff' },
    ];
    const [notes, setNotes] = useState<Record<string, string>>({});
    const [editingRightIndex, setEditingRightIndex] = useState<number | null>(null);
    const [editValue, setEditValue] = useState<string>('');
    const [sortLeft, setSortLeft] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null);
    const [sortRight, setSortRight] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null);
    const [routeGroups, setRouteGroups] = useState<RouteGroup[]>(DEFAULT_ROUTE_GROUPS);
    const [ignoredPatterns, setIgnoredPatterns] = useState<string[]>(DEFAULT_IGNORED_PATTERNS);
    const [timeSettings, setTimeSettings] = useState(DEFAULT_TIME_SETTINGS);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [hoveredRightIndex, setHoveredRightIndex] = useState<number | null>(null);
    const [selectedLeft, setSelectedLeft] = useState<number[]>([]);
    const [selectedRight, setSelectedRight] = useState<number[]>([]);
    const [isSelectingLeft, setIsSelectingLeft] = useState(false);
    const [startLeftIndex, setStartLeftIndex] = useState<number | null>(null);
    const [isSelectingRight, setIsSelectingRight] = useState(false);
    const [startRightIndex, setStartRightIndex] = useState<number | null>(null);
    const [lockCopy, setLockCopy] = useState(true);
    const [disableRowSelection, setDisableRowSelection] = useState(true);
    const [lockedRight, setLockedRight] = useState<Set<number>>(new Set());
    const [showLockAnimation, setShowLockAnimation] = useState(false);
    const filterIgnored = <T extends { Calendar_Name?: string }>(items: T[]) =>
        items.filter(it =>
            !ignoredPatterns.some(pat =>
                (it.Calendar_Name || '').toLowerCase().includes(pat.toLowerCase())
            )
        );
    useEffect(() => {
        const stored = typeof window !== 'undefined' ? localStorage.getItem('scheduleSettings') : null;
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (parsed.routeGroups) setRouteGroups(parsed.routeGroups);
                if (parsed.timeSettings) setTimeSettings({ ...DEFAULT_TIME_SETTINGS, ...parsed.timeSettings });
                if (parsed.ignoredPatterns) setIgnoredPatterns(parsed.ignoredPatterns);
            } catch (e) {
                console.error('Failed to load settings from localStorage:', e);
            }
        }
    }, []);
    useEffect(() => {
        const toSave = { routeGroups, timeSettings, ignoredPatterns };
        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem('scheduleSettings', JSON.stringify(toSave));
            } catch (e) {
                console.error('Failed to save settings to localStorage:', e);
            }
        }

    }, [routeGroups, timeSettings, ignoredPatterns]);
    const updateGroup = (idx: number, group: RouteGroup) => {
        setRouteGroups(arr => arr.map((g, i) => (i === idx ? group : g)));
    };
    const resetSettings = () => {
        setRouteGroups(DEFAULT_ROUTE_GROUPS.map(g => ({ ...g, codes: [...g.codes] })));
        setIgnoredPatterns([...DEFAULT_IGNORED_PATTERNS]);
        setTimeSettings({ ...DEFAULT_TIME_SETTINGS });
    };
    const safeFetch = async (url: string, options: RequestInit = {}) => {
        try {
            const res = await fetch(url, options);
            if (!res.ok) throw new Error(`Request failed: ${res.status} - ${res.statusText}`);
            return res;
        } catch (err) {
            console.error('Fetch error:', err);
            setError('Network request failed. Please check your connection.');
            throw err;
        }
    };
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
        try {
            await safeFetch('/api/schedule-tool', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ trips: items }),
            });
        } catch {
            // handled in safeFetch
        }
    };
    const saveRight = async (items: Trip[]) => {
        try {
            await safeFetch('/api/schedule-tool2', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ trips: items }),
            });
        } catch {
            // handled in safeFetch
        }
    };
    const loadNotes = async () => {
        try {
            const res = await safeFetch('/api/schedule-notes');
            const data = await res.json();
            setNotes(data);
        } catch {
            // handled in safeFetch
        }
    };
    const saveNote = async (panel: string, content: string) => {
        try {
            await safeFetch('/api/schedule-notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ panel, content }),
            });
        } catch {
            // handled in safeFetch
        }
    };
    const clearNote = async (panel: string) => {
        try {
            await safeFetch(`/api/schedule-notes?panel=${encodeURIComponent(panel)}`, {
                method: 'DELETE',
            });
            setNotes((n) => ({ ...n, [panel]: '' }));
        } catch {
            // handled in safeFetch
        }
    };
    const load = async () => {
        setIsLoading(true);
        try {
            const [lRes, rRes] = await Promise.all([
                safeFetch('/api/schedule-tool'),
                safeFetch('/api/schedule-tool2'),
            ]);
            const lJson = await lRes.json();
            updateLeft(() => sortItems(filterIgnored(lJson)));
            const rJson = await rRes.json();
            updateRight(() => filterIgnored(rJson));
        } catch (err) {
            console.error('Load error:', err);
        } finally {
            setIsLoading(false);
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
        setIsLoading(true);
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
            await Promise.all([
                safeFetch('/api/schedule-tool', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ trips: leftTrips, preserveDrivers: true }),
                }),
                safeFetch('/api/schedule-tool2', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ trips: rightTrips, preserveDrivers: true }),
                }),
            ]);
            await load();
        } catch (err) {
            console.error('File process error:', err);
            setError('Failed to upload and process file.');
        } finally {
            setIsLoading(false);
        }
    };
    const updateAvailableDrivers = (allowed: string[]) => {
        updateLeft((arr) => {
            const allowedSet = new Set(allowed);
            const withoutOldDummies = arr.filter(it => !it.ID?.startsWith('extra-') || allowedSet.has(it.Driver1 || '') || it.isAssigned);
            const currentDrivers = new Set(withoutOldDummies.map(it => it.Driver1?.trim()).filter(Boolean));
            const missing = allowed.filter(d => !currentDrivers.has(d));
            const newDummies = missing.map(d => ({
                ID: `extra-${d.replace(/\s/g, '_')}`,
                Driver1: d,
                isAssigned: false,
            }));
            return sortItems([...withoutOldDummies, ...newDummies]);
        });
    };
    const handleNoteChange = (panel: string, value: string) => {
        setNotes((n) => ({ ...n, [panel]: value }));
        saveNote(panel, value);
        if (panel === 'Available Drivers') {
            const allowed = value.split('\n').map(d => d.trim()).filter(d => d);
            const realDrivers = new Set(
                itemsLeft
                    .filter(it => !it.ID?.startsWith('extra-'))
                    .map(it => it.Driver1?.trim())
                    .filter(Boolean)
            );
            const potentialMerges = allowed
                .filter(avail => !realDrivers.has(avail))
                .map(avail => {
                    const parts = avail.split(/\s+/).filter(Boolean);
                    if (parts.length === 2) {
                        const reversed = `${parts[1]} ${parts[0]}`;
                        if (realDrivers.has(reversed)) {
                            return { original: avail, suggested: reversed };
                        }
                    }
                    return null;
                })
                .filter(Boolean) as { original: string; suggested: string }[];
            if (potentialMerges.length > 0) {
                setMergeModal(potentialMerges);
            } else {
                updateAvailableDrivers(allowed);
            }
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
        try {
            await safeFetch('/api/schedule-tool', { method: 'DELETE' });
            setItemsLeft([]);
            setSelectedLeft([]);
        } catch {
            // handled in safeFetch
        }
    };
    const clearAllRight = async () => {
        try {
            await safeFetch('/api/schedule-tool2', { method: 'DELETE' });
            setItemsRight([]);
            setSelectedRight([]);
        } catch {
            // handled in safeFetch
        }
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
        const routeUpper = getRoute(text)?.toUpperCase().replace(/[\s+]+/g, '+') || '';
        const twoDTKeywords = new Set(['EDINBURGH', 'GLASGOW', 'ABERDEEN', 'EX+TR', 'INVERNESS', 'TQ+PL']);
        if (Array.from(twoDTKeywords).some(kw => routeUpper.includes(kw))) {
            return '2DT';
        }
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
        const parts = calendar.split(/[\s+]+/).map(p => p.trim()).filter(Boolean);
        return parts.some(part => specialCodes.has(part));
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
        let upper = route.toUpperCase().replace(/[\s+]+/g, '+');
        for (const group of routeGroups) {
            if (group.isFull) {
                if (group.codes.includes(upper)) return group.color;
            } else {
                const parts = upper.split('+').map(p => p.trim()).filter(p => p !== '');
                if (parts.some(p => group.codes.includes(p))) return group.color;
            }
        }
        return 'text-white';
    };
    const getCategory = (route: string): string => {
        let upper = route.toUpperCase().replace(/[\s+]+/g, '+');
        for (const cat of routeGroups) {
            if (cat.isFull) {
                if (cat.codes.includes(upper)) return cat.name;
            } else {
                const parts = upper.split('+').map(p => p.trim()).filter(p => p !== '');
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
        const allowed = items.filter(it => allowedDrivers.includes(it.Driver1 || ''));
        const notAllowed = items.filter(it => !allowedDrivers.includes(it.Driver1 || ''));
        return [...allowed, ...notAllowed];
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
                case 'Duration':
                    return getDuration(it, isLeft);
                default:
                    return (it as any)[key];
            }
        };
        const compare = (a: Trip, b: Trip) => {
            const va = getValue(a);
            const vb = getValue(b);
            if (typeof va === 'number' && typeof vb === 'number') {
                if (isNaN(va) && isNaN(vb)) return 0;
                if (isNaN(va)) return dir === 'asc' ? 1 : -1;
                if (isNaN(vb)) return dir === 'asc' ? -1 : 1;
                return dir === 'asc' ? va - vb : vb - va;
            }
            const sva = String(va ?? '').toLowerCase();
            const svb = String(vb ?? '').toLowerCase();
            if (sva < svb) return dir === 'asc' ? -1 : 1;
            if (sva > svb) return dir === 'asc' ? 1 : -1;
            return 0;
        };
        if (!isLeft) {
            const twoDT = arr.filter(it => getVH(it.Calendar_Name) === '2DT');
            const notTwoDT = arr.filter(it => getVH(it.Calendar_Name) !== '2DT');
            const sortedNotTwoDT = [...notTwoDT].sort(compare);
            return [...sortedNotTwoDT, ...twoDT];
        } else {
            const allowed = arr.filter(it => allowedDrivers.includes(it.Driver1 || ''));
            const notAllowed = arr.filter(it => !allowedDrivers.includes(it.Driver1 || ''));
            const sortedAllowed = [...allowed].sort(compare);
            return [...sortedAllowed, ...notAllowed];
        }
    };
    const leftStats = useMemo(() => computeStats(itemsLeft), [itemsLeft, routeGroups]);
    const rightStats = useMemo(() => computeStats(itemsRight), [itemsRight, routeGroups]);
    const amountRangeLeft = useMemo(() => {
        const vals = itemsLeft.map(it => parseFloat(it.Order_Value || '0')).filter(v => !isNaN(v));
        if (vals.length === 0) return { min: 0, max: 0, lower: 0, upper: 0 };
        const sorted = [...vals].sort((a, b) => a - b);
        const q1Index = Math.floor(sorted.length * 0.25);
        const q3Index = Math.floor(sorted.length * 0.75);
        const q1 = sorted[q1Index];
        const q3 = sorted[q3Index];
        const iqr = q3 - q1;
        const lower = q1 - 1.5 * iqr;
        const upper = q3 + 1.5 * iqr;
        const nonOutliers = vals.filter(v => v >= lower && v <= upper);
        const minNonOutlier = nonOutliers.length > 0 ? Math.min(...nonOutliers) : Math.min(...vals);
        const maxNonOutlier = nonOutliers.length > 0 ? Math.max(...nonOutliers) : Math.max(...vals);
        return { min: minNonOutlier, max: maxNonOutlier, lower, upper };
    }, [itemsLeft]);
    const amountRangeRight = useMemo(() => {
        const vals = itemsRight.map(it => parseFloat(it.Order_Value || '0')).filter(v => !isNaN(v));
        if (vals.length === 0) return { min: 0, max: 0, lower: 0, upper: 0 };
        const sorted = [...vals].sort((a, b) => a - b);
        const q1Index = Math.floor(sorted.length * 0.25);
        const q3Index = Math.floor(sorted.length * 0.75);
        const q1 = sorted[q1Index];
        const q3 = sorted[q3Index];
        const iqr = q3 - q1;
        const lower = q1 - 1.5 * iqr;
        const upper = q3 + 1.5 * iqr;
        const nonOutliers = vals.filter(v => v >= lower && v <= upper);
        const minNonOutlier = nonOutliers.length > 0 ? Math.min(...nonOutliers) : Math.min(...vals);
        const maxNonOutlier = nonOutliers.length > 0 ? Math.max(...nonOutliers) : Math.max(...vals);
        return { min: minNonOutlier, max: maxNonOutlier, lower, upper };
    }, [itemsRight]);
    const getAmountColor = (val: string | undefined, range: { min: number; max: number; lower: number; upper: number }) => {
        const num = parseFloat(val || '');
        if (isNaN(num)) return 'text-gray-500';
        if (num < range.lower || num > range.upper) return 'text-gray-800';
        const ratio = range.max === range.min ? 0 : (num - range.min) / (range.max - range.min);
        const hue = 0 + ratio * 120;
        return `hsl(${hue}, 70%, 50%)`;
    };
    const getTimeColor = (val: number, range: { min: number; max: number }) => {
        if (isNaN(val)) return '';
        const ratio = range.max === range.min ? 0 : (val - range.min) / (range.max - range.min);
        if (ratio < 0.25) {
            const lightness = 90 - ratio * 4 * 20;
            return `hsl(120, 60%, ${lightness}%)`;
        } else if (ratio < 0.5) {
            const hue = 120 - (ratio - 0.25) * 4 * 60;
            return `hsl(${hue}, 60%, 70%)`;
        } else if (ratio < 0.75) {
            const hue = 60 - (ratio - 0.5) * 4 * 30;
            return `hsl(${hue}, 60%, 70%)`;
        } else {
            const hue = 30 - (ratio - 0.75) * 4 * 30;
            const lightness = 70 - (ratio - 0.75) * 4 * 20;
            return `hsl(${hue}, 60%, ${lightness}%)`;
        }
    };
    const renderStats = (stats: { counts: Record<string, number>, total: number }, clearFn: () => void) => (
        <div className="text-xs flex flex-wrap gap-1 items-center bg-base-200 dark:bg-base-100 p-1 rounded-md shadow-sm">
            {routeGroups.map(cat => (
                <span
                    key={cat.name}
                    className={`px-1 py-0.5 rounded text-xs ${cat.color} bg-opacity-20 ${cat.color.replace('text-', 'bg-')} font-medium`}
                >
                    {cat.name}: {stats.counts[cat.name] || 0}
                </span>
            ))}
            <span
                className="px-1 py-0.5 rounded text-xs text-white bg-opacity-20 bg-gray-500 font-medium"
            >
                Other: {stats.counts['Other'] || 0}
            </span>
            <span
                className="px-1 py-0.5 rounded text-xs text-white bg-opacity-20 bg-gray-700 font-medium"
            >
                Total: {stats.total}
            </span>
            <button onClick={clearFn} className="btn btn-error btn-outline btn-xs ml-1" title="Clear all items">
                Clear
            </button>
        </div>
    );
    const renderSelectedStats = (selected: number[], items: Trip[], isLeft: boolean) => {
        if (selected.length <= 1) return null;
        const selectedItems = items.filter((_, i) => selected.includes(i));
        let totalTasks = 0, countTasks = 0, totalAmount = 0, countAmount = 0, totalPunct = 0, countPunct = 0, totalDuration = 0, countDuration = 0;
        const uniqueDrivers = new Set(selectedItems.map(it => it.Driver1).filter(Boolean)).size;
        selectedItems.forEach(it => {
            const tasks = parseFloat(getTasks(it.Calendar_Name) || '0');
            if (!isNaN(tasks)) {
                totalTasks += tasks;
                countTasks++;
            }
            const amount = parseFloat(it.Order_Value || '0');
            if (!isNaN(amount)) {
                totalAmount += amount;
                countAmount++;
            }
            const punct = parseFloat(it.Punctuality || '0');
            if (!isNaN(punct)) {
                totalPunct += punct;
                countPunct++;
            }
            const dur = getDuration(it, isLeft);
            if (!isNaN(dur)) {
                totalDuration += dur;
                countDuration++;
            }
        });
        const avgTasks = countTasks > 0 ? totalTasks / countTasks : 0;
        const avgAmount = countAmount > 0 ? totalAmount / countAmount : 0;
        const avgPunct = countPunct > 0 ? totalPunct / countPunct : 0;
        const avgDuration = countDuration > 0 ? totalDuration / countDuration : 0;
        const avgDurationFormatted = formatDuration(avgDuration);
        return (
            <div className="text-xs flex flex-wrap gap-1.5 items-center bg-gray-800 dark:bg-gray-900/80 p-1.5 rounded-lg shadow-md sticky bottom-0 z-10 border-t border-gray-700 dark:border-gray-600">
                <span className="px-1.5 py-0.5 bg-gray-700 dark:bg-gray-800/50 rounded-md font-medium text-gray-200 dark:text-gray-300 flex items-center gap-1">
                    <Icon name="list-ul" className="w-3 h-3" />
                    {selected.length} ({uniqueDrivers})
                </span>
                <span className="px-1.5 py-0.5 bg-gray-700 dark:bg-gray-800/50 rounded-md font-medium text-gray-200 dark:text-gray-300 flex items-center gap-1">
                    <Icon name="check-square" className="w-3 h-3" />
                    {totalTasks.toFixed(2)} / {avgTasks.toFixed(2)}
                </span>
                <span className="px-1.5 py-0.5 bg-gray-700 dark:bg-gray-800/50 rounded-md font-medium text-gray-200 dark:text-gray-300 flex items-center gap-1">
                    <Icon name="currency-dollar" className="w-3 h-3" />
                    {totalAmount.toFixed(2)} / {avgAmount.toFixed(2)}
                </span>
                <span className="px-1.5 py-0.5 bg-gray-700 dark:bg-gray-800/50 rounded-md font-medium text-gray-200 dark:text-gray-300 flex items-center gap-1">
                    <Icon name="clock" className="w-3 h-3" />
                    {avgPunct.toFixed(2)}
                </span>
                <span className="px-1.5 py-0.5 bg-gray-700 dark:bg-gray-800/50 rounded-md font-medium text-gray-200 dark:text-gray-300 flex items-center gap-1">
                    <Icon name="hourglass" className="w-3 h-3" />
                    {avgDurationFormatted}
                </span>
            </div>
        );
    };
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
        } else if (e.key === 'Escape') {
            setEditingRightIndex(null);
        }
    };
    const allowedDrivers = useMemo(() => (notes['Available Drivers'] || '').split('\n').map(d => d.trim()).filter(d => d), [notes]);
    const getStartClass = (startTime: string) => {
        switch (startTime) {
            case '06:00':
                return 'bg-red-600 text-white';
            case '06:30':
                return 'bg-red-500 text-black';
            case '07:30':
                return 'bg-yellow-500 text-black';
            case '08:00':
                return 'bg-green-300 text-black';
            case '08:30':
                return 'bg-green-700 text-white';
            case '09:00':
                return 'bg-gray-900 text-white';
            default:
                return 'bg-gray-200 text-black';
        }
    };
    const timeRangeLeft = useMemo(() => {
        const vals = itemsLeft.map(it => parseTime(getActualEnd(it.End_Time, it.Punctuality))).filter(v => !isNaN(v));
        if (vals.length === 0) return { min: 0, max: 0 };
        return { min: Math.min(...vals), max: Math.max(...vals) };
    }, [itemsLeft]);
    const timeRangeRightEnd = useMemo(() => {
        const vals = itemsRight.map(it => parseTime(it.End_Time)).filter(v => !isNaN(v));
        if (vals.length === 0) return { min: 0, max: 0 };
        return { min: Math.min(...vals), max: Math.max(...vals) };
    }, [itemsRight]);
    const formatDuration = (minutes: number): string => {
        if (isNaN(minutes) || minutes < 0) return '--:--';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    };
    const getDuration = (it: Trip, isLeft: boolean) => {
        if (isLeft) {
            const start = parseTime(it.Start_Time);
            const actualEnd = parseTime(getActualEnd(it.End_Time, it.Punctuality));
            return isNaN(start) || isNaN(actualEnd) ? NaN : actualEnd - start;
        } else {
            const start = parseTime(it.Start_Time);
            const end = parseTime(it.End_Time);
            return isNaN(start) || isNaN(end) ? NaN : end - start;
        }
    };
    const handleMouseDownLeft = (e: MouseEvent<HTMLTableRowElement>, idx: number) => {
        if (disableRowSelection) return;
        if (e.ctrlKey || e.metaKey) {
            setSelectedLeft(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
        } else if (e.shiftKey && startLeftIndex !== null) {
            const start = Math.min(startLeftIndex, idx);
            const end = Math.max(startLeftIndex, idx);
            setSelectedLeft(Array.from({ length: end - start + 1 }, (_, i) => start + i));
        } else {
            setIsSelectingLeft(true);
            setStartLeftIndex(idx);
            setSelectedLeft([idx]);
        }
    };
    const handleMouseOverLeft = (idx: number) => {
        if (disableRowSelection) return;
        if (isSelectingLeft && startLeftIndex !== null) {
            const start = Math.min(startLeftIndex, idx);
            const end = Math.max(startLeftIndex, idx);
            setSelectedLeft(Array.from({ length: end - start + 1 }, (_, i) => start + i));
        }
    };
    const handleMouseUpLeft = () => {
        if (disableRowSelection) return;
        setIsSelectingLeft(false);
        // Do not reset startLeftIndex to allow shift select
    };
    const handleMouseDownRight = (e: MouseEvent<HTMLTableRowElement>, idx: number) => {
        if (disableRowSelection) return;
        if (e.ctrlKey || e.metaKey) {
            setSelectedRight(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
        } else if (e.shiftKey && startRightIndex !== null) {
            const start = Math.min(startRightIndex, idx);
            const end = Math.max(startRightIndex, idx);
            setSelectedRight(Array.from({ length: end - start + 1 }, (_, i) => start + i));
        } else {
            setIsSelectingRight(true);
            setStartRightIndex(idx);
            setSelectedRight([idx]);
        }
    };
    const handleMouseOverRight = (idx: number) => {
        if (disableRowSelection) return;
        if (isSelectingRight && startRightIndex !== null) {
            const start = Math.min(startRightIndex, idx);
            const end = Math.max(startRightIndex, idx);
            setSelectedRight(Array.from({ length: end - start + 1 }, (_, i) => start + i));
        }
    };
    const handleMouseUpRight = () => {
        if (disableRowSelection) return;
        setIsSelectingRight(false);
        // Do not reset startRightIndex to allow shift select
    };
    const setDragImage = (e: DragEvent<HTMLTableCellElement>, name: string) => {
        const ghost = document.createElement('div');
        ghost.style.position = 'absolute';
        ghost.style.top = '-9999px';
        ghost.style.backgroundColor = '#ffffff';
        ghost.style.border = '1px solid #e5e7eb';
        ghost.style.padding = '6px 12px';
        ghost.style.borderRadius = '6px';
        ghost.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
        ghost.style.fontSize = '14px';
        ghost.style.fontWeight = '500';
        ghost.style.color = '#1f2937';
        ghost.style.display = 'flex';
        ghost.style.alignItems = 'center';
        ghost.style.gap = '4px';
        ghost.innerHTML = `<svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>${name}`;
        document.body.appendChild(ghost);
        e.dataTransfer?.setDragImage(ghost, 10, 10);
        setTimeout(() => document.body.removeChild(ghost), 0);
    };
    const handleLeftDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        try {
            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
            if (data.table === 'right') {
                const name = data.name;
                const leftIdx = itemsLeft.findIndex(it => it.Driver1 === name && it.isAssigned);
                if (leftIdx !== -1) {
                    handleUndoFromRight(leftIdx);
                }
            }
        } catch (err) {
            console.error('Drop error:', err);
        }
    };
    const toggleLock = (idx: number) => {
        const newSet = new Set(lockedRight);
        const isLocking = !newSet.has(idx);
        if (isLocking) {
            newSet.add(idx);
            setShowLockAnimation(true);
            setTimeout(() => setShowLockAnimation(false), 3000);
        } else {
            newSet.delete(idx);
        }
        setLockedRight(newSet);
    };
    return (
        <Layout title="Schedule Tool" fullWidth>
            <div className="flex gap-2 w-full h-[calc(100vh-4.5rem)] bg-base-100 dark:bg-base-100">
                {/* Left Table */}
                <div className="flex-1 min-w-0 flex flex-col border-r border-gray-200 dark:border-gray-700 relative" onMouseUp={handleMouseUpLeft} onDragOver={(e) => e.preventDefault()} onDrop={handleLeftDrop}>
                    {renderStats(leftStats, clearAllLeft)}
                    <div className="flex-1 overflow-auto relative">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="loading loading-spinner loading-lg"></div>
                            </div>
                        ) : (
                            <table className="table table-xs table-zebra table-pin-rows w-full text-xs">
                                <thead className="bg-base-200 dark:bg-base-100 sticky top-0 z-10">
                                    <tr>
                                        <th className="cursor-pointer" onClick={() => applyLeftSort('Start')}>Start</th>
                                        <th className="cursor-pointer" onClick={() => applyLeftSort('End')}>End</th>
                                        <th className="cursor-pointer" onClick={() => applyLeftSort('ActualEnd')}>A End</th>
                                        <th className="cursor-pointer" onClick={() => applyLeftSort('Driver1')}>Driver</th>
                                        <th className="cursor-pointer" onClick={() => applyLeftSort('Route')}>Route</th>
                                        <th className="cursor-pointer" onClick={() => applyLeftSort('Tasks')}>Tasks</th>
                                        <th className="cursor-pointer" onClick={() => applyLeftSort('Order_Value')}>Amount</th>
                                        <th className="cursor-pointer" onClick={() => applyLeftSort('Punctuality')}>Punctuality</th>
                                        <th className="cursor-pointer" onClick={() => applyLeftSort('Contractor')}>Contractor</th>
                                        <th className="cursor-pointer" onClick={() => applyLeftSort('Duration')}>Duration</th>
                                    </tr>
                                </thead>
                                <tbody className={lockCopy ? 'select-none' : ''}>
                                    {itemsLeft.map((it, idx) => {
                                        const driverColor = getDriverColor(it.Driver1);
                                        const routeColor = getRouteColorClass(it.Calendar_Name);
                                        const isAllowed = allowedDrivers.includes(it.Driver1 || '');
                                        const startTime = getTextAfterSpace(it.Start_Time);
                                        const startClass = getStartClass(startTime);
                                        const actualEndTime = getActualEnd(it.End_Time, it.Punctuality);
                                        const actualEndMinutes = parseTime(actualEndTime);
                                        const actualEndColor = getTimeColor(actualEndMinutes, timeRangeLeft);
                                        const duration = getDuration(it, true);
                                        const durationFormatted = formatDuration(duration);
                                        const vh = getVH(it.Calendar_Name);
                                        const isSelected = selectedLeft.includes(idx);
                                        const showColorBadge = vh !== '2DT' && isAllowed;
                                        return (
                                            <tr
                                                key={it.ID || `left-${idx}`}
                                                className={`transition-colors duration-150 ${isSelected ? '!bg-gray-900 !dark:bg-gray-900/30' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                                onMouseDown={(e) => handleMouseDownLeft(e, idx)}
                                                onMouseOver={() => handleMouseOverLeft(idx)}
                                            >
                                                <td className="py-1 px-2">
                                                    <span
                                                        className={`inline-block px-1.5 py-0.5 rounded-full text-xs font-medium ${startClass}`}
                                                    >
                                                        {startTime}
                                                    </span>
                                                </td>
                                                <td className="py-1 px-2">{getTextAfterSpace(it.End_Time)}</td>
                                                <td className="py-1 px-2">
                                                    {showColorBadge && actualEndColor ? (
                                                        <span
                                                            className="inline-block px-1.5 py-0.5 rounded-full text-xs font-medium text-black"
                                                            style={{ backgroundColor: actualEndColor }}
                                                        >
                                                            {actualEndTime}
                                                        </span>
                                                    ) : (
                                                        actualEndTime
                                                    )}
                                                </td>
                                                <td
                                                    draggable={isAllowed && !it.isAssigned}
                                                    onDragStart={(e) => {
                                                        e.dataTransfer.setData('text/plain', JSON.stringify({ table: 'left', index: idx, name: it.Driver1 }));
                                                        setDragImage(e, it.Driver1 || '');
                                                    }}
                                                    onDragOver={(e) => e.preventDefault()}
                                                    className={`${driverColor} py-1 px-2 ${it.isAssigned ? 'text-gray-500 line-through' : ''} ${isAllowed && !it.isAssigned ? 'cursor-grab hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors duration-150' : ''}`}
                                                >
                                                    {it.isAssigned ? (
                                                        <div className="inline-flex items-center gap-2">
                                                            <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-600 rounded">{it.Driver1}</span>
                                                            <span
                                                                className="underline cursor-pointer text-blue-500 text-xs"
                                                                onClick={() => handleUndoFromRight(idx)}
                                                                title="Undo assignment"
                                                            >
                                                                <Icon name="arrow-counterclockwise" className="w-3 h-3" />
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span
                                                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${isAllowed ? 'bg-gray-200 dark:bg-gray-600 hover:shadow-md transition-all duration-150 transform hover:scale-105' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 opacity-60'}`}
                                                        >
                                                            <span>{it.Driver1}</span>
                                                            {isAllowed && !it.isAssigned ? (
                                                                <Icon name="grip-vertical" className="w-3 h-3 text-gray-500" />
                                                            ) : (
                                                                !it.isAssigned && <Icon name="lock" className="w-3 h-3 text-gray-400" />
                                                            )}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className={`whitespace-nowrap ${routeColor} py-1 px-2`}>
                                                    <div className="flex flex-col">
                                                        <span>
                                                            {hasSpecialCode(it.Calendar_Name) && <Icon name="exclamation-triangle" className="w-3 h-3 text-orange-500 mr-1 inline" />}
                                                            {getRoute(it.Calendar_Name)}
                                                        </span>
                                                        <span className="text-gray-500 text-xs">{vh}</span>
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap py-1 px-2">{getTasks(it.Calendar_Name)}</td>
                                                <td className="whitespace-nowrap py-1 px-2" style={{ color: getAmountColor(it.Order_Value, amountRangeLeft) }}>
                                                    {it.Order_Value}
                                                </td>
                                                <td className="whitespace-nowrap py-1 px-2">{it.Punctuality}</td>
                                                <td className="py-1 px-2">{it.Contractor}</td>
                                                <td className="py-1 px-2">{durationFormatted}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                    {renderSelectedStats(selectedLeft, itemsLeft, true)}
                </div>
                {/* Right Table */}
                <div className="flex-1 min-w-0 flex flex-col relative">
                    {renderStats(rightStats, clearAllRight)}
                    <div className="flex-1 overflow-auto relative" onMouseUp={handleMouseUpRight}>
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="loading loading-spinner loading-lg"></div>
                            </div>
                        ) : (
                            <table className="table table-xs table-zebra table-pin-rows w-full text-xs">
                                <thead className="bg-base-200 dark:bg-base-100 sticky top-0 z-10">
                                    <tr>
                                        <th className="cursor-pointer" onClick={() => applyRightSort('Start')}>Start</th>
                                        <th className="cursor-pointer" onClick={() => applyRightSort('End')}>End</th>
                                        <th className="cursor-pointer" onClick={() => applyRightSort('Driver1')}>Driver</th>
                                        <th className="cursor-pointer" onClick={() => applyRightSort('Route')}>Route</th>
                                        <th className="cursor-pointer" onClick={() => applyRightSort('Tasks')}>Tasks</th>
                                        <th className="cursor-pointer" onClick={() => applyRightSort('Order_Value')}>Amount</th>
                                        <th className="cursor-pointer" onClick={() => applyRightSort('Contractor')}>Contractor</th>
                                        <th className="cursor-pointer" onClick={() => applyRightSort('Duration')}>Duration</th>
                                    </tr>
                                </thead>
                                <tbody className={lockCopy ? 'select-none' : ''}>
                                    {itemsRight.map((it, idx) => {
                                        const driverColor = getDriverColor(it.Driver1);
                                        const routeColor = getRouteColorClass(it.Calendar_Name);
                                        const isEditing = editingRightIndex === idx;
                                        const startTime = getTextAfterSpace(it.Start_Time);
                                        const startClass = getStartClass(startTime);
                                        const endTime = getTextAfterSpace(it.End_Time);
                                        const endMinutes = parseTime(it.End_Time);
                                        const endColor = getTimeColor(endMinutes, timeRangeRightEnd);
                                        const vh = getVH(it.Calendar_Name);
                                        const is2DT = vh === '2DT';
                                        const rowClass = is2DT ? 'text-gray-500' : '';
                                        const duration = getDuration(it, false);
                                        const durationFormatted = formatDuration(duration);
                                        const isHovered = hoveredRightIndex === idx;
                                        const isSelected = selectedRight.includes(idx);
                                        const showColorBadge = !is2DT;
                                        const isLocked = lockedRight.has(idx);
                                        return (
                                            <tr
                                                key={it.ID || `right-${idx}`}
                                                className={`transition-colors duration-150 ${isSelected ? '!bg-gray-900 !dark:bg-gray-900/30' : 'hover:bg-gray-100 dark:hover:bg-gray-700'} ${rowClass}`}
                                                onMouseDown={(e) => handleMouseDownRight(e, idx)}
                                                onMouseOver={() => handleMouseOverRight(idx)}
                                            >
                                                <td className="py-1 px-2">
                                                    <span
                                                        className={`inline-block px-1.5 py-0.5 rounded-full text-xs font-medium ${startClass}`}
                                                    >
                                                        {startTime}
                                                    </span>
                                                </td>
                                                <td className="py-1 px-2">
                                                    {showColorBadge && endColor ? (
                                                        <span
                                                            className="inline-block px-1.5 py-0.5 rounded-full text-xs font-medium text-black"
                                                            style={{ backgroundColor: endColor }}
                                                        >
                                                            {endTime}
                                                        </span>
                                                    ) : (
                                                        endTime
                                                    )}
                                                </td>
                                                <td
                                                    draggable={!!it.Driver1 && !isLocked}
                                                    onDragStart={(e) => {
                                                        if (!!it.Driver1 && !isLocked) {
                                                            e.dataTransfer.setData('text/plain', JSON.stringify({ table: 'right', index: idx, name: it.Driver1 }));
                                                            setDragImage(e, it.Driver1 || '');
                                                        }
                                                    }}
                                                    onDragOver={(e) => {
                                                        if (!isLocked) {
                                                            e.preventDefault();
                                                            e.currentTarget.classList.add('bg-gray-900', 'dark:bg-gray-900/30', 'border-dashed', 'border-2', 'border-blue-300');
                                                        }
                                                    }}
                                                    onDragLeave={(e) => {
                                                        e.currentTarget.classList.remove('bg-gray-900', 'dark:bg-gray-900/30', 'border-dashed', 'border-2', 'border-blue-300');
                                                    }}
                                                    onDrop={(e) => {
                                                        if (isLocked) return;
                                                        e.preventDefault();
                                                        e.currentTarget.classList.remove('bg-gray-900', 'dark:bg-gray-900/30', 'border-dashed', 'border-2', 'border-blue-300');
                                                        try {
                                                            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                                                            const name = data.name;
                                                            if (!name) return;
                                                            let restMessage = '';
                                                            if (data.table === 'left') {
                                                                const leftItem = itemsLeft[data.index];
                                                                const actualEnd = parseTime(getActualEnd(leftItem?.End_Time, leftItem?.Punctuality));
                                                                const targetStart = parseTime(it.Start_Time);
                                                                if (!isNaN(actualEnd) && !isNaN(targetStart)) {
                                                                    if (timeSettings.enableRestWarning && actualEnd > timeSettings.lateEndHour * 60 && targetStart < timeSettings.earlyStartHour * 60) {
                                                                        restMessage = timeSettings.restMessage;
                                                                    } else if (timeSettings.enableEarlyWarning && actualEnd <= timeSettings.earlyEndHour * 60 && targetStart > timeSettings.lateStartHour * 60) {
                                                                        restMessage = timeSettings.earlyMessage;
                                                                    }
                                                                }
                                                            } else if (data.table === 'right') {
                                                                const sourceIdx = data.index;
                                                                if (sourceIdx === idx) return;
                                                                updateRight((arr) => {
                                                                    const copy = [...arr];
                                                                    const tempDriver = copy[idx].Driver1;
                                                                    const tempFrom = copy[idx].fromLeftIndex;
                                                                    copy[idx].Driver1 = copy[sourceIdx].Driver1;
                                                                    copy[idx].fromLeftIndex = copy[sourceIdx].fromLeftIndex;
                                                                    copy[sourceIdx].Driver1 = tempDriver;
                                                                    copy[sourceIdx].fromLeftIndex = tempFrom;
                                                                    return copy;
                                                                });
                                                                return;
                                                            }
                                                            const showRestNotification = () => {
                                                                if (restMessage) {
                                                                    setNotification(restMessage);
                                                                    setTimeout(() => setNotification(null), 4000);
                                                                }
                                                            };
                                                            const isDuplicate = itemsRight.some(item => item.Driver1 === name && item.ID !== it.ID);
                                                            const action = () => {
                                                                updateRight((arr) => {
                                                                    const copy = [...arr];
                                                                    const oldFromLeftIndex = copy[idx].fromLeftIndex;
                                                                    const oldDriver1 = copy[idx].Driver1;
                                                                    copy[idx] = { ...copy[idx], Driver1: name };
                                                                    if (data.table === 'left') {
                                                                        copy[idx].fromLeftIndex = data.index;
                                                                        updateLeft((leftArr) => {
                                                                            const leftCopy = [...leftArr];
                                                                            leftCopy[data.index] = { ...leftCopy[data.index], isAssigned: true };
                                                                            if (oldFromLeftIndex !== undefined && oldDriver1) {
                                                                                leftCopy[oldFromLeftIndex] = { ...leftCopy[oldFromLeftIndex], isAssigned: false };
                                                                            }
                                                                            return sortItems(leftCopy);
                                                                        });
                                                                    } else {
                                                                        copy[idx].fromLeftIndex = undefined;
                                                                    }
                                                                    return copy;
                                                                });
                                                                showRestNotification();
                                                            };
                                                            if (isDuplicate) {
                                                                setWarningModal({
                                                                    action: () => {
                                                                        action();
                                                                        setWarningModal(null);
                                                                    }
                                                                });
                                                                return;
                                                            }
                                                            action();
                                                        } catch (err) {
                                                            console.error('Drop error:', err);
                                                        }
                                                    }}
                                                    className={`${driverColor} py-1 px-2 cursor-pointer relative group`}
                                                    onMouseEnter={() => setHoveredRightIndex(idx)}
                                                    onMouseLeave={() => setHoveredRightIndex(null)}
                                                    onDoubleClick={() => {
                                                        if (!isEditing) {
                                                            setEditingRightIndex(idx);
                                                            setEditValue(it.Driver1 || '');
                                                        }
                                                    }}
                                                >
                                                    {isEditing ? (
                                                        <input
                                                            type="text"
                                                            value={editValue}
                                                            onChange={(e) => setEditValue(e.target.value)}
                                                            onBlur={() => handleEditBlur(idx)}
                                                            onKeyDown={(e) => handleEditKeyDown(e, idx)}
                                                            autoFocus
                                                            className="input input-xs w-full py-0 px-1 border-blue-300 focus:border-blue-500 rounded"
                                                        />
                                                    ) : (
                                                        it.Driver1 ? (
                                                            <span
                                                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-600 hover:shadow-md transition-all duration-150 transform hover:scale-105`}
                                                            >
                                                                <span>{it.Driver1}</span>
                                                                {it.fromLeftIndex !== undefined && (
                                                                    <span
                                                                        className="underline cursor-pointer text-blue-500 text-xs ml-1"
                                                                        onClick={() => handleUndoFromRight(it.fromLeftIndex)}
                                                                        title="Undo assignment"
                                                                    >
                                                                        <Icon name="arrow-counterclockwise" className="w-3 h-3" />
                                                                    </span>
                                                                )}
                                                                <button
                                                                    className="text-gray-500 hover:text-gray-700 ml-1"
                                                                    onClick={() => toggleLock(idx)}
                                                                    title={isLocked ? 'Unlock' : 'Lock'}
                                                                >
                                                                    <Icon name={isLocked ? 'lock' : 'unlock'} className="w-3 h-3" />
                                                                </button>
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-400 italic rounded border border-dashed border-gray-300 dark:border-gray-600">
                                                                <Icon name="plus" className="w-3 h-3" />
                                                                Drop here
                                                            </span>
                                                        )
                                                    )}
                                                </td>
                                                <td className={`whitespace-nowrap ${routeColor} py-1 px-2`}>
                                                    <div className="flex flex-col">
                                                        <span>
                                                            {hasSpecialCode(it.Calendar_Name) && <Icon name="exclamation-triangle" className="w-3 h-3 text-orange-500 mr-1 inline" />}
                                                            {getRoute(it.Calendar_Name)}
                                                        </span>
                                                        <span className="text-gray-500 text-xs">{vh}</span>
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap py-1 px-2">{getTasks(it.Calendar_Name)}</td>
                                                <td className="whitespace-nowrap py-1 px-2" style={{ color: getAmountColor(it.Order_Value, amountRangeRight) }}>
                                                    {it.Order_Value}
                                                </td>
                                                <td className="py-1 px-2">{it.Contractor}</td>
                                                <td className="py-1 px-2">{durationFormatted}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                    {renderSelectedStats(selectedRight, itemsRight, false)}
                </div>
                {/* Notes Sidebar */}
                <div className="w-64 flex flex-col gap-1 h-full overflow-y-auto p-1 bg-base-200 dark:bg-base-100 rounded-md shadow-inner lg:w-64 md:w-48 sm:w-full sm:overflow-x-auto">
                    <div className="flex flex-col gap-1 mb-1">
                        <div
                            className="border border-dashed rounded p-1 text-center cursor-pointer bg-white dark:bg-gray-700 dark:border-gray-500 dark:text-gray-200"
                            onDrop={handleDropFile}
                            onDragOver={(e) => e.preventDefault()}
                            onDragEnter={(e) => e.currentTarget.classList.add('bg-gray-900', 'dark:bg-gray-900/30')}
                            onDragLeave={(e) => e.currentTarget.classList.remove('bg-gray-900', 'dark:bg-gray-900/30')}
                        >
                            <input
                                id="fileAll"
                                type="file"
                                accept=".json"
                                onChange={handleInputFile}
                                className="hidden"
                            />
                            <label
                                htmlFor="fileAll"
                                className="flex items-center justify-center gap-1 text-xs cursor-pointer"
                            >
                                <Icon name="file-arrow-up" className="text-base" />
                                Upload JSON
                            </label>
                        </div>
                        <div className="flex flex-row gap-1 justify-center">
                            <button
                                onClick={() => {
                                    clearAllLeft();
                                    clearAllRight();
                                }}
                                className="btn btn-error btn-outline btn-xs flex items-center justify-center"
                                title="Clear all data"
                            >
                                <Icon name="trash" className="w-3 h-3" />
                            </button>
                            <button
                                className="btn btn-xs flex items-center justify-center"
                                onClick={() => setLockCopy(!lockCopy)}
                                title={lockCopy ? 'Unlock copy' : 'Lock copy'}
                            >
                                <Icon name={lockCopy ? 'lock' : 'unlock'} className="w-3 h-3" />
                            </button>
                            <button
                                className="btn btn-xs flex items-center justify-center"
                                onClick={() => {
                                    const newValue = !disableRowSelection;
                                    setDisableRowSelection(newValue);
                                    if (newValue) {
                                        setSelectedLeft([]);
                                        setSelectedRight([]);
                                    }
                                }}
                                title={disableRowSelection ? 'Unlock row selection' : 'Lock row selection'}
                            >
                                <Icon name={disableRowSelection ? 'lock' : 'unlock'} className="w-3 h-3" />
                            </button>
                            <button
                                className="btn btn-xs flex items-center justify-center"
                                onClick={() => setSettingsOpen(true)}
                                title="Open settings"
                            >
                                <Icon name="gear" className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                    <div className="text-sm font-semibold text-base-content mb-1">Notes</div>
                    <div className="flex flex-col gap-1">
                        {PANELS.map((panel) => (
                            <div
                                key={panel.name}
                                className={`card ${panel.color} shadow rounded-md overflow-hidden`}
                            >
                                <div className="p-1">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <h3 className="text-xs font-medium flex items-center gap-1">
                                            <Icon name={panel.icon} className="w-3 h-3" />
                                            {panel.name}
                                        </h3>
                                        <button
                                            onClick={() => clearNote(panel.name)}
                                            className="btn btn-ghost btn-xs p-0 min-h-0 h-3 w-3 opacity-60 hover:opacity-100"
                                            title="Clear note"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    <textarea
                                        className="textarea w-full text-xs bg-white dark:bg-base-100 border border-gray-300 dark:border-gray-600 p-1 rounded resize-none h-24 overflow-y-auto focus:outline-none focus:border-blue-500"
                                        placeholder={`Notes for ${panel.name}...`}
                                        value={notes[panel.name] || ''}
                                        onChange={(e) => handleNoteChange(panel.name, e.target.value)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} className="max-w-4xl">
                <h3 className="font-bold text-xl mb-4">Settings</h3>
                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    <section className="card bg-base-100 shadow p-4">
                        <h4 className="card-title text-lg mb-2">Time Logic</h4>
                        <div className="grid grid-cols-2 gap-2">
                            <label className="flex items-center gap-2 text-sm">
                                Late End Hour
                                <input
                                    type="number"
                                    className="input input-bordered input-sm w-20"
                                    value={timeSettings.lateEndHour}
                                    onChange={(e) => setTimeSettings({ ...timeSettings, lateEndHour: parseInt(e.target.value) || 20 })}
                                    min={0}
                                    max={24}
                                />
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                                Early Start Hour
                                <input
                                    type="number"
                                    className="input input-bordered input-sm w-20"
                                    value={timeSettings.earlyStartHour}
                                    onChange={(e) => setTimeSettings({ ...timeSettings, earlyStartHour: parseInt(e.target.value) || 7 })}
                                    min={0}
                                    max={24}
                                />
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                                Early End Hour
                                <input
                                    type="number"
                                    className="input input-bordered input-sm w-20"
                                    value={timeSettings.earlyEndHour}
                                    onChange={(e) => setTimeSettings({ ...timeSettings, earlyEndHour: parseInt(e.target.value) || 17 })}
                                    min={0}
                                    max={24}
                                />
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                                Late Start Hour
                                <input
                                    type="number"
                                    className="input input-bordered input-sm w-20"
                                    value={timeSettings.lateStartHour}
                                    onChange={(e) => setTimeSettings({ ...timeSettings, lateStartHour: parseInt(e.target.value) || 9 })}
                                    min={0}
                                    max={24}
                                />
                            </label>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    className="toggle toggle-sm"
                                    checked={timeSettings.enableRestWarning}
                                    onChange={(e) => setTimeSettings({ ...timeSettings, enableRestWarning: e.target.checked })}
                                />
                                Show Rest Warnings
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    className="toggle toggle-sm"
                                    checked={timeSettings.enableEarlyWarning}
                                    onChange={(e) => setTimeSettings({ ...timeSettings, enableEarlyWarning: e.target.checked })}
                                />
                                Show Early Warnings
                            </label>
                        </div>
                        <input
                            type="text"
                            className="input input-bordered input-sm w-full mt-2"
                            value={timeSettings.restMessage}
                            onChange={(e) => setTimeSettings({ ...timeSettings, restMessage: e.target.value })}
                            placeholder="Rest warning message"
                        />
                        <input
                            type="text"
                            className="input input-bordered input-sm w-full mt-2"
                            value={timeSettings.earlyMessage}
                            onChange={(e) => setTimeSettings({ ...timeSettings, earlyMessage: e.target.value })}
                            placeholder="Early warning message"
                        />
                    </section>
                    <section className="card bg-base-100 shadow p-4">
                        <h4 className="card-title text-lg mb-2">Route Groups</h4>
                        {routeGroups.map((group, idx) => (
                            <div key={idx} className="border p-2 rounded-md mb-2 space-y-1">
                                <div className="flex items-center gap-2">
                                    <input
                                        className="input input-bordered input-xs flex-1"
                                        value={group.name}
                                        onChange={(e) => updateGroup(idx, { ...group, name: e.target.value })}
                                        placeholder="Group name"
                                    />
                                    <input
                                        className="input input-bordered input-xs w-32"
                                        value={group.color}
                                        onChange={(e) => updateGroup(idx, { ...group, color: e.target.value })}
                                        placeholder="text-color-500"
                                    />
                                    <label className="flex items-center gap-1 text-xs">
                                        <input
                                            type="checkbox"
                                            checked={group.isFull}
                                            onChange={(e) => updateGroup(idx, { ...group, isFull: e.target.checked })}
                                        />
                                        Full
                                    </label>
                                    <button
                                        className="btn btn-xs btn-error"
                                        onClick={() => setRouteGroups(arr => arr.filter((_, i) => i !== idx))}
                                    >
                                        Remove
                                    </button>
                                </div>
                                <textarea
                                    className="textarea textarea-bordered w-full text-xs h-16"
                                    value={group.codes.join(', ')}
                                    onChange={(e) => updateGroup(idx, { ...group, codes: e.target.value.split(',').map(c => c.trim().toUpperCase()).filter(Boolean) })}
                                    placeholder="Codes, separated by comma"
                                />
                            </div>
                        ))}
                        <button
                            className="btn btn-sm mt-2"
                            onClick={() => setRouteGroups([...routeGroups, { name: 'New Group', codes: [], isFull: false, color: 'text-white' }])}
                        >
                            <Icon name="plus" className="w-4 h-4 mr-1" />
                            Add Group
                        </button>
                    </section>
                    <section className="card bg-base-100 shadow p-4">
                        <h4 className="card-title text-lg mb-2">Ignored Calendar Patterns</h4>
                        <textarea
                            className="textarea textarea-bordered w-full text-xs h-24"
                            value={ignoredPatterns.join('\n')}
                            onChange={(e) => setIgnoredPatterns(e.target.value.split('\n').map(p => p.trim()).filter(Boolean))}
                            placeholder="One pattern per line"
                        />
                    </section>
                </div>
                <div className="modal-action">
                    <button className="btn btn-outline mr-auto" onClick={resetSettings}>Reset Defaults</button>
                    <button className="btn" onClick={() => setSettingsOpen(false)}>Close</button>
                </div>
            </Modal>
            {notification && (
                <div className="toast toast-bottom toast-center z-50">
                    <div className="alert alert-info">
                        <span>{notification}</span>
                    </div>
                </div>
            )}
            {warningModal && (
                <Modal open={true} onClose={() => setWarningModal(null)}>
                    <h3 className="font-bold text-lg">Warning</h3>
                    <p className="py-4">Driver already exists in the right table. Continue anyway?</p>
                    <div className="modal-action">
                        <button className="btn" onClick={() => setWarningModal(null)}>Cancel</button>
                        <button className="btn btn-warning" onClick={warningModal.action}>Continue</button>
                    </div>
                </Modal>
            )}
            {mergeModal && (
                <Modal open={true} onClose={() => {
                    setMergeModal(null);
                    const allowed = (notes['Available Drivers'] || '').split('\n').map(d => d.trim()).filter(d => d);
                    updateAvailableDrivers(allowed);
                }}>
                    <h3 className="font-bold text-lg">Potential Name Format Mismatches</h3>
                    <p className="py-2">The following names in Available Drivers may have reversed first/last names compared to the data table:</p>
                    <ul className="list-disc pl-5">
                        {mergeModal.map((m, i) => (
                            <li key={i}>
                                <span className="font-medium">{m.original}</span> → <span className="font-medium">{m.suggested}</span>
                            </li>
                        ))}
                    </ul>
                    <p className="py-2">Merge will update the Available Drivers list to match the table format.</p>
                    <div className="modal-action">
                        <button className="btn" onClick={() => {
                            setMergeModal(null);
                            const allowed = (notes['Available Drivers'] || '').split('\n').map(d => d.trim()).filter(d => d);
                            updateAvailableDrivers(allowed);
                        }}>Cancel</button>
                        <button className="btn btn-primary" onClick={() => {
                            const lines = (notes['Available Drivers'] || '').split('\n');
                            const newLines = lines.map(line => {
                                const trim = line.trim();
                                const m = mergeModal.find(mm => mm.original === trim);
                                return m ? line.replace(trim, m.suggested) : line;
                            });
                            const newValue = newLines.join('\n');
                            handleNoteChange('Available Drivers', newValue);
                            setMergeModal(null);
                        }}>Merge All</button>
                    </div>
                </Modal>
            )}
            {error && (
                <div className="toast toast-top toast-center z-50">
                    <div className="alert alert-error">
                        <span>{error}</span>
                    </div>
                </div>
            )}
            {showLockAnimation && (
                <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
                    <div className="text-6xl animate-bounce mr-4">🐱</div>
                    <div className="text-6xl animate-ping">🎉</div>
                    <div className="text-6xl animate-spin ml-4">🎆</div>
                </div>
            )}
        </Layout>
    );
}