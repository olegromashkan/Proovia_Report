import React from 'react';

interface Stats {
  counts: Record<string, number>;
  total: number;
}

interface RouteGroup {
  name: string;
  color: string;
}

interface Props {
  stats: Stats;
  routeGroups: RouteGroup[];
  clearFn: () => void;
}

export default function ScheduleStats({ stats, routeGroups, clearFn }: Props) {
  return (
    <div className="text-xs flex flex-wrap gap-1 items-center bg-base-200 dark:bg-base-100 p-1 rounded-md shadow-sm">
      {routeGroups.map(cat => (
        <span
          key={cat.name}
          className={`px-1 py-0.5 rounded text-xs ${cat.color} bg-opacity-20 ${cat.color.replace('text-', 'bg-')} font-medium`}
        >
          {cat.name}: {stats.counts[cat.name] || 0}
        </span>
      ))}
      <span
        className="px-1 py-0.5 rounded text-xs text-white bg-opacity-20 bg-gray-500 font-medium"
      >
        Other: {stats.counts['Other'] || 0}
      </span>
      <span
        className="px-1 py-0.5 rounded text-xs text-white bg-opacity-20 bg-gray-700 font-medium"
      >
        Total: {stats.total}
      </span>
      <button onClick={clearFn} className="btn btn-error btn-outline btn-xs ml-1" title="Clear all items">
        Clear
      </button>
    </div>
  );
}
