import { useEffect, useState } from 'react';

interface Post {
  id: number;
  content: string;
  created_at: string;
}

export default function SummaryFeed() {
  const [items, setItems] = useState<Post[]>([]);

  useEffect(() => {
    fetch('/api/posts?type=summary&limit=30')
      .then(res => (res.ok ? res.json() : Promise.reject()))
      .then(data => setItems(data.posts as Post[]))
      .catch(() => {});
  }, []);

  return (
    <div className="bg-base-200 rounded-xl p-4 shadow space-y-4 max-h-[80vh] overflow-y-auto">
      <h2 className="text-lg font-bold">Daily Summaries</h2>
      {items.length === 0 ? (
        <p className="text-sm text-gray-500">No data</p>
      ) : (
        items.map(p => (
          <div key={p.id} className="p-3 rounded-lg bg-base-100 shadow">
            <div className="text-xs text-gray-500 mb-1">
              {new Date(p.created_at).toLocaleDateString()}
            </div>
            <div className="text-sm whitespace-pre-wrap">{p.content}</div>
          </div>
        ))
      )}
    </div>
  );
}
