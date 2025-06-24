import Modal from './Modal';

interface DailyStat {
  complete: number;
  failed: number;
  total: number;
}

interface DriverStat {
  driver: string;
  contractor: string;
  daily: DailyStat[];
  total: DailyStat;
}

export default function DriverStatsModal({
  open,
  onClose,
  dates,
  stats,
}: {
  open: boolean;
  onClose: () => void;
  dates: string[];
  stats: DriverStat[];
}) {
  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} className="max-w-4xl">
      <h2 className="text-lg font-semibold mb-4">Driver Stats</h2>
      <div className="overflow-auto max-h-[80vh]">
        <table className="table table-sm">
          <thead>
            <tr>
              <th className="whitespace-nowrap">Driver</th>
              <th className="whitespace-nowrap">Contractor</th>
              {dates.map((d) => (
                <th key={d} className="text-right whitespace-nowrap">
                  {d.slice(5)}
                </th>
              ))}
              <th className="text-right whitespace-nowrap">Total</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((s) => (
              <tr key={s.driver} className="border-t border-base-300">
                <td className="pr-2 whitespace-nowrap">{s.driver}</td>
                <td className="pr-2 whitespace-nowrap">{s.contractor}</td>
                {s.daily.map((d, idx) => (
                  <td key={idx} className="text-right font-mono">
                    {d.total === 0 ? '-' : `${d.complete}/${d.failed}/${d.total}`}
                  </td>
                ))}
                <td className="text-right font-mono">
                  {s.total.total === 0
                    ? '-'
                    : `${s.total.complete}/${s.total.failed}/${s.total.total}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}
