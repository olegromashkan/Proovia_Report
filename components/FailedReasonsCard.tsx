import { useMemo } from 'react';
import { getFailureReason } from '../lib/failureReason'; // Assuming this function exists

// --- Interfaces ---
interface Trip {
  ID: string;
  Status: 'Failed' | 'Success' | string;
  Notes: string;
  [key: string]: any;
}

interface FailureReason {
  reason: string;
  count: number;
  percentage: number;
}

// --- Icons (can be moved to a separate file) ---
const ChartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
  </svg>
);

const ListIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
);

const StatsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
    </svg>
);


// --- Main Component ---
export default function FailedReasonsCard({
  trips,
  onClick,
}: {
  trips: Trip[];
  onClick?: () => void;
}) {
  // Memoized calculations for failure metrics
  const { counts, totalFailed, totalTrips, failureRate, topReason } = useMemo(() => {
    const map: Record<string, number> = {};
    let failed = 0;

    trips.forEach((t) => {
      if (t.Status === 'Failed') {
        failed++;
        const reason = getFailureReason(t.Notes);
        map[reason] = (map[reason] || 0) + 1;
      }
    });

    const sortedEntries = Object.entries(map).sort(([, a], [, b]) => b - a);
    const topReasonData = sortedEntries[0] || ['N/A', 0];

    return {
      counts: map,
      totalFailed: failed,
      totalTrips: trips.length,
      failureRate: trips.length > 0 ? (failed / trips.length) * 100 : 0,
      topReason: { name: topReasonData[0], count: topReasonData[1] },
    };
  }, [trips]);

  // Memoized sorted reasons for chart and breakdown
  const sortedReasons = useMemo<FailureReason[]>(() => {
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .map(([reason, count]) => ({
        reason,
        count,
        percentage: totalFailed > 0 ? (count / totalFailed) * 100 : 0,
      }));
  }, [counts, totalFailed]);

  // Color palette
  const colors = [
    '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e',
    '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b',
  ];

  const isEmpty = totalFailed === 0;

  return (
    <div
      onClick={onClick}
      className={`bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 shadow-lg min-w-[250px] text-white cursor-pointer ${onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
    >
      <h3 className="font-bold text-lg mb-3 opacity-90">Failure Analysis</h3>
      
      {isEmpty ? (
        <div className="flex flex-1 items-center justify-center text-center">
          <div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-700">No Failures Found!</p>
            <p className="text-xs text-gray-500">{totalTrips} trips completed successfully.</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 min-w-0 space-x-4">
          
          {/* Block 1: Key Metric */}
          <div className="flex-shrink-0 w-36 border-r border-gray-200 pr-4">
            <div className="flex items-center space-x-2 mb-3">
               <StatsIcon />
               <h4 className="text-sm font-semibold">Summary</h4>
            </div>
            <div className="space-y-2">
                <div className="text-xs">
                    <p >Failure Rate</p>
                    <p className="font-bold text-2xl text-yellow-600">{failureRate.toFixed(1)}<span className="text-lg">%</span></p>
                </div>
            </div>
          </div>

          {/* Block 2: Distribution */}
          <div className="flex-1 min-w-0 border-r border-gray-200 pr-4">
             <div className="flex items-center space-x-2 mb-3">
                <ChartIcon />
                <h4 className="text-sm font-semibold">Reason Distribution</h4>
            </div>
            <div className="w-full h-6 bg-gray-100 rounded-full overflow-hidden flex" title="Distribution of failure reasons">
              {sortedReasons.map((item, index) => (
                <div
                  key={item.reason}
                  className="h-full group relative"
                  style={{ width: `${item.percentage}%`, backgroundColor: colors[index % colors.length] }}
                  role="tooltip"
                >
                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10 shadow-lg">
                    <span className="font-bold">{item.reason}:</span> {item.count} ({item.percentage.toFixed(1)}%)
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800"></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 text-xs ">
                <p>
                    <span className="font-semibold">Top Reason: </span> 
                    <span className="text-orange-600 font-medium">{topReason.name}</span>
                    <span className="ml-1">({(topReason.count / totalFailed * 100).toFixed(0)}% of all failures)</span>
                </p>
            </div>
          </div>

          {/* Block 3: Top Reasons List */}
          <div className="flex-shrink-0 w-64">
            <div className="flex items-center space-x-2 mb-3">
                <ListIcon />
                <h4 className="text-sm font-semibold ">Top 3 Reasons</h4>
            </div>
            <div className="space-y-1.5">
              {sortedReasons.slice(0, 3).map((item, index) => (
                <div key={item.reason} className="flex items-center text-xs group">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0 mr-2"
                    style={{ backgroundColor: colors[index % colors.length] }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text font-medium truncate" title={item.reason}>{item.reason}</p>
                  </div>
                  <div className="flex items-center ml-2">
                    <span className="font-semibold  w-6 text-right">{item.count}</span>
                    <span className="text w-10 text-right">{item.percentage.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}