import useFetch from '../lib/useFetch';
import useUser from '../lib/useUser';
import { useChat } from '../contexts/ChatContext';
import Icon from './Icon';

interface ChatListProps {
  open: boolean;
  onClose: () => void;
}

export default function ChatList({ open, onClose }: ChatListProps) {
  const me = useUser();
  const { data } = useFetch<{ users: any[] }>(open ? '/api/users' : null);
  const users = (data?.users || []).filter(u => u.username !== me);
  const { openChat } = useChat();

  if (!open) return null;

  return (
    <div className="fixed bottom-6 right-6 w-full max-w-xs bg-white dark:bg-gray-800 rounded-2xl shadow-xl z-50 p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Icon name="chat" className="w-5 h-5" />
          Chats
        </h3>
        <button onClick={onClose} className="btn btn-sm btn-ghost">
          <Icon name="xmark" />
        </button>
      </div>
      <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {users.map(u => (
          <li key={u.id}>
            <button
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
              onClick={() => { openChat(u.username); onClose(); }}
            >
              {u.photo && (
                <img src={u.photo} alt="avatar" className="w-8 h-8 rounded-full" />
              )}
              <span className="relative flex items-center">
                {u.username}
                <span className={`ml-2 w-2.5 h-2.5 rounded-full ${u.status === 'online' ? 'bg-green-500' : u.status === 'away' ? 'bg-orange-500' : u.status === 'dnd' ? 'bg-red-500' : 'bg-gray-400'}`}></span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
