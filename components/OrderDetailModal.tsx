import { useEffect, useState } from "react";
import Modal from "./Modal";
import OrderView from "./OrderView";

interface Props {
  orderId: string | null;
  open: boolean;
  onClose: () => void;
}

export default function OrderDetailModal({ orderId, open, onClose }: Props) {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !orderId) return;
    setLoading(true);
    fetch(`/api/items?table=copy_of_tomorrow_trips&id=${orderId}`)
      .then(res => (res.ok ? res.json() : Promise.reject()))
      .then(d => {
        setData(d.item?.data || null);
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [orderId, open]);

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} className="max-w-3xl w-full">
      <h2 className="text-lg font-semibold mb-4">Order #{orderId}</h2>
      {loading && <p>Loading...</p>}
      {!loading && data && <OrderView data={data} />}
      {!loading && !data && <p className="text-red-600">Failed to load order</p>}
    </Modal>
  );
}
