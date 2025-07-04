import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import OrderDetailModal from '../../components/OrderDetailModal';


export default function OrderDetail() {
  const router = useRouter();
  const { id } = router.query as { id?: string };
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (id) setOpen(true);
  }, [id]);

  const handleClose = () => {
    setOpen(false);
    router.back();
  };

  return (
    <Layout title={`Order ${id}`}>
      <OrderDetailModal orderId={id ?? null} open={open} onClose={handleClose} />
    </Layout>
  );
}
