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
    <Modal open={open} onClose={onClose} className="w-11/12 max-w-4xl">
      <div className="w-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-xl">Activity Log</h3>
          <span className="text-sm text-base-content/60 bg-base-200 px-3 py-1 rounded-full">
            {log.length} entries
          </span>
        </div>

        <div className="overflow-y-auto space-y-3" style={{ maxHeight: '65vh' }}>
          {sortedLog.length === 0 ? (
            <div className="text-center py-12 text-base-content/60">
              <i className="bi bi-journal text-4xl mb-4 block"></i>
              <p className="text-lg">No activity yet</p>
              <p className="text-sm mt-2">Actions will appear here as they happen</p>
            </div>
          ) : (
            sortedLog.map((entry, i) => (
              <div key={i} className="flex items-start gap-4 p-4 bg-base-100 rounded-lg border hover:bg-base-200/50 transition-colors">
                <div className="flex-shrink-0 mt-1">
                  <i className={`bi ${getActionIcon(entry.type)} text-xl`}></i>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-semibold text-base">{entry.user}</span>
                    {entry.type && (
                      <span className="badge badge-sm badge-outline capitalize">
                        {entry.type}
                      </span>
                    )}
                    <span className="text-xs text-base-content/60 ml-auto">
                      {formatTime(entry.time)}
                    </span>
                  </div>
                  <div className="text-sm text-base-content/80 leading-relaxed">
                    {entry.action}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-between items-center gap-3 mt-6 pt-4 border-t">
          <div className="text-xs text-base-content/60">
            Showing {Math.min(sortedLog.length, 100)} most recent entries
          </div>
          <button className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}