import { useEffect, useState } from 'react';
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
  drivers,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  drivers: { driver: string; label: string; date: string }[];
}) => {
  return (
    <Modal open={open} onClose={onClose} className="max-w-md">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      <div className="max-h-80 overflow-y-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-1">Driver</th>
              <th className="text-left py-1">Date</th>
              <th className="text-right py-1">Time</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((d) => (
              <tr key={d.driver + d.label + d.date} className="border-b last:border-b-0">
                <td className="pr-2 whitespace-nowrap">{d.driver}</td>
                <td className="pr-2 whitespace-nowrap">{d.date}</td>
                <td className="text-right font-mono whitespace-nowrap">{d.label}</td>
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

interface FeedData {
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
  earliestDrivers?: EarliestDriver[];
  latestDrivers?: LatestDriver[];
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

export default function SummaryFeed() {
  const [data, setData] = useState<FeedData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [modalType, setModalType] = useState<'' | 'early' | 'night' | 'latest'>('');
  const [modalDrivers, setModalDrivers] = useState<{
    driver: string;
    label: string;
    time: number;
    date: string;
  }[]>([]);
  const today = new Date();
  const defaultEnd = today.toISOString().split('T')[0];
  const defaultStartDate = new Date(today);
  defaultStartDate.setDate(defaultStartDate.getDate() - 6);
  const defaultStart = defaultStartDate.toISOString().split('T')[0];
  const [start, setStart] = useState<string>(defaultStart);
  const [end, setEnd] = useState<string>(defaultEnd);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/summary-feed?start=${start}&end=${end}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((json: FeedData) => {
        let extra = {};
        const first = json.posts && json.posts[0];
        if (first) {
          try {
            const summary = JSON.parse(first.content);
            if (summary && typeof summary === 'object') {
              extra = {
                date: summary.date,
                total: summary.total,
                complete: summary.complete,
                failed: summary.failed,
                earliestDrivers: summary.earliestDrivers,
                latestDrivers: summary.latestDrivers,
              };
            }
          } catch {
            // content was plain text; ignore
          }
        }
        setData({ ...json, ...extra });
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [start, end]);

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
    if (!data?.date) return;
    try {
      const res = await fetch(`/api/driver-routes?start=${data.date}&end=${data.date}`);
      if (!res.ok) return;
      const json = await res.json();
      const map: Record<string, { time: number; label: string; date: string }> = {};
      json.items.forEach((it: any) => {
        const driver = it.driver || 'Unknown';
        const start = it.start_time as string | null;
        const end = it.end_time as string | null;
        if (type === 'early' && start) {
          const t = parseMinutes(start);
          if (!map[driver] || t < map[driver].time)
            map[driver] = { time: t, label: start, date: it.date };
        }
        if ((type === 'night' || type === 'latest') && end) {
          const t = parseMinutes(end);
          if (!map[driver] || t > map[driver].time)
            map[driver] = { time: t, label: end, date: it.date };
        }
      });
      let arr = Object.entries(map).map(([driver, v]) => ({ driver, time: v.time, label: v.label, date: v.date }));
      arr.sort((a, b) => (type === 'early' ? a.time - b.time : b.time - a.time));
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

  const containerClass =
    'flex flex-col  space-y-4 p-4 overflow-y-auto';

  return (
    <div className={containerClass}>
      {/* Date Picker */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 text-sm">
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="border rounded px-1 py-0.5"
          />
          <span>-</span>
          <input
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="border rounded px-1 py-0.5"
          />
        </div>
        <div className="text-right leading-tight">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200">{header}</h2>
          {subheader && (
            <p className="text-xs text-gray-500 dark:text-gray-400">{subheader}</p>
          )}
        </div>
      </div>

      {/* Compact Statistics Bar */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-3 text-white shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs font-medium">Total Orders</p>
                <p className="text-xl font-bold">{stats.total.toLocaleString()}</p>
              </div>
              <Icon name="chart" className="text-2xl opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-3 text-white shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-xs font-medium">Completed</p>
                <p className="text-xl font-bold">{stats.complete.toLocaleString()}</p>
              </div>
              <Icon name="activity" className="text-2xl opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-3 text-white shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-xs font-medium">Failed</p>
                <p className="text-xl font-bold">{stats.failed}</p>
              </div>
              <Icon name="trending" className="text-2xl opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-3 text-white shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-xs font-medium">Late TC</p>
                <p className="text-xl font-bold">{stats.positiveTimeCompleted}</p>
              </div>
              <Icon name="clock" className="text-2xl opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-3 text-white shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-xs font-medium">Late Arr</p>
                <p className="text-xl font-bold">{stats.positiveArrivalTime}</p>
              </div>
              <Icon name="clock" className="text-2xl opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-3 text-white shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-xs font-medium">Success Rate</p>
                <p className="text-xl font-bold">{stats.successRate}%</p>
              </div>
              <Icon name="award" className="text-2xl opacity-80" />
            </div>
          </div>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 gap-4 flex-1 min-h-0">
        {/* Stats Panel */}
        <div className="grid grid-rows-2 gap-4">
          {/* Top Row - Rankings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top Contractors */}
            {topContractors.length > 0 && (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-850 rounded-xl border border-amber-200/60 dark:border-gray-700/60 shadow-md overflow-hidden">
                <div className="p-3 h-full flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                      <Icon name="star" className="text-white text-sm" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">Top Contractors</h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Best performers</p>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-amber-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                    {topContractors.slice(0, 4).map((c, index) => {
                      const getRankBadge = (pos: number) => {
                        if (pos === 0) return { icon: '🥇', bg: 'from-yellow-400 to-yellow-600' };
                        if (pos === 1) return { icon: '🥈', bg: 'from-gray-300 to-gray-500' };
                        if (pos === 2) return { icon: '🥉', bg: 'from-orange-400 to-orange-600' };
                        return { icon: (pos + 1).toString(), bg: 'from-amber-400 to-orange-400' };
                      };

                      const badge = getRankBadge(index);

                      return (
                        <div
                          key={c.contractor}
                          className="bg-white/70 dark:bg-gray-700/50 rounded-lg p-2 border border-amber-200/40 dark:border-gray-600/40 hover:bg-white/90 dark:hover:bg-gray-700/70 transition-all duration-200"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <div
                                className={`w-6 h-6 bg-gradient-to-br ${badge.bg} rounded-md flex items-center justify-center text-xs font-bold text-white`}
                              >
                                {badge.icon}
                              </div>
                              <span className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                                {c.contractor}
                              </span>
                            </div>
                            <div className="text-xs font-bold text-amber-600 dark:text-amber-400">
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
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-850 rounded-xl border border-blue-200/60 dark:border-gray-700/60 shadow-md overflow-hidden">
                <div className="p-3 h-full flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                      <Icon name="users" className="text-white text-sm" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">Top Drivers</h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Best performers</p>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-blue-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                    {topDrivers.slice(0, 4).map((d, index) => {
                      const getRankBadge = (pos: number) => {
                        if (pos === 0) return { icon: '🥇', bg: 'from-yellow-400 to-yellow-600' };
                        if (pos === 1) return { icon: '🥈', bg: 'from-gray-300 to-gray-500' };
                        if (pos === 2) return { icon: '🥉', bg: 'from-orange-400 to-orange-600' };
                        return { icon: (pos + 1).toString(), bg: 'from-blue-400 to-indigo-400' };
                      };

                      const badge = getRankBadge(index);

                      return (
                        <div
                          key={d.driver}
                          className="bg-white/70 dark:bg-gray-700/50 rounded-lg p-2 border border-blue-200/40 dark:border-gray-600/40 hover:bg-white/90 dark:hover:bg-gray-700/70 transition-all duration-200"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <div
                                className={`w-6 h-6 bg-gradient-to-br ${badge.bg} rounded-md flex items-center justify-center text-xs font-bold text-white`}
                              >
                                {badge.icon}
                              </div>
                              <span className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                                {d.driver}
                              </span>
                            </div>
                            <div className="text-xs font-bold text-blue-600 dark:text-blue-400">
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
          {data?.earliestDrivers && data?.latestDrivers && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Early Birds */}
              <div
                className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-800 dark:to-gray-850 rounded-xl border border-emerald-200/60 dark:border-gray-700/60 shadow-md overflow-hidden cursor-pointer"
                onClick={() => openDriverModal('early')}
              >
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm">🌅</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">Early Birds</h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400">First starts</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {data.earliestDrivers.slice(0, 5).map((driver) => (
                      <div
                        key={driver.driver}
                        className="bg-white/70 dark:bg-gray-700/50 rounded-lg p-2 border border-emerald-200/40 dark:border-gray-600/40"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate pr-2">
                            {driver.driver}
                          </span>
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
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
                className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-850 rounded-xl border border-purple-200/60 dark:border-gray-700/60 shadow-md overflow-hidden cursor-pointer"
                onClick={() => openDriverModal('night')}
              >
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm">🌙</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">Night Owls</h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Latest ends</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {data.latestDrivers.slice(0, 5).map((driver) => (
                      <div
                        key={driver.driver}
                        className="bg-white/70 dark:bg-gray-700/50 rounded-lg p-2 border border-purple-200/40 dark:border-gray-600/40"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate pr-2">
                            {driver.driver}
                          </span>
                          <span className="text-xs font-bold text-purple-600 dark:text-purple-400 font-mono">
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
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200/60 dark:border-gray-700/60 shadow-md overflow-hidden p-4 cursor-pointer"
          onClick={() => openDriverModal('latest')}
        >
          <div className="flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-700 dark:to-gray-750 rounded-lg p-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <Icon name="clock" className="text-white text-sm" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">Latest End</h3>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{latest.driver}</span>
              </div>
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400 bg-white/60 dark:bg-gray-600/60 px-2 py-1 rounded font-mono">
              {latest.time}
            </span>
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
          drivers={modalDrivers}
        />
      )}
    </div>
  );
}