import { useEffect, useState } from 'react';
import useSWR from 'swr';
import Modal from './Modal';

// Mock Icon component
const Icon = ({ name, className = '' }: { name: string; className?: string }) => {
  const icons: { [key: string]: string } = {
    star: '⭐',
    users: '👥',
    clock: '🕐',
    inbox: '📥',
    truck: '🚛',
    chart: '📊',
    trending: '📈',
    award: '🏆',
    calendar: '📅',
    activity: '📊',
  };
  return <span className={className}>{icons[name] || '📋'}</span>;
};

const DriverListModal = ({
  open,
  onClose,
  title,
  dates,
  drivers,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  dates: string[];
  drivers: { driver: string; times: string[] }[];
}) => {
  return (
    <Modal open={open} onClose={onClose} className="modal-box max-w-lg">
      <h2 className="text-lg font-bold mb-4">{title}</h2>
      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th className="text-left">Driver</th>
              {dates.map((d) => (
                <th key={d} className="text-right">
                  {d.slice(5)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {drivers.map((d) => (
              <tr key={d.driver}>
                <td className="whitespace-nowrap">{d.driver}</td>
                {d.times.map((t, idx) => (
                  <td key={idx} className="text-right font-mono">
                    {t || '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
};

// Type definitions
interface Post {
  id: number;
  content: string;
  created_at: string;
}

interface ContractorInfo {
  contractor: string;
  avgPrice: number;
}

interface DriverInfo {
  driver: string;
  contractor: string;
  avgPrice: number;
}

interface EarliestDriver {
  driver: string;
  time: number;
}

interface LatestDriver {
  driver: string;
  time: number;
}

export interface FeedData {
  posts: Post[];
  topContractors: ContractorInfo[];
  topDrivers: DriverInfo[];
  latestEnd: { driver: string; time: string } | null;
  date?: string;
  total?: number;
  complete?: number;
  failed?: number;
  positiveTimeCompleted?: number;
  positiveArrivalTime?: number;
  earliestDrivers: EarliestDriver[];
  latestDrivers: LatestDriver[];
}

// Helper function to convert minutes to time format
const minutesToTime = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

const getWeekNumber = (date: Date) => {
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  return Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};

const formatDisplayDate = (date: Date) =>
  date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function SummaryFeed({ initialData }: { initialData?: FeedData }) {
  const [modalType, setModalType] = useState<'' | 'early' | 'night' | 'latest'>('');
  const [modalDrivers, setModalDrivers] = useState<{
    driver: string;
    times: string[];
    sortVal: number;
  }[]>([]);
  const [modalDates, setModalDates] = useState<string[]>([]);
  const today = new Date();
  const defaultEnd = today.toISOString().split('T')[0];
  const defaultStartDate = new Date(today);
  defaultStartDate.setDate(defaultStartDate.getDate() - 6);
  const defaultStart = defaultStartDate.toISOString().split('T')[0];
  const [start, setStart] = useState<string>(defaultStart);
  const [end, setEnd] = useState<string>(defaultEnd);

  const { data, mutate } = useSWR<FeedData>(
    `/api/summary-feed?start=${start}&end=${end}`,
    fetcher,
    { fallbackData: initialData }
  );

  useEffect(() => {
    const handler = () => mutate();
    window.addEventListener('forceRefresh', handler);
    return () => window.removeEventListener('forceRefresh', handler);
  }, [mutate]);

  const posts = data?.posts || [];
  const topContractors = data?.topContractors || [];
  const topDrivers = data?.topDrivers || [];
  const latest = data?.latestEnd;
  const stats = {
    total: data?.total || 0,
    complete: data?.complete || 0,
    failed: data?.failed || 0,
    positiveTimeCompleted: data?.positiveTimeCompleted || 0,
    positiveArrivalTime: data?.positiveArrivalTime || 0,
    successRate: data?.total ? ((data.complete / data.total) * 100).toFixed(1) : '0',
  };

  const parseMinutes = (str: string | null) => {
    if (!str) return 0;
    const [h = '0', m = '0'] = str.split(':');
    return Number(h) * 60 + Number(m);
  };

  const openDriverModal = async (type: 'early' | 'night' | 'latest') => {
    try {
      const table =
        type === 'latest' ? 'copy_of_tomorrow_trips' : 'schedule_trips';
      const res = await fetch(
        `/api/driver-routes?start=${start}&end=${end}&table=${table}`
      );
      if (!res.ok) return;
      const json = await res.json();
      const map: Record<string, Record<string, { time: number; label: string }>> = {};
      json.items.forEach((it: any) => {
        const driver = it.driver || 'Unknown';
        const date = it.date;
        const startStr = it.start_time as string | null;
        const endStr = it.end_time as string | null;
        if (type === 'early' && startStr) {
          const t = parseMinutes(startStr);
          if (!map[driver]) map[driver] = {};
          if (!map[driver][date] || t < map[driver][date].time) {
            map[driver][date] = { time: t, label: startStr };
          }
        }
        if ((type === 'night' || type === 'latest') && endStr) {
          const t = parseMinutes(endStr);
          if (!map[driver]) map[driver] = {};
          if (!map[driver][date] || t > map[driver][date].time) {
            map[driver][date] = { time: t, label: endStr };
          }
        }
      });

      const dates: string[] = [];
      const sDate = new Date(start);
      const eDate = new Date(end);
      for (let d = new Date(sDate); d <= eDate; d.setDate(d.getDate() + 1)) {
        dates.push(d.toISOString().split('T')[0]);
      }

      let arr = Object.entries(map).map(([driver, byDate]) => {
        const times = dates.map((dt) => byDate[dt]?.label || '');
        const vals = Object.values(byDate).map((v) => v.time);
        const sortVal = type === 'early' ? Math.min(...vals) : Math.max(...vals);
        return { driver, times, sortVal };
      });

      arr.sort((a, b) => (type === 'early' ? a.sortVal - b.sortVal : b.sortVal - a.sortVal));

      setModalDates(dates);
      setModalDrivers(arr);
      setModalType(type);
    } catch {}
  };

  const startDate = new Date(start);
  const endDate = new Date(end);

  let header = '';
  let subheader = '';
  if (start === end) {
    header = formatDisplayDate(startDate);
  } else {
    const sw = getWeekNumber(startDate);
    const ew = getWeekNumber(endDate);
    header = sw === ew ? `Week ${sw}` : `Week ${sw}-${ew}`;
    subheader = `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`;
  }

  return (
    <div className="card bg-base-100 shadow-xl p-4">
      {/* Date Picker */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="input input-bordered input-sm"
          />
          <span>-</span>
          <input
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="input input-bordered input-sm"
          />
        </div>
        <div className="text-right">
          <h2 className="text-lg font-bold">{header}</h2>
          {subheader && <p className="text-sm text-base-content/60">{subheader}</p>}
        </div>
      </div>

      {/* Compact Statistics Bar */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="card bg-primary text-primary-content shadow-md">
            <div className="card-body p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">Total Orders</p>
                  <p className="text-xl font-bold">{stats.total.toLocaleString()}</p>
                </div>
                <Icon name="chart" className="text-2xl" />
              </div>
            </div>
          </div>
          <div className="card bg-success text-success-content shadow-md">
            <div className="card-body p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">Success Rate</p>
                  <p className="text-xl font-bold">{stats.successRate}%</p>
                </div>
                <Icon name="award" className="text-2xl" />
              </div>
            </div>
          </div>
          <div className="card bg-accent text-accent-content shadow-md">
            <div className="card-body p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">Completed</p>
                  <p className="text-xl font-bold">{stats.complete.toLocaleString()}</p>
                </div>
                <Icon name="activity" className="text-2xl" />
              </div>
            </div>
          </div>
          <div className="card bg-error text-error-content shadow-md">
            <div className="card-body p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">Failed</p>
                  <p className="text-xl font-bold">{stats.failed}</p>
                </div>
                <Icon name="trending" className="text-2xl" />
              </div>
            </div>
          </div>
          <div className="card bg-warning text-warning-content shadow-md">
            <div className="card-body p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">Late Arr</p>
                  <p className="text-xl font-bold">{stats.positiveArrivalTime}</p>
                </div>
                <Icon name="clock" className="text-2xl" />
              </div>
            </div>
          </div>
          <div className="card bg-info text-info-content shadow-md">
            <div className="card-body p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">Late TC</p>
                  <p className="text-xl font-bold">{stats.positiveTimeCompleted}</p>
                </div>
                <Icon name="clock" className="text-2xl" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 gap-4">
        {/* Stats Panel */}
        <div className="grid grid-cols-1 gap-4">
          {/* Top Row - Rankings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top Contractors */}
            {topContractors.length > 0 && (
              <div className="card bg-base-100 shadow-md">
                <div className="card-body">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="avatar">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                        <Icon name="star" className="text-white text-sm" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Top Contractors</h3>
                      <p className="text-sm text-base-content/60">Best performers</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {topContractors.slice(0, 4).map((c, index) => {
                      const getRankBadge = (pos: number) => {
                        if (pos === 0) return { icon: '🥇', bg: 'bg-yellow-400' };
                        if (pos === 1) return { icon: '🥈', bg: 'bg-gray-300' };
                        if (pos === 2) return { icon: '🥉', bg: 'bg-orange-400' };
                        return { icon: (pos + 1).toString(), bg: 'bg-amber-400' };
                      };

                      const badge = getRankBadge(index);

                      return (
                        <div
                          key={c.contractor}
                          className="card bg-base-200 hover:bg-base-300 transition-all duration-200"
                        >
                          <div className="card-body p-3 flex-row items-center justify-between">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <div
                                className={`w-6 h-6 rounded-md ${badge.bg} flex items-center justify-center text-xs font-bold text-white`}
                              >
                                {badge.icon}
                              </div>
                              <span className="text-sm truncate">{c.contractor}</span>
                            </div>
                            <div className="text-sm font-bold text-amber-600">
                              £{c.avgPrice.toFixed(0)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Top Drivers */}
            {topDrivers.length > 0 && (
              <div className="card bg-base-100 shadow-md">
                <div className="card-body">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="avatar">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                        <Icon name="users" className="text-white text-sm" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Top Drivers</h3>
                      <p className="text-sm text-base-content/60">Best performers</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {topDrivers.slice(0, 4).map((d, index) => {
                      const getRankBadge = (pos: number) => {
                        if (pos === 0) return { icon: '🥇', bg: 'bg-yellow-400' };
                        if (pos === 1) return { icon: '🥈', bg: 'bg-gray-300' };
                        if (pos === 2) return { icon: '🥉', bg: 'bg-orange-400' };
                        return { icon: (pos + 1).toString(), bg: 'bg-blue-400' };
                      };

                      const badge = getRankBadge(index);

                      return (
                        <div
                          key={d.driver}
                          className="card bg-base-200 hover:bg-base-300 transition-all duration-200"
                        >
                          <div className="card-body p-3 flex-row items-center justify-between">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <div
                                className={`w-6 h-6 rounded-md ${badge.bg} flex items-center justify-center text-xs font-bold text-white`}
                              >
                                {badge.icon}
                              </div>
                              <span className="text-sm truncate">{d.driver}</span>
                            </div>
                            <div className="text-sm font-bold text-blue-600">
                              £{d.avgPrice.toFixed(0)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Row - Driver Times */}
          {data && data.earliestDrivers.length > 0 && data.latestDrivers.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Early Birds */}
              <div
                className="card bg-base-100 shadow-md cursor-pointer"
                onClick={() => openDriverModal('early')}
              >
                <div className="card-body">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="avatar">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                        <span className="text-white text-sm">🌅</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Early Birds</h3>
                      <p className="text-sm text-base-content/60">First starts</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {data.earliestDrivers.slice(0, 5).map((driver) => (
                      <div
                        key={driver.driver}
                        className="card bg-base-200"
                      >
                        <div className="card-body p-3 flex-row items-center justify-between">
                          <span className="text-sm truncate pr-2">{driver.driver}</span>
                          <span className="text-sm font-bold text-emerald-600 font-mono">
                            {minutesToTime(driver.time)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Night Owls */}
              <div
                className="card bg-base-100 shadow-md cursor-pointer"
                onClick={() => openDriverModal('night')}
              >
                <div className="card-body">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="avatar">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <span className="text-white text-sm">🌙</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Night Owls</h3>
                      <p className="text-sm text-base-content/60">Latest ends</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {data.latestDrivers.slice(0, 5).map((driver) => (
                      <div
                        key={driver.driver}
                        className="card bg-base-200"
                      >
                        <div className="card-body p-3 flex-row items-center justify-between">
                          <span className="text-sm truncate pr-2">{driver.driver}</span>
                          <span className="text-sm font-bold text-purple-600 font-mono">
                            {minutesToTime(driver.time)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Latest End Section */}
      {latest && (
        <div
          className="card bg-base-100 shadow-md cursor-pointer"
          onClick={() => openDriverModal('latest')}
        >
          <div className="card-body p-4 flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="avatar">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                  <Icon name="clock" className="text-white text-sm" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold">Latest End</h3>
                <span className="text-sm text-base-content/70">{latest.driver}</span>
              </div>
            </div>
            <span className="badge badge-neutral font-mono">{latest.time}</span>
          </div>
        </div>
      )}

      {modalType && (
        <DriverListModal
          open={!!modalType}
          onClose={() => setModalType('')}
          title={
            modalType === 'early'
              ? 'Early Birds'
              : modalType === 'night'
              ? 'Night Owls'
              : 'Latest End'
          }
          dates={modalDates}
          drivers={modalDrivers}
        />
      )}
    </div>
  );
}