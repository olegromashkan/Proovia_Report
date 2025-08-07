import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import ScheduleTable, { ColumnConfig } from '../components/schedule/ScheduleTable';
import NotesSidebar from '../components/schedule/NotesSidebar';
import SettingsModal from '../components/schedule/SettingsModal';
import { useScheduleData } from '../hooks/useScheduleData';
import { useScheduleSettings } from '../hooks/useScheduleSettings';
import { useTableSelection } from '../hooks/useTableSelection';
import {
  getRouteColorClass,
  getNextSort,
  sortTrips,
  SortConfig,
} from '../lib/scheduleUtils';

export default function ScheduleTool() {
  const {
    itemsLeft,
    itemsRight,
    isLoading,
    error,
    loadData,
    updateLeft,
    updateRight,
  } = useScheduleData();
  const {
    routeGroups,
    ignoredPatterns,
    timeSettings,
    setIgnoredPatterns,
    updateGroup,
    resetSettings,
  } = useScheduleSettings();
  const leftSelection = useTableSelection();
  const rightSelection = useTableSelection();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [sortLeft, setSortLeft] = useState<SortConfig | null>(null);
  const [sortRight, setSortRight] = useState<SortConfig | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const columns: ColumnConfig[] = [
    { key: 'Driver1', label: 'Driver' },
    { key: 'Start_Time', label: 'Start' },
    {
      key: 'End_Time',
      label: 'End',
      className: item => getRouteColorClass(routeGroups, item.Calendar_Name),
    },
  ];

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSortLeft = (key: string) => {
    const next = getNextSort(sortLeft, key);
    setSortLeft(next);
    updateLeft(arr => sortTrips(arr, key, next.dir));
  };

  const handleSortRight = (key: string) => {
    const next = getNextSort(sortRight, key);
    setSortRight(next);
    updateRight(arr => sortTrips(arr, key, next.dir));
  };

  const handleNoteChange = (panel: string, value: string) => {
    setNotes(prev => ({ ...prev, [panel]: value }));
  };

  if (error) {
    return (
      <Layout>
        <div className="p-4 text-red-500">{error}</div>
      </Layout>
    );
  }

  return (
    <Layout title="Schedule Tool">
      {isLoading && <div className="p-2">Loading...</div>}
      <div className="flex gap-4">
        <div className="flex-1 overflow-auto">
          <ScheduleTable
            items={itemsLeft}
            columns={columns}
            sortConfig={sortLeft}
            onSort={handleSortLeft}
            selectedRows={leftSelection.selectedRows}
            onRowMouseDown={leftSelection.handleMouseDown}
            onRowMouseOver={leftSelection.handleMouseOver}
            onRowMouseUp={leftSelection.handleMouseUp}
          />
        </div>
        <div className="flex-1 overflow-auto">
          <ScheduleTable
            items={itemsRight}
            columns={columns}
            sortConfig={sortRight}
            onSort={handleSortRight}
            selectedRows={rightSelection.selectedRows}
            onRowMouseDown={rightSelection.handleMouseDown}
            onRowMouseOver={rightSelection.handleMouseOver}
            onRowMouseUp={rightSelection.handleMouseUp}
          />
        </div>
        <NotesSidebar notes={notes} onNoteChange={handleNoteChange} />
      </div>
      <button className="btn btn-sm mt-4" onClick={() => setSettingsOpen(true)}>
        Settings
      </button>
      <SettingsModal
        isOpen={settingsOpen}
        routeGroups={routeGroups}
        ignoredPatterns={ignoredPatterns}
        timeSettings={timeSettings}
        onClose={() => setSettingsOpen(false)}
        onUpdateGroup={updateGroup}
        onIgnoredPatternsChange={setIgnoredPatterns}
        onReset={resetSettings}
      />
    </Layout>
  );
}
