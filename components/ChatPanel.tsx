import { useState, useEffect, useRef } from 'react';
import Icon from './Icon';
import useUser from '../lib/useUser';

interface Message {
  id: number;
  sender: string;
  receiver: string;
  text: string;
  created_at: string;
}

interface ChatPanelProps {
  open: boolean;
  user: string;
  onClose: () => void;
}

export default function ChatPanel({ open, user, onClose }: ChatPanelProps) {
  const me = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    if (!user) return;
    const res = await fetch(`/api/messages?user=${user}`);
    if (res.ok) {
      const d = await res.json();
      setMessages(d.messages);
    }
  };

  useEffect(() => {
    if (!open) return;
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!text) return;
    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: user, text })
    });
    setText('');
    load();
  };

  if (!open) return null;

  return (
    <div className="fixed bottom-6 right-6 w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-xl z-50 border border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
          <Icon name="chat" className="w-5 h-5" />
          Chat with {user}
        </h3>
        <button onClick={onClose} className="btn btn-sm btn-ghost rounded-full">
          <Icon name="xmark" className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2" style={{background:'var(--section-bg)'}}>
        {messages.map(m => (
          <div key={m.id} className={`p-2 rounded-lg max-w-xs text-sm ${m.sender===me?'bg-blue-500 text-white ml-auto':'bg-gray-200 dark:bg-gray-700'}`}>
            <div>{m.text}</div>
            <div className="text-xs opacity-70 mt-1 text-right">{new Date(m.created_at).toLocaleTimeString()}</div>
          </div>
        ))}
        <div ref={endRef}></div>
      </div>
      <div className="flex gap-2 p-3 border-t border-gray-200 dark:border-gray-700">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if(e.key==='Enter'){ e.preventDefault(); send(); } }}
          className="input input-bordered flex-1"
          placeholder="Type a message..."
        />
        <button onClick={send} className="btn btn-primary" disabled={!text}>Send</button>
      </div>
    </div>
  );
}
