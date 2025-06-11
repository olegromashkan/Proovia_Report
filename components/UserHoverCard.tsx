import { useState, useEffect, ReactNode } from 'react';
import Link from 'next/link';
import ChatPanel from './ChatPanel';

interface Props {
  username: string;
  children: ReactNode;
}

export default function UserHoverCard({ username, children }: Props) {
  const [open, setOpen] = useState(false);
  const [info, setInfo] = useState<any>(null);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    if (open && !info) {
      fetch(`/api/user?username=${username}`)
        .then(res => res.ok ? res.json() : Promise.reject())
        .then(data => setInfo(data.user))
        .catch(() => {});
    }
  }, [open, username, info]);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {children}
      {open && info && (
        <div className="absolute z-50 mt-2 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg">
          <div className="relative h-20 rounded-t-xl overflow-hidden">
            {info.header && (
              <img src={info.header} alt="header" className="w-full h-full object-cover" />
            )}
            {info.photo ? (
              <img
                src={info.photo}
                alt={info.username}
                className="w-16 h-16 rounded-full border-2 border-white absolute -bottom-8 left-4 object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full border-2 border-white absolute -bottom-8 left-4 bg-gray-300 flex items-center justify-center font-bold text-gray-600">
                {info.username[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <div className="pt-8 pb-4 px-4">
            <Link href={`/profile/${info.username}`} className="font-semibold text-gray-900 dark:text-white">
              {info.username}
            </Link>
            <button
              className="btn btn-sm btn-primary mt-2"
              onClick={() => { setChatOpen(true); setOpen(false); }}
            >
              Write Message
            </button>
          </div>
        </div>
      )}
      <ChatPanel open={chatOpen} user={username} onClose={() => setChatOpen(false)} />
    </div>
  );
}
