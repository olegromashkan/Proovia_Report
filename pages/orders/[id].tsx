import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';

export default function OrderDetail() {
  const router = useRouter();
  const { id } = router.query as { id?: string };
  const [item, setItem] = useState<any | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/items?table=copy_of_tomorrow_trips&id=${id}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setItem(data.item))
      .catch(() => setError(true));
  }, [id]);

  return (
    <Layout title={`Order ${id}`}> 
      {!item && !error && <p>Loading...</p>}
      {error && <p className="text-red-600">Failed to load order</p>}
      {item && (
        <pre className="whitespace-pre-wrap">
          {JSON.stringify(item.data, null, 2)}
        </pre>
      )}
    </Layout>
  );
}
