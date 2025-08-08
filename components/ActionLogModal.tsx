import Modal from './Modal';

interface LogEntry {
  user: string;
  action: string;
  time: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  log: LogEntry[];
}

export default function ActionLogModal({ open, onClose, log }: Props) {
  return (
    <Modal open={open} onClose={onClose}>
      <h3 className="font-bold text-lg mb-2">Action Log</h3>
      <div className="max-h-80 overflow-y-auto">
        <ul className="space-y-1 text-sm">
          {log.map((entry, i) => (
            <li key={i} className="flex justify-between">
              <span>
                <span className="font-medium">{entry.user}</span>: {entry.action}
              </span>
              <span className="text-gray-500 ml-2">
                {new Date(entry.time).toLocaleString()}
              </span>
            </li>
          ))}
          {log.length === 0 && (
            <li className="text-gray-500">No actions yet.</li>
          )}
        </ul>
      </div>
    </Modal>
  );
}
