import React from 'react';
import { Trip } from '../../hooks/useScheduleData';
import { SortConfig } from '../../lib/scheduleUtils';

export interface ColumnConfig {
  key: string;
  label: string;
  className?: (item: Trip) => string;
}

interface Props {
  items: Trip[];
  columns: ColumnConfig[];
  sortConfig: SortConfig | null;
  onSort: (key: string) => void;
  selectedRows: number[];
  onRowMouseDown: (index: number) => void;
  onRowMouseOver: (index: number) => void;
  onRowMouseUp: () => void;
}

const ScheduleTable: React.FC<Props> = ({
  items,
  columns,
  sortConfig,
  onSort,
  selectedRows,
  onRowMouseDown,
  onRowMouseOver,
  onRowMouseUp,
}) => {
  return (
    <table className="min-w-full text-sm border-collapse">
      <thead>
        <tr>
          {columns.map(col => (
            <th
              key={col.key}
              className="p-2 cursor-pointer border-b"
              onClick={() => onSort(col.key)}
            >
              {col.label}
              {sortConfig?.key === col.key && (sortConfig.dir === 'asc' ? ' ▲' : ' ▼')}
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
            {columns.map(col => (
              <td
                key={col.key}
                className={`p-2 ${col.className ? col.className(item) : ''}`}
              >
                {(item as any)[col.key] || ''}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default ScheduleTable;
