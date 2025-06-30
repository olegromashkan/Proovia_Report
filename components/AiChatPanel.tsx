import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Icon from './Icon';

interface AiChatPanelProps {
  open: boolean;
  onClose: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

export default function AiChatPanel({ open, onClose }: AiChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async () => {
    if (!text.trim()) return;
    const query = text;
    setText('');
    setMessages((msgs) => [...msgs, { role: 'user', text: query }]);
    setLoading(true);
    try {
      const res = await fetch('/api/ai-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userQuery: query }),
      });
      const data = await res.json();
      if (res.ok) {
        const resultText = JSON.stringify(data.result, null, 2);
        setMessages((msgs) => [
          ...msgs,
          { role: 'assistant', text: `SQL: ${data.sql}\n\n${resultText}` },
        ]);
      } else {
        setMessages((msgs) => [
          ...msgs,
          { role: 'assistant', text: data.error || 'Error' },
        ]);
      }
    } catch (err) {
      setMessages((msgs) => [
        ...msgs,
        { role: 'assistant', text: 'Request failed' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-6 right-6 w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-xl z-50 border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Icon name="robot" className="w-5 h-5" />
          AI Assistant
        </h3>
        <button
          onClick={onClose}
          className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all duration-200"
          aria-label="Close chat"
        >
          <Icon name="xmark" className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50 dark:bg-gray-900/50">
        {messages.length === 0 ? (
          <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
            Ask me about the data!
          </div>
        ) : (
          messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`p-3 rounded-2xl max-w-[80%] text-sm whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-primary text-primary-content rounded-br-sm'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="text-sm text-gray-500 dark:text-gray-400">Thinking...</div>
        )}
        <div ref={endRef} />
      </div>

      <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            className="input input-bordered flex-1 bg-gray-100/50 dark:bg-gray-700/50 border-gray-200/50 dark:border-gray-600/50 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-[#b53133] transition-all duration-200"
            placeholder="Type a message..."
          />
          <button
            onClick={send}
            disabled={!text.trim() || loading}
            className="w-12 h-12 flex items-center justify-center rounded-lg bg-primary text-primary-content disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-all"
            aria-label="Send"
          >
            <Icon name="paper-plane" className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
