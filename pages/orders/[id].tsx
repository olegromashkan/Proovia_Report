import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';

type Data = Record<string, any>;

function categorize(data: Data) {
  const categories: Record<string, [string, any][]> = {};
  for (const [key, value] of Object.entries(data)) {
    const parts = key.split('.');
    const group = parts.length > 1 ? parts[0] : 'General';
    const label = parts.length > 1 ? parts.slice(1).join('.') : parts[0];
    if (!categories[group]) categories[group] = [];
    categories[group].push([label, value]);
  }
  return categories;
}

function OrderView({ data }: { data: Data }) {
  const categories = categorize(data);
  return (
    <div className="space-y-4">
      {Object.keys(categories).map((cat) => (
        <div key={cat} className="border rounded">
          <h2 className="font-semibold bg-gray-100 p-2">{cat}</h2>
          <table className="w-full text-sm">
            <tbody>
              {categories[cat].map(([k, v]) => (
                <tr key={k} className="odd:bg-gray-50">
                  <td className="border px-2 py-1 font-mono whitespace-nowrap">
                    {k}
                  </td>
                  <td className="border px-2 py-1 break-all">
                    {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

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
        <OrderView data={item.data} />
      )}
    </Layout>
  );
}
