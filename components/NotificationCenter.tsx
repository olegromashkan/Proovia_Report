import { useEffect, useState, useMemo } from 'react';
import Icon from './Icon';
import useNotifications, { Notification } from '../lib/useNotifications';

// Хелпер для отображения относительного времени
function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return Math.floor(seconds) + " seconds ago";
}

// Хелпер для стилизации уведомлений в зависимости от типа
const getNotificationStyle = (type: string) => {
    switch (type.toLowerCase()) {
        case 'upload':
            return { icon: 'upload', colorClass: 'text-success' };
        case 'update':
            return { icon: 'pen', colorClass: 'text-info' };
        case 'delete':
            return { icon: 'trash', colorClass: 'text-warning' };
        case 'error':
            return { icon: 'ban', colorClass: 'text-error' };
        case 'task':
            return { icon: 'check', colorClass: 'text-success' };
        case 'message':
            return { icon: 'chat', colorClass: 'text-info' };
        case 'comment':
            return { icon: 'chat-left', colorClass: 'text-info' };
        case 'like':
            return { icon: 'hand-thumbs-up', colorClass: 'text-info' };
        case 'post':
            return { icon: 'plus', colorClass: 'text-info' };
        default:
            return { icon: 'bell', colorClass: 'text-base-content' };
    }
}

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const { items, loading, load, remove, removeAll } = useNotifications();

  useEffect(() => {
    if (open) {
      load();
    }
  }, [open, load]);
  
  const unreadCount = useMemo(() => items.length, [items]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
        aria-label="Notifications"
      >
        <Icon name="bell" className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full text-xs px-1">
            {unreadCount}
          </span>
        )}
      </button>
      
      {open && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">Notifications</h3>
            {items.length > 0 && (
              <button onClick={removeAll} className="text-sm text-[#b53133] hover:underline">Clear all</button>
            )}
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center h-24">
                <span className="animate-spin w-5 h-5 border-2 border-current border-t-transparent rounded-full" />
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <Icon name="check-circle" className="text-4xl mb-2" />
                <p>You are all caught up!</p>
              </div>
            ) : (
              items.map((n) => {
                const { icon, colorClass } = getNotificationStyle(n.type);
                return (
                  <div
                    key={n.id}
                    className="p-3 rounded-xl flex items-start gap-4 bg-gray-100 dark:bg-gray-700/50 group hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${colorClass.replace('text-', 'bg-')}/10`}>
                      <Icon name={icon} className={`${colorClass} text-lg`} />
                    </div>
                    <div className="flex-grow">
                      <p className="font-semibold text-sm leading-tight">{n.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                    <button
                      onClick={() => remove(n.id)}
                      className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                    >
                      <Icon name="xmark" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}