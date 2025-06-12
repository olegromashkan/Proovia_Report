import { useState, useEffect, useRef } from 'react';
import Icon from './Icon';
import useUser from '../lib/useUser';
import Picker from 'emoji-picker-react';
import { motion, AnimatePresence } from 'framer-motion';
import CreateGroupModal from './CreateGroupModal';

interface Message {
  id: number;
  sender: string;
  receiver: string;
  text: string;
  reply_to?: number;
  pinned?: number;
  created_at: string;
}

interface ChatWindowProps {
  user?: string | null;
  chatId?: number | null;
  name?: string | null;
}

export default function ChatWindow({ user, chatId, name }: ChatWindowProps) {
  const me = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    if (!user && !chatId) return;
    const query = chatId ? `chat=${chatId}` : `user=${user}`;
    const res = await fetch(`/api/messages?${query}`);
    if (res.ok) {
      const d = await res.json();
      setMessages(d.messages);
      setPinnedMessages(d.pinned || []);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [user, chatId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!text.trim() || (!user && !chatId)) return;
    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: user, chatId, text, replyTo: replyTo?.id }),
    });
    setText('');
    setReplyTo(null);
    load();
    inputRef.current?.focus();
  };

  const togglePin = async (m: Message) => {
    await fetch('/api/messages', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: m.id, pinned: m.pinned ? 0 : 1 }),
    });
    load();
  };

  const createTask = async () => {
    if (!text.trim() || !user) return;
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

  const startReply = (m: Message) => setReplyTo(m);
  const cancelReply = () => setReplyTo(null);

  if (!user && !chatId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 gap-4">
        <div>Select a chat to start messaging</div>
        <button onClick={() => setCreateOpen(true)} className="btn btn-primary btn-sm">New group</button>
        <CreateGroupModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onCreated={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200/50 dark:border-gray-700/50">
        {replyTo && (
          <div className="flex items-center justify-between mb-2 bg-gray-100 dark:bg-gray-700 rounded p-2 text-xs">
            <span className="truncate">Replying to: {replyTo.text}</span>
            <button onClick={cancelReply} className="ml-2 text-gray-600 dark:text-gray-300">
              <Icon name="xmark" className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="relative w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{user[0]?.toUpperCase()}</span>
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-white dark:border-gray-800" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white truncate max-w-[200px]">
            {name || user}
          </h3>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50 dark:bg-gray-900/50">
        {pinnedMessages.length > 0 && (
          <div className="space-y-3">
            {pinnedMessages.map((m) => (
              <div key={m.id} className="flex justify-center">
                <div className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100 px-3 py-1 rounded-lg text-sm flex items-center gap-2">
                  <Icon name="star" className="w-4 h-4" />
                  <span className="break-words">{m.text}</span>
                  <button onClick={() => togglePin(m)} className="ml-1 text-xs">Unpin</button>
                </div>
              </div>
            ))}
          </div>
        )}
        {messages.length === 0 && pinnedMessages.length === 0 ? (
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
                className={`relative p-3 rounded-2xl max-w-[80%] text-sm group ${
                  m.sender === me
                    ? 'bg-blue-500 text-white rounded-br-sm'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm'
                }`}
              >
                {m.reply_to && (
                  <div className="text-xs opacity-70 mb-1 border-l-2 border-gray-400 pl-2">
                    Reply to: {messages.find((r) => r.id === m.reply_to)?.text || `#${m.reply_to}`}
                  </div>
                )}
                <div className="break-words">{m.text}</div>
                <div className="text-xs opacity-70 mt-1 text-right">
                  {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="absolute hidden group-hover:flex gap-1 -top-3 right-0 text-xs">
                  <button onClick={() => startReply(m)} className="bg-gray-300 dark:bg-gray-600 p-1 rounded">
                    <Icon name="reply" className="w-3 h-3" />
                  </button>
                  <button onClick={() => togglePin(m)} className="bg-gray-300 dark:bg-gray-600 p-1 rounded">
                    <Icon name="star" className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
        <div ref={endRef} />
      </div>

      <div className="p-3 border-t border-gray-200/50 dark:border-gray-700/50">
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
            <Icon name="emoji-happy" className="w-5 h-5" />
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
            className="input input-bordered flex-1 bg-gray-100/50 dark:bg-gray-700/50 border-gray-200/50 dark:border-gray-600/50 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all duration-200"
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
            className="w-12 h-12 flex items-center justify-center rounded-lg bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-all"
            aria-label="Send message"
          >
            <Icon name="paper-plane" className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

