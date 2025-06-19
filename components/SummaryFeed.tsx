import { useEffect, useState } from 'react';
import Icon from './Icon';
import OrderMap from './OrderMap';

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
    <div className="flex flex-col h-[calc(100vh-220px)] space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-none">
        <div className="h-60 md:h-auto min-h-[200px] overflow-hidden">
          <OrderMap />
        </div>
        {topContractors.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700 shadow-sm">
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
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700 shadow-sm">
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
      </div>
      <div className="flex-1 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent pr-2">
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
          {latest && (
            <div className="flex gap-3">
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
            </div>
          )}
          {posts.map(p => {
            let info: any = null;
            try { info = JSON.parse(p.content); } catch { }
            return (
              <div
                key={p.id}
                className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm"
              >
                {info && info.topDrivers ? (
                  <div className="space-y-2 text-xs">
                    <div className="font-semibold text-sm">
                      {new Date(p.created_at).toLocaleDateString('en-GB')}
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <div className="bg-base-200 p-2 rounded">
                        <div>Total</div>
                        <div className="font-bold text-center">{info.total}</div>
                      </div>
                      <div className="bg-success/20 p-2 rounded text-success">
                        <div>Complete</div>
                        <div className="font-bold text-center">{info.complete}</div>
                      </div>
                      <div className="bg-error/20 p-2 rounded text-error">
                        <div>Failed</div>
                        <div className="font-bold text-center">{info.failed}</div>
                      </div>
                      <div className="bg-warning/20 p-2 rounded text-warning">
                        <div>Late TC</div>
                        <div className="font-bold text-center">{info.lateTC}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="font-semibold">Top Drivers</p>
                        <ul>
                          {info.topDrivers.map((d: any, i: number) => (
                            <li key={i}>{d.driver}: {d.complete}✓ {d.failed}✗</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="font-semibold">Top Postcodes</p>
                        <ul>
                          {info.topPostcodes.map((d: any, i: number) => (
                            <li key={i}>{d.postcode} ({d.count})</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="font-semibold">Top Auctions</p>
                        <ul>
                          {info.topAuctions.map((d: any, i: number) => (
                            <li key={i}>{d.auction} ({d.count})</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="font-semibold">Top Contractors</p>
                        <ul>
                          {info.topContractors.map((d: any, i: number) => (
                            <li key={i}>{d.contractor} ({d.count})</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-800 dark:text-gray-200 break-words">{p.content}</p>
                )}
              </div>
            );
          })}
        </>
      )}
      </div>
    </div>
  );
}
