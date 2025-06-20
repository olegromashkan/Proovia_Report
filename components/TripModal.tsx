import Modal from './Modal';
import OrderView from './OrderView';

interface Trip {
  ID: string;
  [key: string]: any;
}

interface Props {
  trip: Trip | null;
  onClose: () => void;
}

export default function TripModal({ trip, onClose }: Props) {
  if (!trip) return null;

  return (
    <Modal open={!!trip} onClose={onClose} className="max-w-5xl">
      <h2 className="text-xl font-bold mb-2">
        Order #{trip['Order.OrderNumber']}
      </h2>
      <div className="mb-2 text-sm">Driver: {trip['Trip.Driver1']}</div>
      <div className="max-h-80 overflow-auto">
        <OrderView data={trip} />
      </div>
    </Modal>
  );
}
