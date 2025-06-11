import Link from 'next/link';
import Layout from '../components/Layout';
import useFetch from '../lib/useFetch';
import { useState } from 'react';
import ChatPanel from '../components/ChatPanel';

export default function Users() {
  const { data } = useFetch<{ users: any[] }>('/api/users');
  const users = data?.users || [];
  const [chatUser, setChatUser] = useState('');
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <Layout title="Users">
      <div className="max-w-xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold">Users</h1>
        <ul className="space-y-2">
          {users.map(u => (
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
          ))}
        </ul>
      </div>
      <ChatPanel open={chatOpen} user={chatUser} onClose={() => setChatOpen(false)} />
    </Layout>
  );
}
