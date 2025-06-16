import { useEffect, useState } from 'react';
import Icon from './Icon';

interface Summary {
  avgPriceTop3: number;
  topEndDrivers: { driver: string; time: string }[];
  topStartDrivers: { driver: string; time: string }[];
}

interface Post {
  id: number;
  content: string;
  created_at: string;
}

export default function SummaryFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<Summary | null>(null);

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
    fetch('/api/summary')
      .then(res => (res.ok ? res.json() : Promise.reject()))
      .then(data => {
        setSummary(data as Summary);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent pr-2">
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
            <Icon name="cash" className="text-[#b53133] w-5 h-5" />
            <div className="text-sm">
              <div className="text-gray-500 text-xs">Avg Price Top 3</div>
              <div className="font-semibold">£{summary.avgPriceTop3.toFixed(2)}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
            <Icon name="clock" className="text-[#b53133] w-5 h-5" />
            <div className="text-sm">
              <div className="text-gray-500 text-xs">Latest End</div>
              <div className="font-semibold">
                {summary.topEndDrivers.map(d => `${d.driver} (${d.time})`).join(', ')}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
            <Icon name="clock" className="text-[#b53133] w-5 h-5" />
            <div className="text-sm">
              <div className="text-gray-500 text-xs">Earliest Start</div>
              <div className="font-semibold">
                {summary.topStartDrivers.map(d => `${d.driver} (${d.time})`).join(', ')}
              </div>
            </div>
          </div>
        </div>
      )}
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
        posts.map(p => (
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
        ))
      )}
    </div>
  );
}