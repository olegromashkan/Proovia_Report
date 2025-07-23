import React, { useState, useCallback, useMemo, useEffect } from 'react';
import useSWR from 'swr';
import { motion } from 'framer-motion';
import { parseTimeToMinutes } from '../lib/timeUtils';
import Modal from './Modal';
import { Star, Users, Clock, BarChart2, Award, XCircle, Sunrise, Moon } from 'lucide-react';

// --- 1. ТИПЫ И КОНСТАНТЫ ---

interface DayStats { total: number; complete: number; failed: number; positiveTimeCompleted: number; positiveArrivalTime: number; }
interface ContractorInfo { contractor: string; avgPrice: number; }
interface DriverInfo { driver: string; contractor: string; avgPrice: number; }
interface DriverTime { driver: string; time: number; }
interface FeedData {
  posts: any[];
  topContractors: ContractorInfo[];
  topDrivers: DriverInfo[];
  latestEnd: { driver: string; time: string } | null;
  earliestDrivers: DriverTime[];
  latestDrivers: DriverTime[];
  total?: number; complete?: number; failed?: number; positiveTimeCompleted?: number; positiveArrivalTime?: number;
}
interface ModalData {
  isOpen: boolean;
  title: string;
  dates: string[];
  drivers: { driver: string; times: string[] }[];
}

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error('Failed to fetch data');
  return res.json();
});

const minutesToTime = (minutes: number) => {
    if (isNaN(minutes) || minutes === Infinity || minutes === -Infinity) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

// --- 2. UI-КОМПОНЕНТЫ (улучшенные) ---

const StatCard = ({ title, value, icon, colorClass }: { title: string, value: string | number, icon: React.ReactNode, colorClass: string }) => (
  <motion.div 
    className="stat bg-base-100 rounded-2xl shadow-sm border border-base-300/50 hover:shadow-md transition-all duration-200" 
    initial={{ opacity: 0, y: 10 }} 
    animate={{ opacity: 1, y: 0 }} 
    transition={{ duration: 0.5 }}
  >
    <div className={`stat-figure ${colorClass} flex items-center justify-center`}>
      <div className="w-12 h-12 rounded-xl bg-base-200/80 flex items-center justify-center">
        {icon}
      </div>
    </div>
    <div className="stat-title text-base-content/70 font-medium text-sm">{title}</div>
    <div className="stat-value text-2xl font-bold text-base-content">{value}</div>
  </motion.div>
);

const RankedListItem = ({ rank, name, value }: { rank: number, name: string, value: string }) => {
    const rankData = [
        { icon: '🥇', color: 'bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-900' },
        { icon: '🥈', color: 'bg-gradient-to-r from-slate-300 to-gray-400 text-slate-800' },
        { icon: '🥉', color: 'bg-gradient-to-r from-amber-600 to-orange-600 text-amber-100' }
    ];
    const { icon, color } = rankData[rank] || { icon: `${rank + 1}`, color: 'bg-base-300 text-base-content' };

    return (
        <motion.div 
            className="flex items-center justify-between p-3 rounded-xl hover:bg-base-content/5 transition-all duration-200 group"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: rank * 0.1 }}
        >
            <div className="flex items-center gap-3 overflow-hidden min-w-0">
                <div className={`w-9 h-9 text-sm font-bold rounded-xl flex-shrink-0 flex items-center justify-center ${color} shadow-sm`}>
                    {icon}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold truncate text-base-content group-hover:text-primary transition-colors" title={name}>
                        {name}
                    </div>
                </div>
            </div>
            <div className="text-sm font-bold text-primary pl-3 flex-shrink-0">{value}</div>
        </motion.div>
    );
};

const TimedListItem = ({ name, value }: { name: string; value: string }) => (
    <motion.div 
        className="flex items-center justify-between p-3 rounded-xl hover:bg-base-content/5 transition-all duration-200 group"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
    >
        <span className="text-sm font-medium truncate text-base-content group-hover:text-primary transition-colors flex-1 min-w-0" title={name}>
            {name}
        </span>
        <span className="text-sm font-mono font-bold text-accent pl-3 flex-shrink-0 bg-base-200/60 px-2 py-1 rounded-lg">
            {value}
        </span>
    </motion.div>
);

const InfoCard = ({ title, icon, subtitle, onClick, children, isLoading, isEmpty }: React.PropsWithChildren<{ title: string; icon: React.ReactNode; subtitle: string; onClick?: () => void; isLoading?: boolean; isEmpty?: boolean }>) => (
    <motion.div
        className={`card bg-base-100 shadow-lg border border-base-300/50 hover:shadow-xl transition-all duration-300 group ${onClick ? 'cursor-pointer hover:border-primary/30 hover:-translate-y-1' : ''}`}
        onClick={onClick}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
    >
        <div className="card-body p-5">
            <div className="flex items-center gap-4 mb-4">
                <div className="flex-shrink-0">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 flex items-center justify-center">
                        <div className="text-primary flex items-center justify-center">
                            {icon}
                        </div>
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="card-title text-lg font-bold text-base-content mb-1">{title}</h3>
                    <p className="text-sm text-base-content/60">{subtitle}</p>
                </div>
                {onClick && (
                    <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                            <svg className="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </div>
                )}
            </div>
            {isLoading ? (
                <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-12 rounded-xl bg-base-content/10 animate-pulse"></div>
                    ))}
                </div>
            ) : isEmpty ? (
                <div className="text-center text-sm text-base-content/50 py-8">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-base-300/50 flex items-center justify-center">
                        <svg className="w-6 h-6 text-base-content/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                    </div>
                    No data available
                </div>
            ) : (
                <div className="space-y-2">{children}</div>
            )}
        </div>
    </motion.div>
);

const DriverListModal = ({ data, onClose }: { data: ModalData; onClose: () => void; }) => (
    <Modal open={data.isOpen} onClose={onClose} className="modal-box max-w-6xl">
        <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-base-content">{data.title}</h2>
            <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
        <div className="overflow-auto max-h-[70vh] rounded-xl border border-base-300">
            <table className="table table-sm table-zebra table-pin-rows table-pin-cols">
                <thead>
                    <tr className="bg-base-200">
                        <th className="sticky left-0 bg-base-200 backdrop-blur-sm z-10 font-bold">Driver</th>
                        {data.dates.map((d) => (
                            <th key={d} className="text-center font-bold">{d.slice(5)}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.drivers.map((d, index) => (
                        <tr key={d.driver} className="hover:bg-base-content/5">
                            <th className="sticky left-0 bg-base-100/95 backdrop-blur-sm z-10 whitespace-nowrap font-semibold">
                                {d.driver}
                            </th>
                            {d.times.map((t, idx) => (
                                <td key={idx} className="text-center font-mono text-sm">
                                    {t || '–'}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </Modal>
);

// --- 3. ЛОГИКА ОБРАБОТКИ ДАННЫХ ---
async function fetchAndProcessModalData(start: string, end: string, type: 'early' | 'latest') {
    const parseMinutes = (str: string | null): number => {
        const n = parseTimeToMinutes(str || undefined);
        return n === null ? (type === 'early' ? Infinity : -Infinity) : n;
    };

    const table = type === 'latest' ? 'copy_of_tomorrow_trips' : 'schedule_trips';
    const res = await fetch(`/api/driver-routes?start=${start}&end=${end}&table=${table}`);
    if (!res.ok) throw new Error('Failed to fetch driver routes');
    
    const json = await res.json();
    const map: Record<string, Record<string, { time: number; label: string }>> = {};

    (json.items || []).forEach((it: any) => {
        const driver = it.driver || 'Unknown';
        const timeStr = type === 'early' ? it.start_time : it.end_time;
        if (!timeStr) return;

        const time = parseMinutes(timeStr);
        if (!map[driver]) map[driver] = {};

        const existing = map[driver][it.date];
        const isNewBest = type === 'early' ? (!existing || time < existing.time) : (!existing || time > existing.time && time !== Infinity);
        if (isNewBest) map[driver][it.date] = { time, label: timeStr };
    });

    const dates: string[] = [];
    for (let d = new Date(start); d <= new Date(end); d.setDate(d.getDate() + 1)) {
        dates.push(d.toISOString().split('T')[0]);
    }

    const drivers = Object.entries(map).map(([driver, byDate]) => {
        const times = dates.map((dt) => byDate[dt]?.label || '');
        const sortValues = Object.values(byDate).map(v => v.time);
        const sortVal = type === 'early' ? Math.min(...sortValues) : Math.max(...sortValues.filter(t => t !== Infinity));
        return { driver, times, sortVal };
    }).sort((a, b) => type === 'early' ? a.sortVal - b.sortVal : b.sortVal - a.sortVal);
    
    return { dates, drivers };
}

// --- 4. ГЛАВНЫЙ КОМПОНЕНТ ---
export default function SummaryFeed({ initialData }: { initialData?: FeedData }) {
    const [modalData, setModalData] = useState<ModalData>({ isOpen: false, title: '', dates: [], drivers: [] });
    const [start, setStart] = useState('');
    const [end, setEnd] = useState('');

    useEffect(() => {
        const d = new Date();
        const today = d.toISOString().split('T')[0];
        d.setDate(d.getDate() - 6);
        const sevenDaysAgo = d.toISOString().split('T')[0];
        
        setStart(sevenDaysAgo);
        setEnd(today);
    }, []);

    const { data, error } = useSWR<FeedData>(start && end ? `/api/summary-feed?start=${start}&end=${end}` : null, fetcher, { fallbackData: initialData });
    const isLoading = !data && !error;

    const handleOpenModal = useCallback(async (type: 'early' | 'latest', title: string) => {
        if (!start || !end) return;
        try {
            const { dates, drivers } = await fetchAndProcessModalData(start, end, type);
            setModalData({ isOpen: true, title, dates, drivers });
        } catch (err) {
            console.error("Failed to open modal:", err);
        }
    }, [start, end]);

    const stats = useMemo(() => ({
        total: data?.total || 0,
        complete: data?.complete || 0,
        failed: data?.failed || 0,
        positiveTimeCompleted: data?.positiveTimeCompleted || 0,
        positiveArrivalTime: data?.positiveArrivalTime || 0,
        successRate: data?.total ? ((data.complete / data.total) * 100).toFixed(1) : '0',
    }), [data]);
    
    const headerDate = start && end
        ? start === end
            ? new Date(start + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
            : `${new Date(start + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} - ${new Date(end + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`
        : '...';

    const statItems = [
        { title: 'Total Orders', value: stats.total.toLocaleString(), icon: <BarChart2 className="w-6 h-6" />, colorClass: 'text-primary' },
        { title: 'Success Rate', value: `${stats.successRate}%`, icon: <Award className="w-6 h-6" />, colorClass: 'text-success' },
        { title: 'Failed Orders', value: stats.failed, icon: <XCircle className="w-6 h-6" />, colorClass: 'text-error' },
        { title: 'Late Arrival', value: stats.positiveArrivalTime, icon: <Clock className="w-6 h-6" />, colorClass: 'text-warning' },
        { title: 'Late Completion', value: stats.positiveTimeCompleted, icon: <Clock className="w-6 h-6" />, colorClass: 'text-warning' },
    ];
    
    return (
    <div className="card card-glass shadow-2xl border border-base-300/20">
                    <div className="container mx-auto p-6 space-y-8">
                <motion.header 
                    className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 bg-base-100 p-6 rounded-2xl shadow-lg border border-base-300/50"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 flex items-center justify-center">
                            <BarChart2 className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-base-content">Summary Feed</h1>
                            <p className="text-base-content/60 text-lg">{headerDate}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 w-full lg:w-auto">
                        <div className="flex items-center gap-2 bg-base-200/80 p-2 rounded-xl">
                            <input 
                                type="date" 
                                value={start} 
                                onChange={(e) => setStart(e.target.value)} 
                                className="input input-bordered input-sm bg-base-100 border-base-300/50 focus:border-primary" 
                            />
                            <span className="text-base-content/60 font-medium px-2">to</span>
                            <input 
                                type="date" 
                                value={end} 
                                onChange={(e) => setEnd(e.target.value)} 
                                className="input input-bordered input-sm bg-base-100 border-base-300/50 focus:border-primary" 
                            />
                        </div>
                    </div>
                </motion.header>

                {error && (
                    <motion.div 
                        className="alert alert-error shadow-lg"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        Could not load summary data. Please try again later.
                    </motion.div>
                )}

                <motion.div 
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    {isLoading ? 
                        Array.from({length: 5}).map((_,i) => (
                            <div key={i} className="h-32 rounded-2xl bg-base-content/10 animate-pulse"></div>
                        ))
                        : statItems.map((item, index) => (
                            <motion.div
                                key={item.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                            >
                                <StatCard {...item} />
                            </motion.div>
                        ))
                    }
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
                    <InfoCard 
                        title="Top Contractors" 
                        subtitle="By average price" 
                        icon={<Star className="w-7 h-7" />} 
                        isLoading={isLoading} 
                        isEmpty={!data?.topContractors?.length}
                    >
                        {data?.topContractors?.map((c, i) => (
                            <RankedListItem key={c.contractor} rank={i} name={c.contractor} value={`£${c.avgPrice.toFixed(0)}`} />
                        ))}
                    </InfoCard>
                    
                    <InfoCard 
                        title="Top Drivers" 
                        subtitle="By average price" 
                        icon={<Users className="w-7 h-7" />} 
                        isLoading={isLoading} 
                        isEmpty={!data?.topDrivers?.length}
                    >
                        {data?.topDrivers?.map((d, i) => (
                            <RankedListItem key={d.driver} rank={i} name={d.driver} value={`£${d.avgPrice.toFixed(0)}`} />
                        ))}
                    </InfoCard>
                    
                    <InfoCard 
                        title="Early Birds" 
                        subtitle="Drivers with earliest starts" 
                        icon={<Sunrise className="w-7 h-7" />} 
                        onClick={() => handleOpenModal('early', 'Early Birds Start Times')} 
                        isLoading={isLoading} 
                        isEmpty={!data?.earliestDrivers?.length}
                    >
                        {(data?.earliestDrivers || []).map((d, i) => (
                            <TimedListItem key={d.driver} name={d.driver} value={minutesToTime(d.time)} />
                        ))}
                    </InfoCard>
                    
                    <InfoCard 
                        title="Latest Finishers" 
                        subtitle="Drivers with latest finish" 
                        icon={<Moon className="w-7 h-7" />} 
                        onClick={() => handleOpenModal('latest', 'Latest Finish Times')} 
                        isLoading={isLoading} 
                        isEmpty={!data?.latestDrivers?.length}
                    >
                         {(data?.latestDrivers || []).map((d, i) => (
                            <TimedListItem key={d.driver} name={d.driver} value={minutesToTime(d.time)} />
                        ))}
                    </InfoCard>
                </div>
            </div>
            
            <DriverListModal data={modalData} onClose={() => setModalData(prev => ({ ...prev, isOpen: false }))} />
        </div>
    );
}