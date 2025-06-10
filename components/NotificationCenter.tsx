import { useEffect, useState, useMemo } from 'react';
import Icon from './Icon';

interface Notification {
  id: number;
  type: string;
  message: string;
  created_at: string;
}

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
        case 'message':
            return { icon: 'chat', colorClass: 'text-info' };
        default:
            return { icon: 'bell', colorClass: 'text-base-content' };
    }
}

export default function NotificationCenter() {
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const load = async () => {
    setIsLoading(true);
    const res = await fetch('/api/notifications');
    if (res.ok) {
      const data = await res.json();
      setItems(data.items as Notification[]);
    }
    setIsLoading(false);
  };

  const remove = async (id: number) => {
    await fetch(`/api/notifications?id=${id}`, { method: 'DELETE' });
    load();
  };
  
  const removeAll = async () => {
    await Promise.all(items.map(i => fetch(`/api/notifications?id=${i.id}`, { method: 'DELETE' })));
    load();
  }

  useEffect(() => {
    if (open) {
      load();
    }
  }, [open]);
  
  const unreadCount = useMemo(() => items.length, [items]);

  return (
    <div className="dropdown dropdown-end">
      <label tabIndex={0} className="btn btn-ghost btn-circle" onClick={() => setOpen(!open)}>
        <div className="indicator">
          <Icon name="bell" className="text-xl" />
          {unreadCount > 0 && (
            <span className="badge badge-sm badge-primary indicator-item animate-pulse">{unreadCount}</span>
          )}
        </div>
      </label>
      
      {open && (
         <div tabIndex={0} className="dropdown-content mt-3 z-[50] card card-compact w-96 bg-base-100 shadow-2xl border border-base-content/10">
            <div className="card-body p-4">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="card-title text-lg">Notifications</h3>
                    {items.length > 0 && <button onClick={removeAll} className="btn btn-xs btn-ghost">Clear all</button>}
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto p-1">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-24">
                            <span className="loading loading-spinner"></span>
                        </div>
                    ) : items.length === 0 ? (
                        <div className="text-center py-10 text-base-content/50">
                            <Icon name="check-circle" className="text-4xl mb-2" />
                            <p>You are all caught up!</p>
                        </div>
                    ) : (
                        items.map((n) => {
                            const { icon, colorClass } = getNotificationStyle(n.type);
                            return (
                                <div key={n.id} className="p-3 rounded-system flex items-start gap-4 bg-base-200/50 group transition-all hover:bg-base-200 shadow-system">
                                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${colorClass.replace('text-', 'bg-')}/10`}>
                                        <Icon name={icon} className={`${colorClass} text-lg`} />
                                    </div>
                                    <div className="flex-grow">
                                        <p className="font-semibold text-sm leading-tight">{n.message}</p>
                                        <p className="text-xs text-base-content/60 mt-1">{timeAgo(n.created_at)}</p>
                                    </div>
                                    <button onClick={() => remove(n.id)} className="btn btn-xs btn-circle btn-ghost text-base-content/30 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Icon name="xmark" />
                                    </button>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
         </div>
      )}
    </div>
  );
}