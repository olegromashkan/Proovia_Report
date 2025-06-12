
import { useState, useEffect, useRef } from 'react';
import Icon from './Icon';
import useUser from '../lib/useUser';
import Picker from 'emoji-picker-react';
import { motion, AnimatePresence } from 'framer-motion';
import CreateGroupModal from './CreateGroupModal';
import useFetch from '../lib/useFetch';

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
  photo?: string | null;
}

export default function ChatWindow({ user, chatId, name, photo }: ChatWindowProps) {
  const me = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const { data: usersData } = useFetch<{ users: any[] }>('/api/users');
  const users = usersData?.users || [];

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const send = async () => {
    if (!text.trim() || (!user && !chatId)) return;
    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: user, chatId, text, replyTo: replyTo?.id }),
    });
    setText('');
    setReplyTo(null);
    setShowEmojiPicker(false);
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
        <div className="text-lg">Select a chat to start messaging</div>
        <button
          onClick={() => setCreateOpen(true)}
          className="btn btn-primary btn-sm px-4"
          aria-label="Create new group"
        >
          New group
        </button>
        <CreateGroupModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onCreated={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200/50 dark:border-gray-700/50 bg-white dark:bg-gray-800 shadow-sm">
        <div className="flex items-center gap-3">
          {photo ? (
            <img
              src={photo}
              alt={name || user || ''}
              className="w-9 h-9 rounded-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-200">
                {(name || user || '')[0]?.toUpperCase()}
              </span>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
            </div>
          )}
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white truncate max-w-[70vw] sm:max-w-[300px]">
            {name || user}
          </h3>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50/50 dark:bg-gray-900/50 -webkit-overflow-scrolling-touch">
        {replyTo && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-between mb-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-2 text-xs border border-gray-200 dark:border-gray-700"
          >
            <span className="truncate max-w-[80%]">
              Replying to: {replyTo.text.length > 50 ? replyTo.text.slice(0, 50) + '…' : replyTo.text}
            </span>
            <button
              onClick={cancelReply}
              className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
              aria-label="Cancel reply"
            >
              <Icon name="xmark" className="w-4 h-4" />
            </button>
          </motion.div>
        )}
        {pinnedMessages.length > 0 && (
          <div className="space-y-2 mb-2">
            {pinnedMessages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex justify-center"
              >
                <div className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100 px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 max-w-[90%]">
                  <Icon name="star" className="w-4 h-4 flex-shrink-0" />
                  <span className="break-words flex-1">{m.text}</span>
                  <button
                    onClick={() => togglePin(m)}
                    className="text-xs hover:underline"
                    aria-label="Unpin message"
                  >
                    Unpin
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
        {messages.length === 0 && pinnedMessages.length === 0 ? (
          <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-6">
            No messages yet
          </div>
        ) : (
          messages.map((m) => {
            const senderPhoto = users.find((u) => u.username === m.sender)?.photo;
            const replyText = messages.find((r) => r.id === m.reply_to)?.text;
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex items-end gap-2 ${m.sender === me ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender !== me && (
                  senderPhoto ? (
                    <img
                      src={senderPhoto}
                      alt={m.sender}
                      className="w-7 h-7 rounded-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center text-xs font-bold text-gray-700 dark:text-gray-200">
                      {m.sender[0]?.toUpperCase()}
                    </div>
                  )
                )}
                <div
                  className={`relative p-2.5 rounded-xl max-w-[75%] sm:max-w-[60%] text-sm group ${
                    m.sender === me
                      ? 'bg-blue-400 text-white rounded-br-sm'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm'
                  }`}
                >
                  {m.reply_to && replyText && (
                    <div className="text-xs opacity-60 mb-1 border-l-2 border-gray-300 dark:border-gray-500 pl-2">
                      {replyText.length > 50 ? replyText.slice(0, 50) + '…' : replyText}
                    </div>
                  )}
                  <div className="break-words">{m.text}</div>
                  <div className="text-xs opacity-50 mt-0.5 text-right">
                    {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="absolute hidden group-hover:flex gap-1 -top-3 right-2 text-xs">
                    <button
                      onClick={() => startReply(m)}
                      className="bg-gray-200 dark:bg-gray-600 p-1 rounded-full hover:bg-gray-300 dark:hover:bg-gray-500 transition"
                      aria-label="Reply to message"
                    >
                      <Icon name="reply" className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => togglePin(m)}
                      className="bg-gray-200 dark:bg-gray-600 p-1 rounded-full hover:bg-gray-300 dark:hover:bg-gray-500 transition"
                      aria-label={m.pinned ? 'Unpin message' : 'Pin message'}
                    >
                      <Icon name="star" className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      <div className="p-2.5 border-t border-gray-200/50 dark:border-gray-700/50 bg-white dark:bg-gray-800">
        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="absolute bottom-16 left-0 right-0 mx-2.5 max-h-[50vh] overflow-y-auto z-10"
              ref={emojiPickerRef}
            >
              <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowEmojiPicker(false)}
                  className="absolute top-2 right-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  aria-label="Close emoji picker"
                >
                  <Icon name="xmark" className="w-5 h-5" />
                </button>
                <Picker onEmojiClick={onEmojiClick} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all duration-200 sm:p-2.5"
            aria-label="Toggle emoji picker"
          >
            <Icon name="emoji-happy" className="w-5 h-5 sm:w-6 h-6" />
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
            className="input input-bordered flex-1 bg-gray-100/50 dark:bg-gray-700/50 border-gray-200/50 dark:border-gray-600/50 rounded-lg text-gray-900 dark:text-white text-sm sm:text-base focus:ring-2 focus:ring-blue-400 transition-all duration-200 py-2 sm:py-2.5"
            placeholder="Type a message..."
            aria-label="Message input"
          />
          <button
            onClick={createTask}
            disabled={!text.trim()}
            className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
            aria-label="Create task"
          >
            <Icon name="plus" className="w-4 h-4 sm:w-5 h-5" />
          </button>
          <button
            onClick={send}
            disabled={!text.trim()}
            className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-lg bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-all"
            aria-label="Send message"
          >
            <Icon name="paper-plane" className="w-4 h-4 sm:w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}