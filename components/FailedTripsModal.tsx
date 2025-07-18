import Modal from './Modal';
import { getFailureReason } from '../lib/failureReason';

interface Trip {
  ID: string;
  [key: string]: any;
}

export default function FailedTripsModal({
  open,
  onClose,
  trips,
}: {
  open: boolean;
  onClose: () => void;
  trips: Trip[];
}) {
  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} className="max-w-4xl">
      <h2 className="text-lg font-semibold mb-4">Failed Trips</h2>
      <div className="overflow-auto max-h-[80vh]">
        <table className="table table-sm">
          <thead>
            <tr>
              <th className="whitespace-nowrap">Order #</th>
              <th className="whitespace-nowrap">Driver</th>
              <th className="whitespace-nowrap">Postcode</th>
              <th className="whitespace-nowrap">Reason</th>
            </tr>
          </thead>
          <tbody>
            {trips.map((t) => (
              <tr key={t.ID} className="border-t border-base-300">
                <td className="font-mono whitespace-nowrap">{t['Order.OrderNumber']}</td>
                <td className="whitespace-nowrap">{t['Trip.Driver1'] || 'No Driver'}</td>
                <td className="whitespace-nowrap">{t['Address.Postcode']}</td>
                <td className="whitespace-nowrap">{getFailureReason(t.Notes)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}
