import Modal from './Modal';

interface LogEntry {
  user: string;
  action: string;
  time: number;
  type?: 'create' | 'update' | 'delete' | 'view' | 'login' | 'logout';
}

interface Props {
  open: boolean;
  onClose: () => void;
  log: LogEntry[];
}

const getActionIcon = (type: LogEntry['type']) => {
  switch (type) {
    case 'create': return 'bi-plus-circle text-success';
    case 'update': return 'bi-pencil text-warning';
    case 'delete': return 'bi-trash text-error';
    case 'view': return 'bi-eye text-info';
    case 'login': return 'bi-box-arrow-in-right text-success';
    case 'logout': return 'bi-box-arrow-right text-neutral';
    default: return 'bi-circle text-base-content';
  }
};

const formatTime = (timestamp: number) => {
  const now = Date.now();
  const diff = Math.floor((now - timestamp) / 60000);

  if (diff < 1) return 'now';
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return new Date(timestamp).toLocaleDateString();
};

export default function ActionLogModal({ open, onClose, log }: Props) {
  const sortedLog = [...log].sort((a, b) => b.time - a.time);

  return (
    <Modal open={open} onClose={onClose}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg">Activity Log</h3>
        <span className="text-sm text-base-content/60">{log.length} entries</span>
      </div>

      <div className="max-h-80 overflow-y-auto space-y-2">
        {sortedLog.length === 0 ? (
          <div className="text-center py-8 text-base-content/60">
            <i className="bi bi-journal text-2xl mb-2 block"></i>
            No activity yet
          </div>
        ) : (
          sortedLog.map((entry, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-base-100 rounded-lg border">
              <i className={`bi ${getActionIcon(entry.type)} text-lg`}></i>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{entry.user}</span>
                  {entry.type && (
                    <span className="badge badge-xs badge-outline">
                      {entry.type}
                    </span>
                  )}
                </div>
                <div className="text-sm text-base-content/80 truncate">
                  {entry.action}
                </div>
              </div>

              <div className="text-xs text-base-content/60 text-right">
                {formatTime(entry.time)}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
        <button className="btn btn-sm btn-primary" onClick={onClose}>Close</button>
      </div>
    </Modal>
  );
}