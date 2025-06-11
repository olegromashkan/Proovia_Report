import Link from 'next/link';
import Layout from '../components/Layout';
import useFetch from '../lib/useFetch';
<<<<<<< HEAD
import { useChat } from '../contexts/ChatContext';
import { useState } from 'react';

export default function Users() {
  const { data } = useFetch<{ users: any[] }>('/api/users');
  const { openChat } = useChat();
  const [query, setQuery] = useState('');
  const users = (data?.users || []).filter(u =>
    u.username.toLowerCase().includes(query.toLowerCase())
  );
=======
import { useState } from 'react';
import ChatPanel from '../components/ChatPanel';

export default function Users() {
  const { data } = useFetch<{ users: any[] }>('/api/users');
  const users = data?.users || [];
  const [chatUser, setChatUser] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
>>>>>>> parent of 49cbc74 (Merge pull request #113 from olegromashkan/codex/обновить-функциональность-чатов-и-уведомлений)

  return (
    <Layout title="Users">
      <div className="max-w-screen-lg mx-auto space-y-4">
        <h1 className="text-2xl font-bold">Users</h1>
        <input
          type="text"
          placeholder="Search users..."
          className="input input-bordered w-full sm:max-w-xs"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {users.map(u => (
<<<<<<< HEAD
            <div key={u.id} className="card bg-base-100 shadow-system">
              <div className="p-4 flex flex-col items-center gap-2">
                {u.photo && (
                  <img
                    src={u.photo}
                    alt="avatar"
                    className="w-20 h-20 rounded-full object-cover"
                  />
                )}
                <p className="font-semibold text-center truncate w-full">
                  {u.username}
                </p>
              </div>
              <div className="card-actions px-4 pb-4 flex gap-2">
                <Link href={`/profile/${u.username}`} className="btn btn-sm btn-outline flex-1">
                  View
                </Link>
                <button
                  className="btn btn-sm flex-1"
                  onClick={() => openChat(u.username)}
                >
                  Chat
                </button>
              </div>
            </div>
=======
            <li key={u.id} className="flex items-center gap-3">
              {u.photo && (
                <img src={u.photo} alt="avatar" className="w-8 h-8 rounded-full" />
              )}
              <Link href={`/profile/${u.username}`} className="link flex-1">
                {u.username}
              </Link>
              <button
                className="btn btn-xs"
                onClick={() => { setChatUser(u.username); setChatOpen(true); }}
              >
                Chat
              </button>
            </li>
>>>>>>> parent of 49cbc74 (Merge pull request #113 from olegromashkan/codex/обновить-функциональность-чатов-и-уведомлений)
          ))}
        </div>
      </div>
      <ChatPanel open={chatOpen} user={chatUser} onClose={() => setChatOpen(false)} />
    </Layout>
  );
}
