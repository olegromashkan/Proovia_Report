import { useState, useEffect, useMemo, useCallback, useReducer } from 'react';
import useSWR from 'swr';
import Layout from '../components/Layout';
import DCNavbar from '../components/DCNavbar';
import StartTime, {
  StartTimeFilters,
  StartTimeFilterAction,
  calcLoad,
  diffTime,
} from '../components/StartTime';

const initialFilters: StartTimeFilters = {
  start: '',
  end: '',
  startSearch: '',
  startContractor: '',
};

function filterReducer(
  state: StartTimeFilters,
  action: StartTimeFilterAction,
): StartTimeFilters {
  switch (action.type) {
    case 'SET_FILTER':
      return { ...state, [action.key]: action.value };
    case 'SET_DATE_RANGE':
      return { ...state, start: action.start, end: action.end };
    case 'RESET':
      return initialFilters;
    default:
      return state;
  }
}

const formatDate = (date: Date) => date.toISOString().slice(0, 10);

export default function StartTimePage() {
  const today = useMemo(() => formatDate(new Date()), []);
  const fetcher = (url: string) => fetch(url).then((res) => res.json());

  const [startData, setStartData] = useState<any[]>([]);
  const [filters, dispatchFilters] = useReducer(filterReducer, {
    ...initialFilters,
    start: today,
    end: today,
  });
  const [startSortField, setStartSortField] = useState<
    | 'Asset'
    | 'Contractor_Name'
    | 'Driver'
    | 'First_Mention_Time'
    | 'Start_Time'
    | 'Last_Mention_Time'
  >('Driver');
  const [startSortDir, setStartSortDir] = useState<'asc' | 'desc'>('asc');

  const query = useMemo(() => {
    const params = new URLSearchParams({
      start: filters.start,
      end: filters.end,
      startSearch: filters.startSearch,
      startContractor: filters.startContractor,
      startSortField,
      startSortDir,
    });
    return params.toString();
  }, [filters, startSortField, startSortDir]);

  const { data } = useSWR(`/api/v2/full-report?${query}`, fetcher);

  useEffect(() => {
    if (data) setStartData(data.startData || []);
  }, [data]);

  const startContractors = useMemo(() => {
    const set = new Set<string>();
    startData.forEach((s) => {
      if (s.Contractor_Name) set.add(s.Contractor_Name);
    });
    return Array.from(set).sort();
  }, [startData]);

  const copyStartTable = useCallback(() => {
    const rows = startData.map((r) => {
      const load = calcLoad(r.Start_Time);
      const diffLoad = diffTime(r.First_Mention_Time, load);
      const diffStart = diffTime(r.Last_Mention_Time, r.Start_Time);
      return [
        r.Asset,
        r.Contractor_Name,
        r.Driver,
        r.First_Mention_Time,
        load,
        diffLoad,
        r.Start_Time,
        r.Last_Mention_Time,
        diffStart,
      ].join('\t');
    });
    const header =
      'Asset\tContractor\tDriver\tArrive WH\tLoad Time\tDiff Load\tStart Time\tLeft WH\tDiff Start';
    navigator.clipboard.writeText([header, ...rows].join('\n'));
  }, [startData]);

  const downloadStartCSV = useCallback(() => {
    const rows = startData.map((r) => {
      const load = calcLoad(r.Start_Time);
      const diffLoad = diffTime(r.First_Mention_Time, load);
      const diffStart = diffTime(r.Last_Mention_Time, r.Start_Time);
      return [
        r.Asset,
        r.Contractor_Name,
        r.Driver,
        r.First_Mention_Time,
        load,
        diffLoad,
        r.Start_Time,
        r.Last_Mention_Time,
        diffStart,
      ];
    });
    const header = [
      'Asset',
      'Contractor',
      'Driver',
      'Arrive WH',
      'Load Time',
      'Diff Load',
      'Start Time',
      'Left WH',
      'Diff Start',
    ];
    const csv = [header, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'start_times.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [startData]);

  return (
    <Layout title="Start Time" hideNavbar fullWidth>
      <DCNavbar />
      <StartTime
        startData={startData}
        filters={filters}
        dispatchFilters={dispatchFilters}
        startSortField={startSortField}
        setStartSortField={setStartSortField}
        startSortDir={startSortDir}
        setStartSortDir={setStartSortDir}
        startContractors={startContractors}
        copyStartTable={copyStartTable}
        downloadStartCSV={downloadStartCSV}
        showDateRange
      />
    </Layout>
  );
}

