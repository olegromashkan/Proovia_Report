import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';
import Layout from '../../components/Layout';
import useUser from '../../lib/useUser';

interface Message {
  id: number;
  sender: string;
  receiver: string;
  text: string;
  created_at: string;
}

export default function Chat() {
  const router = useRouter();
  const { user } = router.query as { user: string };
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
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 0);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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

  const createTask = async () => {
    if (!text) return;
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignee: user, text })
    });
    setText('');
  };

  return (
    <Layout title={`Chat with ${user}`}>
      <div className="max-w-2xl mx-auto flex flex-col gap-4" style={{height:'70vh'}}>
        <div className="flex-1 overflow-y-auto space-y-2 p-2 border rounded" style={{background:'var(--section-bg)'}}>
          {messages.map(m => (
            <div
              key={m.id}
                className={`p-2 rounded-lg max-w-xs ${
                m.sender===me
                  ? 'bg-[#b53133] ml-auto text-black dark:text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-black dark:text-white'
              }`}
            >
              {m.text}
            </div>
          ))}
          <div ref={endRef}></div>
        </div>
        <div className="flex gap-2">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            className="input input-bordered flex-1"
            placeholder="Type a message..."
          />
          <button
            onClick={createTask}
            className="btn btn-secondary"
            disabled={!text}
            aria-label="Create task"
          >
            <span className="text-lg">+</span>
          </button>
          <button onClick={send} className="btn btn-primary" disabled={!text}>Send</button>
        </div>
      </div>
    </Layout>
  );
}
