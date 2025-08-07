import { Trip } from '../../hooks/useScheduleData';
import { RouteGroup } from '../../hooks/useScheduleSettings';
import { getRouteColorClass } from '../../lib/scheduleUtils';
import React from 'react';

export interface SortConfig {
  key: string;
  dir: 'asc' | 'desc';
}

interface Props {
  items: Trip[];
  sortConfig: SortConfig | null;
  onSort: (key: string) => void;
  selectedRows: number[];
  onRowMouseDown: (index: number) => void;
  onRowMouseOver: (index: number) => void;
  onRowMouseUp: () => void;
  routeGroups?: RouteGroup[];
}

const headers = [
  { key: 'Driver1', label: 'Driver' },
  { key: 'Start_Time', label: 'Start' },
  { key: 'End_Time', label: 'End' },
];

const ScheduleTable: React.FC<Props> = ({
  items,
  sortConfig,
  onSort,
  selectedRows,
  onRowMouseDown,
  onRowMouseOver,
  onRowMouseUp,
  routeGroups = [],
}) => {
  return (
    <table className="min-w-full text-sm border-collapse">
      <thead>
        <tr>
          {headers.map(h => (
            <th
              key={h.key}
              className="p-2 cursor-pointer border-b"
              onClick={() => onSort(h.key)}
            >
              {h.label}
              {sortConfig?.key === h.key && (sortConfig.dir === 'asc' ? ' ▲' : ' ▼')}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {items.map((item, idx) => (
          <tr
            key={item.ID || idx}
            onMouseDown={() => onRowMouseDown(idx)}
            onMouseOver={() => onRowMouseOver(idx)}
            onMouseUp={onRowMouseUp}
            className={`border-b ${selectedRows.includes(idx) ? 'bg-blue-100 dark:bg-blue-900/40' : ''}`}
          >
            <td className="p-2">{item.Driver1 || ''}</td>
            <td className="p-2">{item.Start_Time || ''}</td>
            <td className={`p-2 ${getRouteColorClass(routeGroups, item.Calendar_Name)}`}>{item.End_Time || ''}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default ScheduleTable;
