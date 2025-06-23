import { useEffect, useState } from 'react';

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

export default function SummaryFeed() {
  const [data, setData] = useState<FeedData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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

  const containerClass =
    'flex flex-col  space-y-4 p-4 overflow-y-auto';

  return (
    <div className={containerClass}>
      {/* Date Picker */}
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
      <p className="text-xs text-gray-500">Showing {start} to {end}</p>

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
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-800 dark:to-gray-850 rounded-xl border border-emerald-200/60 dark:border-gray-700/60 shadow-md overflow-hidden">
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
                    {data.earliestDrivers.slice(0, 3).map((driver) => (
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
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-850 rounded-xl border border-purple-200/60 dark:border-gray-700/60 shadow-md overflow-hidden">
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
                    {data.latestDrivers.slice(0, 3).map((driver) => (
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
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200/60 dark:border-gray-700/60 shadow-md overflow-hidden p-4">
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
    </div>
  );
}