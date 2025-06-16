import { useEffect, useState } from 'react';

interface Post {
  id: number;
  content: string;
  created_at: string;
}

interface SummaryData {
  date: string;
  total: number;
  complete: number;
  failed: number;
  best: string[];
  worst: string[];
  topContractors: { name: string; avg: number }[];
  earliestDrivers: { driver: string; time: number }[];
  latestDrivers: { driver: string; time: number }[];
}

export default function SummaryFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const formatMinutes = (m: number) => {
    const h = String(Math.floor(m / 60)).padStart(2, '0');
    const min = String(Math.round(m % 60)).padStart(2, '0');
    return `${h}:${min}`;
  };

  useEffect(() => {
    setIsLoading(true);
    fetch('/api/posts?type=summary')
      .then(res => (res.ok ? res.json() : Promise.reject()))
      .then(data => {
        setPosts(data.posts as Post[]);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent pr-2">
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
        posts.map(p => {
          let data: SummaryData | null = null;
          try {
            data = JSON.parse(p.content);
          } catch {
            /* ignore */
          }
          return (
            <div
              key={p.id}
              className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all duration-200 hover:border-[#b53133]/50"
            >
              {data ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                      {new Date(data.date).toLocaleDateString()}
                    </h3>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {data.complete}/{data.total} ✓ • {data.failed}✗
                    </div>
                  </div>
                  {data.topContractors.length > 0 && (
                    <div className="text-xs">
                      <div className="font-medium flex items-center gap-1 text-gray-700 dark:text-gray-300">
                        <i className="bi bi-star-fill text-[#b53133]"></i> Top Contractors
                      </div>
                      <ul className="list-disc ml-5 mt-1 space-y-0.5">
                        {data.topContractors.map(c => (
                          <li key={c.name}>{c.name}: £{c.avg.toFixed(2)}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {data.earliestDrivers.length > 0 && (
                      <div>
                        <div className="font-medium flex items-center gap-1 text-gray-700 dark:text-gray-300">
                          <i className="bi bi-clock"></i> Earliest
                        </div>
                        <ul className="list-disc ml-4 mt-1 space-y-0.5">
                          {data.earliestDrivers.map(e => (
                            <li key={e.driver}>{e.driver} {formatMinutes(e.time)}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {data.latestDrivers.length > 0 && (
                      <div>
                        <div className="font-medium flex items-center gap-1 text-gray-700 dark:text-gray-300">
                          <i className="bi bi-clock"></i> Latest
                        </div>
                        <ul className="list-disc ml-4 mt-1 space-y-0.5">
                          {data.latestDrivers.map(e => (
                            <li key={e.driver}>{e.driver} {formatMinutes(e.time)}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    <div>Best: {data.best.join(', ') || 'N/A'}</div>
                    <div>Worst: {data.worst.join(', ') || 'N/A'}</div>
                  </div>
                </div>
              ) : (
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
                  </div>
                </div>
              )}
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-2 text-right">
                {new Date(p.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </div>
          );
        })
      )}
    </div>
  );
}