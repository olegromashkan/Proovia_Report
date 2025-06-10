import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';
import Layout from '../../components/Layout';
import useUser from '../../lib/useUser';
import { useChat } from '../../contexts/ChatContext';

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
  const isGroup = user?.startsWith('g:');
  const groupId = isGroup ? user.slice(2) : '';
  const me = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [reply, setReply] = useState<Message | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const { openChat } = useChat();

  const load = async () => {
    if (!user) return;
    const res = await fetch(
      isGroup
        ? `/api/messages?group=${groupId}`
        : `/api/messages?user=${encodeURIComponent(user)}`
    );
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
      body: JSON.stringify(isGroup ? { group: groupId, text, replyTo: reply?.id } : { to: user, text, replyTo: reply?.id })
    });
    setText('');
    setReply(null);
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
      <button className="btn btn-sm mb-2" onClick={() => {openChat(user); router.push('/');}}>
        Minimize
      </button>
      <div className="max-w-xl mx-auto flex flex-col gap-4" style={{height:'70vh'}}>
      <div className="flex-1 overflow-y-auto space-y-2 p-2 border rounded" style={{background:'var(--section-bg)'}}>
        {messages.map(m => (
            <div key={m.id} className={`p-2 rounded-lg max-w-xs ${m.sender===me?'bg-blue-500 text-white ml-auto':'bg-gray-200 dark:bg-gray-700'}`}
            onDoubleClick={() => setReply(m)}>
              {m.reply_to && (
                <div className="text-xs text-gray-600 mb-1">Reply to #{m.reply_to}</div>
              )}
              {m.text}
            </div>
        ))}
        <div ref={endRef}></div>
      </div>
        {reply && (
          <div className="p-2 text-sm bg-gray-200 dark:bg-gray-700 rounded flex justify-between items-center">
            <span>Replying to: {reply.text}</span>
            <button className="ml-2" onClick={() => setReply(null)}>x</button>
          </div>
        )}
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
