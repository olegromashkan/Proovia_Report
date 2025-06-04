import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';

export default function ItemEditor() {
  const router = useRouter();
  const { table, id } = router.query as { table?: string; id?: string };
  const [text, setText] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!table || !id) return;
    fetch(`/api/items?table=${table}&id=${id}`)
      .then((res) => res.ok ? res.json() : Promise.reject())
      .then((data) => setText(JSON.stringify(data.item.data, null, 2)))
      .catch(() => setMessage('Failed to load'));
  }, [table, id]);

  const handleSave = async () => {
    if (!table || !id) return;
    try {
      const payload = JSON.parse(text);
      const res = await fetch(`/api/items?table=${table}&id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setMessage('Saved');
      } else {
        setMessage('Save failed');
      }
    } catch {
      setMessage('Invalid JSON');
    }
  };

  return (
    <Layout title="Edit Item">
      <h1 className="text-2xl font-bold">Edit {id}</h1>
      <textarea
        className="w-full h-64 border p-2 font-mono rounded"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="space-x-2 mt-2">
        <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded shadow">
          Save
        </button>
        {message && <span>{message}</span>}
      </div>
    </Layout>
  );
}
