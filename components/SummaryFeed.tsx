import { useEffect, useState } from 'react';
import Icon from './Icon';

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

interface FeedData {
  posts: Post[];
  topContractors: ContractorInfo[];
  topDrivers: DriverInfo[];
  latestEnd: { driver: string; time: string } | null;
}

export default function SummaryFeed() {
  const [data, setData] = useState<FeedData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetch('/api/summary-feed')
      .then(res => (res.ok ? res.json() : Promise.reject()))
      .then(d => {
        setData(d as FeedData);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, []);

  const posts = data?.posts || [];
  const topContractors = data?.topContractors || [];
  const topDrivers = data?.topDrivers || [];
  const latest = data?.latestEnd;

  return (
<<<<<<< HEAD
<<<<<<< HEAD
    <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-220px)]">
      <div className="w-full md:w-1/2 min-w-[250px] h-60 md:h-auto overflow-hidden">
        <OrderMap />
      </div>
      <div className="flex-1 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent pr-2">
=======
    <div className="space-y-4 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent pr-2">
>>>>>>> parent of 7e13185 (Merge pull request #216 from olegromashkan/codex/implement-optimized-uk-region-map-with-order-data)
=======
    <div className="space-y-4 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent pr-2">
>>>>>>> parent of 7e13185 (Merge pull request #216 from olegromashkan/codex/implement-optimized-uk-region-map-with-order-data)
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-base-200 p-4 rounded-xl border border-base-300 animate-pulse"
            >
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 py-6">
          <p className="text-sm font-medium">No posts available</p>
          <p className="text-xs">Check back later for updates!</p>
        </div>
      ) : (
        <>
          <div className="flex gap-3">
            {topContractors.length > 0 && (
              <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                  <Icon name="star" className="w-4 h-4 text-yellow-500" />
                  Top Contractors
                </div>
                <div className="space-y-1 text-xs">
                  {topContractors.map((c) => (
                    <div key={c.contractor} className="flex justify-between">
                      <span className="truncate max-w-[120px]">{c.contractor}</span>
                      <span className="font-medium">£{c.avgPrice.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {topDrivers.length > 0 && (
              <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                  <Icon name="users" className="w-4 h-4" />
                  Top Drivers
                </div>
                <div className="space-y-1 text-xs">
                  {topDrivers.map((d) => (
                    <div key={d.driver} className="flex justify-between">
                      <span className="truncate max-w-[140px]">{d.driver} ({d.contractor})</span>
                      <span className="font-medium">£{d.avgPrice.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {latest && (
              <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center gap-2 mb-1 text-sm font-semibold text-gray-700 dark:text-gray-200">
                    <Icon name="clock" className="w-4 h-4" />
                    Latest End
                  </div>
                  <div className="text-xs flex justify-between">
                    <span className="truncate max-w-[100px]">{latest.driver}</span>
                    <span>{latest.time}</span>
                  </div>
                </div>
            )}
          </div>
          {posts.map(p => (
            <div
              key={p.id}
              className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all duration-200 hover:border-[#b53133]/50"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#b53133]/20 to-[#b53133]/40 flex items-center justify-center">
                    <svg className="w-5 h-5 text-[#b53133]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12zm0-10a1 1 0 100 2 1 1 0 000-2zm0 4a1 1 0 100 2 1 1 0 000-2z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-800 dark:text-gray-200 break-words">{p.content}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {new Date(p.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}