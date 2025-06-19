import { useState } from 'react';
import useFetch from '../lib/useFetch';

interface Post {
  id: number;
  content: string;
  created_at: string;
}

export default function SummaryAdminPanel() {
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);
  const { data, mutate } = useFetch<{ posts: Post[] }>(
    '/api/posts?type=summary'
  );
  const posts = data?.posts || [];

  const generate = async () => {
    if (!date) return;
    setLoading(true);
    await fetch(`/api/manual-summary?date=${date}`, { method: 'POST' });
    await mutate();
    setLoading(false);
  };

  const removeByDate = async (d: string) => {
    if (!confirm('Delete summary for ' + d + '?')) return;
    setLoading(true);
    await fetch(`/api/manual-summary?date=${d}`, { method: 'DELETE' });
    await mutate();
    setLoading(false);
  };

  const removeById = async (id: number) => {
    if (!confirm('Delete this summary?')) return;
    setLoading(true);
    await fetch(`/api/posts?id=${id}`, { method: 'DELETE' });
    await mutate();
    setLoading(false);
  };

  const formatPostDate = (str: string) => {
    const d = new Date(str);
    return d.toISOString().slice(0, 10);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Daily Summaries</h2>
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label className="block text-sm font-medium mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input input-bordered"
          />
        </div>
        <button
          onClick={generate}
          disabled={!date || loading}
          className="btn btn-primary"
        >
          Generate
        </button>
        <button
          onClick={() => removeByDate(date)}
          disabled={!date || loading}
          className="btn btn-error"
        >
          Delete
        </button>
      </div>
      <div>
        <h3 className="font-semibold mb-2">Existing Summaries</h3>
        <ul className="space-y-2">
          {posts.map((p) => {
            let info: any = {};
            try {
              info = JSON.parse(p.content || '{}');
            } catch {
              info = {};
            }
            const day = info.date || formatPostDate(p.created_at);
            return (
              <li
                key={p.id}
                className="bg-white dark:bg-gray-800 p-3 rounded-lg border flex justify-between items-center"
              >
                <span className="text-sm">
                  {day} - {info.total ?? ''} tasks
                </span>
                <button
                  onClick={() => removeById(p.id)}
                  className="btn btn-xs btn-outline btn-error"
                >
                  Delete
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
