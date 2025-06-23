import { useEffect, useState } from 'react';

// Mock Icon component since we don't have the actual one
const Icon = ({ name, className = '' }) => {
  const icons = {
    star: '⭐',
    users: '👥',
    clock: '🕐',
    inbox: '📥',
    truck: '🚛',
    chart: '📊',
    trending: '📈',
    award: '🏆',
    calendar: '📅',
    activity: '📊'
  };
  return <span className={className}>{icons[name] || '📋'}</span>;
};

// Mock OrderMap component
const OrderMap = () => (
  <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center rounded-lg">
    <div className="text-center">
      <div className="text-4xl mb-2">🗺️</div>
      <p className="text-sm text-gray-600 dark:text-gray-400">Interactive Order Map</p>
    </div>
  </div>
);

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
  earliestDrivers?: EarliestDriver[];
  latestDrivers?: LatestDriver[];
}

// Helper function to convert minutes to time format
const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

export default function SummaryFeed() {
  const [data, setData] = useState<FeedData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock data for demonstration
    const mockData: FeedData = {
      posts: [
        {
          id: 1,
          content: "Successful delivery completed in record time! Great teamwork from all contractors today.",
          created_at: "2025-06-18T10:30:00Z"
        },
        {
          id: 2,
          content: "New efficiency improvements implemented across all routes. Expecting 15% performance boost.",
          created_at: "2025-06-18T08:15:00Z"
        },
        {
          id: 3,
          content: "Weather conditions optimal for delivery operations. All systems running smoothly.",
          created_at: "2025-06-17T16:45:00Z"
        }
      ],
      topContractors: [
        { contractor: "Express Logistics Ltd", avgPrice: 145.50 },
        { contractor: "Swift Transport Co", avgPrice: 132.75 },
        { contractor: "Premier Delivery", avgPrice: 128.90 }
      ],
      topDrivers: [
        { driver: "John Smith", contractor: "Express Logistics", avgPrice: 98.25 },
        { driver: "Maria Rodriguez", contractor: "Swift Transport", avgPrice: 95.80 },
        { driver: "Ahmed Hassan", contractor: "Premier Delivery", avgPrice: 92.15 }
      ],
      latestEnd: { driver: "Ion Marius", time: "21:53" },
      date: "2025-06-18",
      total: 1688,
      complete: 1607,
      failed: 81,
      earliestDrivers: [
        { driver: "Busulea Sorin", time: 360 },
        { driver: "Marinescu Claudiu-Constantin", time: 360 },
        { driver: "Sandu Ionut Robert", time: 360 }
      ],
      latestDrivers: [
        { driver: "Ion Marius", time: 1313.93 },
        { driver: "Dragoi David", time: 1310.8 },
        { driver: "Vasile Fernando", time: 1306.5 }
      ]
    };

    setTimeout(() => {
      setData(mockData);
      setIsLoading(false);
    }, 1000);
  }, []);

  const posts = data?.posts || [];
  const topContractors = data?.topContractors || [];
  const topDrivers = data?.topDrivers || [];
  const latest = data?.latestEnd;
  const stats = {
    total: data?.total || 0,
    complete: data?.complete || 0,
    failed: data?.failed || 0,
    successRate: data?.total ? ((data.complete / data.total) * 100).toFixed(1) : '0'
  };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] space-y-6 p-4 bg-gray-50 dark:bg-gray-900">
      {/* Daily Statistics Bar */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Orders</p>
                <p className="text-2xl font-bold">{stats.total.toLocaleString()}</p>
              </div>
              <Icon name="chart" className="text-3xl opacity-80" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Completed</p>
                <p className="text-2xl font-bold">{stats.complete.toLocaleString()}</p>
              </div>
              <Icon name="activity" className="text-3xl opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">Failed</p>
                <p className="text-2xl font-bold">{stats.failed}</p>
              </div>
              <Icon name="trending" className="text-3xl opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Success Rate</p>
                <p className="text-2xl font-bold">{stats.successRate}%</p>
              </div>
              <Icon name="award" className="text-3xl opacity-80" />
            </div>
          </div>
        </div>
      )}

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1">
        {/* Map - takes 2 columns */}
        <div className="lg:col-span-2 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl overflow-hidden border border-gray-200/60 dark:border-gray-700/60 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="h-full relative">
            <div className="absolute top-4 left-4 z-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Live Orders</span>
              </div>
            </div>
            <OrderMap />
          </div>
        </div>

        {/* Top Contractors */}
        {topContractors.length > 0 && (
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-850 rounded-2xl border border-amber-200/60 dark:border-gray-700/60 shadow-lg overflow-hidden">
            <div className="p-5 h-full flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-md">
                  <Icon name="star" className="text-white text-lg" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Top Contractors</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Best performing contractors</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-amber-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent pr-2">
                {topContractors.map((c, index) => {
                  const getRankIcon = (position: number) => {
                    if (position === 0) return { icon: "🥇", bg: "from-yellow-400 to-yellow-600", text: "text-yellow-900" };
                    if (position === 1) return { icon: "🥈", bg: "from-gray-300 to-gray-500", text: "text-gray-900" };
                    if (position === 2) return { icon: "🥉", bg: "from-orange-400 to-orange-600", text: "text-orange-900" };
                    return { icon: (index + 1).toString(), bg: "from-amber-400 to-orange-400", text: "text-white" };
                  };
                  
                  const rank = getRankIcon(index);
                  
                  return (
                    <div key={c.contractor} className="bg-white/70 dark:bg-gray-700/50 backdrop-blur-sm rounded-xl p-3 border border-amber-200/40 dark:border-gray-600/40 hover:bg-white/90 dark:hover:bg-gray-700/70 transition-all duration-200 hover:scale-105">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 bg-gradient-to-br ${rank.bg} rounded-xl flex items-center justify-center shadow-md ${rank.text} font-bold text-sm`}>
                            <span className="text-lg">{rank.icon}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 block truncate">
                              {c.contractor}
                            </span>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {index < 3 ? (
                                <span className="font-medium">
                                  {index === 0 ? "Gold Medal" : index === 1 ? "Silver Medal" : "Bronze Medal"}
                                </span>
                              ) : (
                                "Contractor"
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
                            £{c.avgPrice.toFixed(2)}
                          </div>
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
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-850 rounded-2xl border border-blue-200/60 dark:border-gray-700/60 shadow-lg overflow-hidden">
            <div className="p-5 h-full flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-md">
                  <Icon name="users" className="text-white text-lg" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Top Drivers</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Best performing drivers</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-blue-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent pr-2">
                {topDrivers.map((d, index) => {
                  const getRankIcon = (position: number) => {
                    if (position === 0) return { icon: "🥇", bg: "from-yellow-400 to-yellow-600", text: "text-yellow-900" };
                    if (position === 1) return { icon: "🥈", bg: "from-gray-300 to-gray-500", text: "text-gray-900" };
                    if (position === 2) return { icon: "🥉", bg: "from-orange-400 to-orange-600", text: "text-orange-900" };
                    return { icon: (index + 1).toString(), bg: "from-blue-400 to-indigo-400", text: "text-white" };
                  };
                  
                  const rank = getRankIcon(index);
                  
                  return (
                    <div key={d.driver} className="bg-white/70 dark:bg-gray-700/50 backdrop-blur-sm rounded-xl p-3 border border-blue-200/40 dark:border-gray-600/40 hover:bg-white/90 dark:hover:bg-gray-700/70 transition-all duration-200 hover:scale-105">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 bg-gradient-to-br ${rank.bg} rounded-xl flex items-center justify-center shadow-md ${rank.text} font-bold text-sm`}>
                            <span className="text-lg">{rank.icon}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 block truncate">
                              {d.driver}
                            </span>
                            <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                              {index < 3 ? (
                                <span className="font-medium">
                                  {index === 0 ? "Gold Medal" : index === 1 ? "Silver Medal" : "Bronze Medal"}
                                </span>
                              ) : (
                                d.contractor
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                            £{d.avgPrice.toFixed(2)}
                          </div>
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

      {/* Bottom section with posts and driver times */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[300px]">
        {/* Posts section - takes 2 columns */}
        <div className="lg:col-span-2 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent pr-2">
          {/* Latest End Card */}
          {latest && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-850 rounded-2xl p-4 border border-green-200/60 dark:border-gray-700/60 shadow-md hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-md">
                  <Icon name="clock" className="text-white text-xl" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100">Latest End</h4>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{latest.driver}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400 bg-white/60 dark:bg-gray-700/60 px-3 py-1 rounded-lg font-mono">
                      {latest.time}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Posts */}
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 animate-pulse shadow-md"
                >
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                    <div className="flex-1 space-y-3">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-850 rounded-2xl border border-gray-200/60 dark:border-gray-700/60">
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <Icon name="inbox" className="text-4xl text-gray-400" />
              </div>
              <p className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">No posts available</p>
              <p className="text-sm text-gray-500 dark:text-gray-500">Check back later for updates!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map(p => (
                <div
                  key={p.id}
                  className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 shadow-md hover:shadow-lg transition-all duration-300 hover:border-[#b53133]/40 group hover:scale-[1.02]"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#b53133]/20 to-[#b53133]/40 flex items-center justify-center group-hover:from-[#b53133]/30 group-hover:to-[#b53133]/50 transition-all duration-300">
                        <svg className="w-6 h-6 text-[#b53133]" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M18 3a1 1 0 00-1.196-.98L5 4l.002 7 11.804-2.018A1 1 0 0018 8V3z"/>
                          <path d="M5 11V4L2 3a1 1 0 00-1 .98v10.04A1 1 0 002 15l3-1z"/>
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-base text-gray-800 dark:text-gray-200 break-words leading-relaxed mb-3">
                        {p.content}
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(p.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Driver Times section */}
        {data?.earliestDrivers && data?.latestDrivers && (
          <div className="space-y-4">
            {/* Earliest Drivers */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-800 dark:to-gray-850 rounded-2xl border border-emerald-200/60 dark:border-gray-700/60 shadow-lg overflow-hidden">
              <div className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-md">
                    <span className="text-white text-lg">🌅</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Early Birds</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Earliest start times</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {data.earliestDrivers.slice(0, 3).map((driver, index) => (
                    <div key={driver.driver} className="bg-white/70 dark:bg-gray-700/50 backdrop-blur-sm rounded-lg p-3 border border-emerald-200/40 dark:border-gray-600/40">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate pr-2">
                          {driver.driver}
                        </span>
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                          {minutesToTime(driver.time)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Latest Drivers */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-850 rounded-2xl border border-purple-200/60 dark:border-gray-700/60 shadow-lg overflow-hidden">
              <div className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-md">
                    <span className="text-white text-lg">🌙</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Night Owls</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Latest end times</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {data.latestDrivers.slice(0, 3).map((driver, index) => (
                    <div key={driver.driver} className="bg-white/70 dark:bg-gray-700/50 backdrop-blur-sm rounded-lg p-3 border border-purple-200/40 dark:border-gray-600/40">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate pr-2">
                          {driver.driver}
                        </span>
                        <span className="text-sm font-bold text-purple-600 dark:text-purple-400 font-mono">
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
  );
}
