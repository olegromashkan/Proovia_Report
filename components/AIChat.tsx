import { useState, useRef, useEffect } from 'react';
import Icon from './Icon';

interface Message {
  sender: 'user' | 'ai';
  text: string;
  sql?: string;
}

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const query = text.trim();
    if (!query) return;
    setMessages((m) => [...m, { sender: 'user', text: query }]);
    setText('');
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userQuery: query }),
      });
      const data = await res.json();
      if (res.ok) {
        const aiText = JSON.stringify(data.result, null, 2);
        setMessages((m) => [...m, { sender: 'ai', text: aiText, sql: data.sql }]);
      } else {
        setMessages((m) => [...m, { sender: 'ai', text: data.error || 'Error' }]);
      }
    } catch {
      setMessages((m) => [...m, { sender: 'ai', text: 'Request failed' }]);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-[#b53133] text-white rounded-full shadow-lg z-50"
        aria-label="Open AI chat"
      >
        <Icon name="robot" className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-xl z-50 flex flex-col border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold">AI Assistant</h3>
        <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-700" aria-label="Close">
          <Icon name="xmark" className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
        {messages.map((m, idx) => (
          <div key={idx} className={m.sender === 'user' ? 'text-right' : 'text-left'}>
            <div className={`inline-block px-3 py-2 rounded-xl max-w-full break-words ${m.sender === 'user' ? 'bg-[#b53133] text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'}`}>
              <pre className="whitespace-pre-wrap">{m.text}</pre>
              {m.sql && <pre className="mt-1 text-xs text-gray-500">{m.sql}</pre>}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
          placeholder="Ask the database..."
          className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-2 text-sm focus:outline-none"
        />
        <button onClick={send} disabled={!text.trim()} className="bg-[#b53133] text-white rounded-full px-4 py-2 disabled:opacity-50" aria-label="Send">
          <Icon name="paper-plane" className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
