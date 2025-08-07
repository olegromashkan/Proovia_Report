import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import ScheduleTable from '../components/schedule/ScheduleTable';
import NotesSidebar from '../components/schedule/NotesSidebar';
import SettingsModal from '../components/schedule/SettingsModal';
import { useScheduleData } from '../hooks/useScheduleData';
import { useScheduleSettings } from '../hooks/useScheduleSettings';
import { useTableSelection } from '../hooks/useTableSelection';

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
  const [sortLeft, setSortLeft] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null);
  const [sortRight, setSortRight] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSortLeft = (key: string) => {
    const dir = sortLeft?.key === key && sortLeft.dir === 'asc' ? 'desc' : 'asc';
    setSortLeft({ key, dir });
    updateLeft(arr =>
      [...arr].sort((a: any, b: any) => {
        const av = a[key] || '';
        const bv = b[key] || '';
        return av.localeCompare(bv) * (dir === 'asc' ? 1 : -1);
      })
    );
  };

  const handleSortRight = (key: string) => {
    const dir = sortRight?.key === key && sortRight.dir === 'asc' ? 'desc' : 'asc';
    setSortRight({ key, dir });
    updateRight(arr =>
      [...arr].sort((a: any, b: any) => {
        const av = a[key] || '';
        const bv = b[key] || '';
        return av.localeCompare(bv) * (dir === 'asc' ? 1 : -1);
      })
    );
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
            sortConfig={sortLeft}
            onSort={handleSortLeft}
            selectedRows={leftSelection.selectedRows}
            onRowMouseDown={leftSelection.handleMouseDown}
            onRowMouseOver={leftSelection.handleMouseOver}
            onRowMouseUp={leftSelection.handleMouseUp}
            routeGroups={routeGroups}
          />
        </div>
        <div className="flex-1 overflow-auto">
          <ScheduleTable
            items={itemsRight}
            sortConfig={sortRight}
            onSort={handleSortRight}
            selectedRows={rightSelection.selectedRows}
            onRowMouseDown={rightSelection.handleMouseDown}
            onRowMouseOver={rightSelection.handleMouseOver}
            onRowMouseUp={rightSelection.handleMouseUp}
            routeGroups={routeGroups}
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
