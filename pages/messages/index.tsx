import { useState } from 'react';
import { formatDateTime } from '../../lib/formatDate';
import Icon from '../../components/Icon';
import Layout from '../../components/Layout'; // Verify this path
import useFetch from '../../lib/useFetch';
import ChatWindow from '../../components/ChatWindow';
import CreateGroupModal from '../../components/CreateGroupModal';
import EditGroupModal from '../../components/EditGroupModal';

export default function MessagesPage() {
  const { data } = useFetch<{ users: any[] }>('/api/users?last=1');
  const { data: chatData } = useFetch<{ chats: any[] }>('/api/chats');
  const users = data?.users || [];
  const chats = chatData?.chats || [];
  const [active, setActive] = useState<{ type: 'user' | 'chat'; id: string | number; name?: string; photo?: string } | null>(null);
  const [query, setQuery] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editGroup, setEditGroup] = useState<any | null>(null);

  const filtered = users.filter((u) =>
    u.username.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Layout title="Messages" fullWidth>
      <div className="flex flex-col md:flex-row h-[90vh] mx-auto max-w-7xl bg-gray-50 dark:bg-gray-900">
        {/* Sidebar */}
        <div className="w-full md:w-80 shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <input
              type="text"
              placeholder="Search messages..."
              className="input input-bordered w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-full py-2 px-4 focus:ring-2 focus:ring-[#b53133]"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-lg text-gray-900 dark:text-gray-100">Messages</span>
            <button
              onClick={() => setCreateOpen(true)}
              className="btn btn-sm btn-circle btn-primary"
              aria-label="New group"
            >
              <Icon name="plus" className="w-4 h-4" />
            </button>
          </div>
          <div className="overflow-y-auto flex-1 space-y-2">
            {chats.map((c) => (
              <div key={`c-${c.id}`} className="relative group">
                <button
                  onClick={() => setActive({ type: 'chat', id: c.id, name: c.name, photo: c.photo })}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                    active?.type === 'chat' && active.id === c.id
                      ? 'bg-[#b53133]/10'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {c.photo ? (
                    <img src={c.photo} alt={c.name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold">
                      {c.name[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-900 dark:text-gray-100 truncate">{c.name}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {c.lastTime
                          ? formatDateTime(c.lastTime, {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : ''}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {c.lastMessage || 'No messages yet'}
                    </div>
                  </div>
                  {c.unread && (
                    <div className="w-2 h-2 rounded-full bg-[#b53133] absolute right-3 top-5" />
                  )}
                </button>
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setEditGroup(c)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full"
                  >
                    <Icon name="pen" className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm('Delete this chat?')) return;
                      await fetch(`/api/chats?id=${c.id}`, { method: 'DELETE' });
                      window.location.reload();
                    }}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full"
                  >
                    <Icon name="trash" className="w-4 h-4 text-red-500" />
                  </button>
                  <button
                    onClick={async () => {
                      await fetch('/api/chats', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: c.id, pinned: c.pinned ? 0 : 1 }),
                      });
                      window.location.reload();
                    }}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full"
                  >
                    <Icon name="star" className={`w-4 h-4 ${c.pinned ? 'text-yellow-400' : 'text-gray-500 dark:text-gray-400'}`} />
                  </button>
                </div>
              </div>
            ))}
            <div className="mt-4 font-semibold text-lg text-gray-900 dark:text-gray-100">Direct Messages</div>
            {filtered.map((u) => (
              <button
                key={u.id}
                onClick={() => setActive({ type: 'user', id: u.username, name: u.username, photo: u.photo })}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                  active?.type === 'user' && active.id === u.username
                    ? 'bg-[#b53133]/10'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {u.photo ? (
                  <img src={u.photo} alt={u.username} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold">
                    {u.username[0]?.toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-900 dark:text-gray-100 truncate">{u.username}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {u.lastTime
                        ? formatDateTime(u.lastTime, {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : ''}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {u.lastMessage || 'No messages yet'}
                  </div>
                </div>
                {u.unread && (
                  <div className="w-2 h-2 rounded-full bg-[#b53133] absolute right-3 top-5" />
                )}
              </button>
            ))}
          </div>
        </div>
        {/* Chat Window */}
        <div className="flex-1 min-w-0 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          <ChatWindow
            user={active?.type === 'user' ? (active.id as string) : undefined}
            chatId={active?.type === 'chat' ? (active.id as number) : undefined}
            name={active?.name}
            photo={active?.photo}
          />
        </div>
      </div>
      <CreateGroupModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => window.location.reload()}
      />
      <EditGroupModal
        open={!!editGroup}
        chat={editGroup}
        onClose={() => setEditGroup(null)}
        onSaved={() => window.location.reload()}
      />
    </Layout>
  );
}
