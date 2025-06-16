import { useEffect, useState } from 'react';

interface Post {
  id: number;
  content: string;
  created_at: string;
}

export default function SummaryFeed() {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    fetch('/api/posts?type=summary')
      .then(res => (res.ok ? res.json() : Promise.reject()))
      .then(data => setPosts(data.posts as Post[]))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {posts.map(p => (
        <div key={p.id} className="bg-base-200 p-3 rounded-xl border border-base-300 shadow">
          <p className="text-sm break-words">{p.content}</p>
          <p className="text-xs text-gray-500 mt-1">
            {new Date(p.created_at).toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
  );
}
