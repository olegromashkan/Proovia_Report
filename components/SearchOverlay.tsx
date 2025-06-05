import { useEffect, useState } from 'react';
import OrderCard from './OrderCard';

interface Result {
  id: string;
  order: string;
  postcode?: string;
}

export default function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [suggest, setSuggest] = useState<string[]>([]);
  const [selected, setSelected] = useState<any | null>(null);

  useEffect(() => {
    if (!q) {
      setResults([]);
      setSuggest([]);
      return;
    }
    const controller = new AbortController();
    fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        setResults(data.items || []);
        setSuggest(data.suggest || []);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [q]);

  const selectResult = async (id: string) => {
    const res = await fetch(`/api/items?table=copy_of_tomorrow_trips&id=${id}`);
    if (res.ok) {
      const data = await res.json();
      setSelected(data.item?.data || null);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-start justify-center p-4 z-20">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-xl p-6">
        <div className="flex justify-between mb-2">
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search..."
            className="border p-1 flex-grow mr-2 rounded"
          />
          <button onClick={onClose} className="px-2">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
        {results.length === 0 && q && (
          <div className="text-sm text-gray-500">No exact matches</div>
        )}
        <ul>
          {results.map(r => (
            <li
              key={r.id}
              className="border-b py-1 cursor-pointer hover:bg-gray-100"
              onClick={() => selectResult(r.id)}
            >
              {r.order}{' '}
              {r.postcode && <span className="text-gray-500">({r.postcode})</span>}
            </li>
          ))}
        </ul>
        {selected && (
          <div className="mt-4">
            <OrderCard data={selected} />
          </div>
        )}
        {suggest.length > 0 && (
          <div className="mt-2 text-sm text-gray-500">
            <div>Did you mean:</div>
            <ul className="list-disc list-inside">
              {suggest.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
