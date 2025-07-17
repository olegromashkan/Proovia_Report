import React, { useEffect, useState, useCallback, useMemo, Fragment } from 'react';
import useSWR from 'swr';
import Modal from './Modal'; // Предполагается, что у вас есть этот компонент

// ----------------------------------------------------------------------
// 1. ТИПЫ И КОНСТАНТЫ
// ----------------------------------------------------------------------

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

// ----------------------------------------------------------------------
// 2. КОМПОНЕНТ ИКОНОК
// ----------------------------------------------------------------------

const Icon = ({ name, className = 'w-6 h-6' }: { name: string; className?: string }) => {
  const ICONS: Record<string, React.ReactNode> = {
    'star': <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>,
    'users': <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-4.663M12 2.25a.75.75 0 01.75.75v6.318c0 .524.212 1.012.568 1.368l2.956 2.956a.75.75 0 11-1.06 1.06l-2.957-2.956a2.25 2.25 0 00-1.591-.659H9.75a.75.75 0 01-.75-.75V3a.75.75 0 01.75-.75z" /></svg>,
    'clock': <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    'chart': <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h12A2.25 2.25 0 0020.25 14.25V3M3.75 14.25v-1.5c0-.621.504-1.125 1.125-1.125h13.5c.621 0 1.125.504 1.125 1.125v1.5m-15.375-3.375l.47-1.09a.75.75 0 011.28.547l-.47 1.09m12.375-1.09l-.47-1.09a.75.75 0 00-1.28.547l.47 1.09" /></svg>,
    'award': <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    'xmark': <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    'sunrise': <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>,
    'moon': <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>,
  };
  return ICONS[name] || null;
};

// ----------------------------------------------------------------------
// 3. UI-компоненты
// ----------------------------------------------------------------------

const StatCard = ({ title, value, icon, colorClass }: { title: string, value: string | number, icon: string, colorClass: string }) => (
  <div className="stat">
    <div className={`stat-figure ${colorClass}`}>
      <Icon name={icon} className="w-8 h-8" />
    </div>
    <div className="stat-title">{title}</div>
    <div className="stat-value">{value}</div>
  </div>
);

const RankedListItem = ({ rank, name, value }: { rank: number, name: string, value: string }) => {
    const rankData = [
        { icon: '🥇', color: 'bg-amber-400' },
        { icon: '🥈', color: 'bg-slate-400' },
        { icon: '🥉', color: 'bg-amber-600' }
    ];
    const { icon, color } = rankData[rank] || { icon: `#${rank + 1}`, color: 'bg-base-300' };

    return (
        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-base-content/5">
            <div className="flex items-center gap-3 overflow-hidden">
                <div className={`w-7 h-7 text-sm font-bold rounded-md flex-shrink-0 flex items-center justify-center ${color}`}>
                    {icon}
                </div>
                <span className="text-sm font-medium truncate">{name}</span>
            </div>
            <div className="text-sm font-bold text-right pl-2">{value}</div>
        </div>
    );
};

const TimedListItem = ({ name, value }: { name: string; value: string }) => (
    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-base-content/5">
        <span className="text-sm truncate">{name}</span>
        <span className="font-mono text-sm">{value}</span>
    </div>
);

const InfoCard = ({ title, icon, subtitle, onClick, children, isLoading, isEmpty }: React.PropsWithChildren<{ title: string; icon: string; subtitle: string; onClick?: () => void; isLoading?: boolean; isEmpty?: boolean }>) => (
    <div className={`card bg-base-200/50 shadow-md ${onClick ? 'cursor-pointer hover:bg-base-200 transition-all' : ''}`} onClick={onClick}>
        <div className="card-body p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="avatar">
                    <div className="w-11 h-11 text-primary rounded-lg bg-base-300 flex items-center justify-center">
                        <Icon name={icon} className="w-6 h-6" />
                    </div>
                </div>
                <div>
                    <h3 className="card-title text-base">{title}</h3>
                    <p className="text-sm text-base-content/60">{subtitle}</p>
                </div>
            </div>
            {isLoading ? (
                <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-8 rounded-lg bg-base-content/10 animate-pulse"></div>)}
                </div>
            ) : isEmpty ? (
                <div className="text-center text-sm text-base-content/50 py-4">No data available.</div>
            ) : (
                <div className="space-y-1">{children}</div>
            )}
        </div>
    </div>
);

const DriverListModal = ({ data, onClose }: { data: ModalData; onClose: () => void; }) => (
    <Modal open={data.isOpen} onClose={onClose} className="modal-box max-w-3xl">
        <h2 className="text-xl font-bold mb-4">{data.title}</h2>
        <div className="overflow-x-auto max-h-[60vh]">
            <table className="table table-sm table-zebra table-pin-rows">
                <thead>
                    <tr>
                        <th>Driver</th>
                        {data.dates.map((d) => <th key={d} className="text-right">{d.slice(5)}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {data.drivers.map((d) => (
                        <tr key={d.driver}>
                            <th className="whitespace-nowrap">{d.driver}</th>
                            {d.times.map((t, idx) => <td key={idx} className="text-right font-mono">{t || '–'}</td>)}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </Modal>
);

// ----------------------------------------------------------------------
// 4. ЛОГИКА ОБРАБОТКИ ДАННЫХ
// ----------------------------------------------------------------------

async function fetchAndProcessModalData(start: string, end: string, type: 'early' | 'night' | 'latest') {
    // !!! ИСПРАВЛЕНИЕ: ВОЗВРАЩЕНА ФУНКЦИЯ ПАРСИНГА ВРЕМЕНИ !!!
    const parseMinutes = (str: string | null): number => {
        if (!str) return 0;
        const [h = '0', m = '0'] = str.split(':');
        return Number(h) * 60 + Number(m);
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
        const isNewBest = type === 'early' ? !existing || time < existing.time : !existing || time > existing.time;
        if (isNewBest) map[driver][it.date] = { time, label: timeStr };
    });

    const dates: string[] = [];
    for (let d = new Date(start); d <= new Date(end); d.setDate(d.getDate() + 1)) {
        dates.push(d.toISOString().split('T')[0]);
    }

    const drivers = Object.entries(map).map(([driver, byDate]) => {
        const times = dates.map((dt) => byDate[dt]?.label || '');
        const sortValues = Object.values(byDate).map(v => v.time);
        const sortVal = type === 'early' ? Math.min(...sortValues) : Math.max(...sortValues);
        return { driver, times, sortVal };
    }).sort((a, b) => type === 'early' ? a.sortVal - b.sortVal : b.sortVal - a.sortVal);
    
    return { dates, drivers };
}

// ----------------------------------------------------------------------
// 5. ГЛАВНЫЙ КОМПОНЕНТ
// ----------------------------------------------------------------------

export default function SummaryFeed({ initialData }: { initialData?: FeedData }) {
    const [modalData, setModalData] = useState<ModalData>({ isOpen: false, title: '', dates: [], drivers: [] });
    const [start, setStart] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 6);
        return d.toISOString().split('T')[0];
    });
    const [end, setEnd] = useState(() => new Date().toISOString().split('T')[0]);

    const { data, error, isLoading } = useSWR<FeedData>(`/api/summary-feed?start=${start}&end=${end}`, fetcher, { fallbackData: initialData });

    const handleOpenModal = useCallback(async (type: 'early' | 'night' | 'latest', title: string) => {
        try {
            const { dates, drivers } = await fetchAndProcessModalData(start, end, type);
            setModalData({ isOpen: true, title, dates, drivers });
        } catch (err) {
            console.error("Failed to open modal:", err);
            // Optionally, show an error toast to the user
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
    
    const headerDate = start === end 
        ? new Date(start).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        : `${new Date(start).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} - ${new Date(end).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`;

    const statItems = [
        { title: 'Total Orders', value: stats.total.toLocaleString(), icon: 'chart', colorClass: 'text-primary' },
        { title: 'Success', value: `${stats.successRate}%`, icon: 'award', colorClass: 'text-success' },
        { title: 'Failed', value: stats.failed, icon: 'xmark', colorClass: 'text-error' },
        { title: 'Late Arrival', value: stats.positiveArrivalTime, icon: 'clock', colorClass: 'text-warning' },
    ];
    
    return (
        <div className="p-4 sm:p-6 space-y-6 bg-base-100">
            <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Summary Feed</h1>
                    <p className="text-base-content/60">{headerDate}</p>
                </div>
                <div className="flex items-center gap-2">
                    <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="input input-bordered input-sm w-full sm:w-auto" />
                    <span className="text-base-content/60">to</span>
                    <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="input input-bordered input-sm w-full sm:w-auto" />
                </div>
            </header>

            <div className="divider m-0"></div>

            {error && <div className="alert alert-error">Could not load summary data. Please try again later.</div>}

            <div className="stats stats-vertical lg:stats-horizontal shadow w-full">
                {isLoading ? 
                    Array.from({length: 4}).map((_,i) => <div key={i} className="stat place-items-center h-24 bg-base-content/5 animate-pulse"></div>)
                    : statItems.map(item => <StatCard key={item.title} {...item} />)
                }
            </div>

            <main className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                 <InfoCard title="Top Contractors" subtitle="By average price" icon="star" isLoading={isLoading} isEmpty={!data?.topContractors?.length}>
                    {data?.topContractors?.slice(0, 4).map((c, i) => (
                        <RankedListItem key={c.contractor} rank={i} name={c.contractor} value={`£${c.avgPrice.toFixed(0)}`} />
                    ))}
                </InfoCard>
                <InfoCard title="Top Drivers" subtitle="By average price" icon="users" isLoading={isLoading} isEmpty={!data?.topDrivers?.length}>
                    {data?.topDrivers?.slice(0, 4).map((d, i) => (
                        <RankedListItem key={d.driver} rank={i} name={d.driver} value={`£${d.avgPrice.toFixed(0)}`} />
                    ))}
                </InfoCard>
                 <InfoCard title="Early Birds" subtitle="Drivers with earliest starts" icon="sunrise" onClick={() => handleOpenModal('early', 'Early Birds Start Times')} isLoading={isLoading} isEmpty={!data?.earliestDrivers?.length}>
                    {(data?.earliestDrivers || []).slice(0, 4).map((d) => (
                        <TimedListItem key={d.driver} name={d.driver} value={minutesToTime(d.time)} />
                    ))}
                </InfoCard>
                <InfoCard title="Night Owls" subtitle="Drivers with latest ends" icon="moon" onClick={() => handleOpenModal('night', 'Night Owls End Times')} isLoading={isLoading} isEmpty={!data?.latestDrivers?.length}>
                     {(data?.latestDrivers || []).slice(0, 4).map((d) => (
                        <TimedListItem key={d.driver} name={d.driver} value={minutesToTime(d.time)} />
                    ))}
                </InfoCard>
                {data?.latestEnd && (
                    <InfoCard title="Latest End" subtitle={data.latestEnd.driver} icon="clock" onClick={() => handleOpenModal('latest', 'Latest End Times')} isLoading={isLoading}>
                        <div className="text-center p-4">
                            <span className="font-mono text-4xl font-bold text-primary">{data.latestEnd.time}</span>
                        </div>
                    </InfoCard>
                )}
            </main>

            <DriverListModal data={modalData} onClose={() => setModalData(prev => ({ ...prev, isOpen: false }))} />
        </div>
    );
}