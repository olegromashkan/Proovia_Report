import { useState, useEffect, useRef } from 'react';
import Icon from './Icon';
import useUser from '../lib/useUser';
import Picker from 'emoji-picker-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
  }, [open, user]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!text.trim()) return;
    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: user, text }),
    });
    setText('');
    load();
    inputRef.current?.focus();
  };

  const createTask = async () => {
    if (!text.trim()) return;
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignee: user, text }),
    });
    setText('');
    inputRef.current?.focus();
  };

  const onEmojiClick = (emojiObject: { emoji: string }) => {
    setText((prev) => prev + emojiObject.emoji);
    inputRef.current?.focus();
  };

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-6 right-6 w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-xl z-50 border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200/50 dark:border-gray-700/50 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="relative w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{user[0]?.toUpperCase()}</span>
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-white dark:border-gray-800" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white truncate max-w-[200px]">
            {user}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all duration-200"
          aria-label="Close chat"
        >
          <Icon name="xmark" className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50 dark:bg-gray-900/50">
        {messages.length === 0 ? (
          <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
            No messages yet
          </div>
        ) : (
          messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${m.sender === me ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`
                  p-3 rounded-2xl max-w-[80%] text-sm
                  ${m.sender === me
                    ? 'bg-primary text-primary-content rounded-br-sm'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm'
                  }
                `}
              >
                <div className="break-words">{m.text}</div>
                <div className="text-xs opacity-70 mt-1 text-right">
                  {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </motion.div>
          ))
        )}
        <div ref={endRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-gray-200/50 dark:border-gray-700/50 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm">
        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="absolute bottom-20 left-0 right-0 mx-3"
            >
              <Picker onEmojiClick={onEmojiClick} />
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all duration-200"
            aria-label="Toggle emoji picker"
          >
            <Icon
              name="emoji-happy"
              className="w-5 h-5"
            />
          </button>
          <input
            ref={inputRef}
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
            onClick={createTask}
            disabled={!text.trim()}
            className="w-12 h-12 flex items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
            aria-label="Create task"
          >
            <Icon name="plus" className="w-5 h-5" />
          </button>
          <button
            onClick={send}
            disabled={!text.trim()}
            className="w-12 h-12 flex items-center justify-center rounded-lg bg-primary text-primary-content disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-all"
            aria-label="Send message"
          >
            <Icon name="paper-plane" className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
