import { useState } from 'react';
import Icon from '../../components/Icon';
import Layout from '../../components/Layout';
import useFetch from '../../lib/useFetch';
import ChatWindow from '../../components/ChatWindow';

export default function MessagesPage() {
  const { data } = useFetch<{ users: any[] }>('/api/users');
  const { data: chatData } = useFetch<{ chats: any[] }>('/api/chats');
  const users = data?.users || [];
  const chats = chatData?.chats || [];
  const [active, setActive] = useState<{type:'user'|'chat';id:string|number;name?:string;photo?:string}|null>(null);
  const [query, setQuery] = useState('');

  const filtered = users.filter((u) =>
    u.username.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Layout title="Messages" fullWidth>
      <div className="flex flex-col md:flex-row gap-4 h-[80vh] mx-auto max-w-6xl p-4">
        <div className="w-full md:w-64 shrink-0 space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search..."
              className="input input-bordered flex-1"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="overflow-y-auto max-h-full pr-2 space-y-2">
            {chats.map((c) => (
              <div key={`c-${c.id}`} className="relative group">
                <button
                  onClick={() => setActive({ type: 'chat', id: c.id, name: c.name, photo: c.photo })}
                  className={`w-full flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${
                    active?.type === 'chat' && active.id === c.id
                      ? 'bg-blue-100 dark:bg-gray-700 border-blue-200 dark:border-gray-600'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {c.photo ? (
                    <img src={c.photo} alt={c.name} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <Icon name="users" className="w-5 h-5" />
                  )}
                  <span className="flex-1 truncate">{c.name}</span>
                </button>
                <button
                  onClick={async () => {
                    await fetch('/api/chats', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ id: c.id, pinned: c.pinned ? 0 : 1 })
                    });
                    window.location.reload();
                  }}
                  className="absolute top-1 right-1 p-1 text-xs hidden group-hover:block"
                >
                  <Icon name="star" className={`w-4 h-4 ${c.pinned ? 'text-yellow-500' : ''}`} />
                </button>
              </div>
            ))}
            {filtered.map((u) => (
              <button
                key={u.id}
                onClick={() => setActive({ type: 'user', id: u.username, name: u.username, photo: u.photo })}
                className={`w-full flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${
                  active?.type === 'user' && active.id === u.username
                    ? 'bg-blue-100 dark:bg-gray-700 border-blue-200 dark:border-gray-600'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {u.photo ? (
                  <img src={u.photo} alt={u.username} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600">
                    {u.username[0]?.toUpperCase()}
                  </div>
                )}
                <span className="flex-1 truncate">{u.username}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <ChatWindow
            user={active?.type === 'user' ? (active.id as string) : undefined}
            chatId={active?.type === 'chat' ? (active.id as number) : undefined}
            name={active?.name}
            photo={active?.photo}
          />
        </div>
      </div>
    </Layout>
  );
}
