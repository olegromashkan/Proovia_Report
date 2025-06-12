import { useState, useEffect, useRef } from 'react';
import Icon from './Icon';
import useUser from '../lib/useUser';
import Picker from 'emoji-picker-react';
import { motion, AnimatePresence } from 'framer-motion';
import CreateGroupModal from './CreateGroupModal';
import EditGroupModal from './EditGroupModal';
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
  const [editOpen, setEditOpen] = useState(false);
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

  const lastIdRef = useRef<number | null>(null);
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (lastIdRef.current && last.id !== lastIdRef.current && last.sender !== me) {
      if (Notification.permission === 'granted') {
        new Notification(last.sender, { body: last.text });
      }
    }
    lastIdRef.current = last.id;
  }, [messages, me]);

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
      <div className="flex-1 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 gap-6 bg-white dark:bg-gray-900">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-full flex items-center justify-center">
            <Icon name="chat" className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-xl font-medium">No conversation selected</div>
          <div className="text-sm text-gray-400 dark:text-gray-500">Pick a conversation from the sidebar to start messaging</div>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-content rounded-full font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:bg-primary/90 hover:shadow-xl"
          aria-label="Create new group"
        >
          <Icon name="plus" className="w-5 h-5" />
          New Group
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
    <>
      <div className="flex flex-col h-full bg-white dark:bg-gray-900 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            {photo ? (
              <img
                src={photo}
                alt={name || user || ''}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-white dark:ring-gray-800 shadow-sm"
                loading="lazy"
              />
            ) : (
              <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-sm">
                <span className="text-sm font-semibold text-white">
                  {(name || user || '')[0]?.toUpperCase()}
                </span>
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white truncate max-w-[200px]">
                {name || user}
              </h3>
              <div className="text-xs text-green-600 dark:text-green-500 font-medium">Online</div>
            </div>
          </div>
          {chatId && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setEditOpen(true)}
                className="p-2.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all duration-200"
                aria-label="Edit group"
              >
                <Icon name="pen" className="w-4 h-4" />
              </button>
              <button
                onClick={async () => {
                  if (!confirm('Delete this chat?')) return;
                  await fetch(`/api/chats?id=${chatId}`, { method: 'DELETE' });
                  window.location.reload();
                }}
                className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all duration-200"
                aria-label="Delete chat"
              >
                <Icon name="trash" className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50/30 dark:bg-gray-900/30">
          {replyTo && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center justify-between mb-3 bg-primary/10 dark:bg-primary/20 rounded-2xl px-4 py-3 border border-primary/30 dark:border-primary/40"
            >
              <div className="flex items-center gap-3">
                <Icon name="reply" className="w-4 h-4 text-primary" />
                <span className="text-sm text-blue-800 dark:text-blue-300 truncate max-w-[250px]">
                  Replying to: {replyTo.text.length > 40 ? replyTo.text.slice(0, 40) + '…' : replyTo.text}
                </span>
              </div>
              <button
                onClick={cancelReply}
                className="p-1 text-primary hover:bg-primary/10 rounded-full transition-all"
                aria-label="Cancel reply"
              >
                <Icon name="xmark" className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {pinnedMessages.length > 0 && (
            <div className="space-y-2 mb-4">
              {pinnedMessages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex justify-center"
                >
                  <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 px-4 py-2 rounded-2xl text-sm flex items-center gap-3 max-w-[85%] border border-amber-200 dark:border-amber-800">
                    <Icon name="star" className="w-4 h-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                    <span className="break-words flex-1">{m.text}</span>
                    <button
                      onClick={() => togglePin(m)}
                      className="text-xs hover:underline text-amber-700 dark:text-amber-300 font-medium"
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
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <Icon name="chat" className="w-6 h-6 text-gray-400" />
              </div>
              <div className="text-gray-500 dark:text-gray-400 font-medium">No messages yet</div>
              <div className="text-sm text-gray-400 dark:text-gray-500 mt-1">Start the conversation!</div>
            </div>
          ) : (
            messages.map((m) => {
              const senderPhoto = users.find((u) => u.username === m.sender)?.photo;
              const replyText = messages.find((r) => r.id === m.reply_to)?.text;
              const isMe = m.sender === me;
              
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  {!isMe && (
                    senderPhoto ? (
                      <img
                        src={senderPhoto}
                        alt={m.sender}
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-white dark:ring-gray-800 shadow-sm"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                        {m.sender[0]?.toUpperCase()}
                      </div>
                    )
                  )}
                  
                  <div
                    className={`relative px-4 py-2.5 max-w-[75%] sm:max-w-[65%] text-sm group transition-all duration-200 ${
                      isMe
                        ? 'bg-primary text-primary-content rounded-3xl rounded-br-lg shadow-md'
                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-3xl rounded-bl-lg shadow-md border border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    {m.reply_to && replyText && (
                      <div className={`text-xs mb-2 p-2 rounded-xl border-l-3 ${
                        isMe
                          ? 'bg-primary/30 border-primary text-primary-content'
                          : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                      }`}>
                        {replyText.length > 50 ? replyText.slice(0, 50) + '…' : replyText}
                      </div>
                    )}
                    
                    <div className="break-words leading-relaxed">{m.text}</div>
                    
                    <div className={`text-xs mt-1 text-right ${
                      isMe ? 'text-primary-content' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    
                    <div className="absolute hidden group-hover:flex gap-1 -top-2 right-2">
                      <button
                        onClick={() => startReply(m)}
                        className="bg-white dark:bg-gray-700 p-1.5 rounded-full hover:bg-gray-50 dark:hover:bg-gray-600 transition-all shadow-lg border border-gray-200 dark:border-gray-600"
                        aria-label="Reply to message"
                      >
                        <Icon name="reply" className="w-3 h-3 text-gray-600 dark:text-gray-300" />
                      </button>
                      <button
                        onClick={() => togglePin(m)}
                        className="bg-white dark:bg-gray-700 p-1.5 rounded-full hover:bg-gray-50 dark:hover:bg-gray-600 transition-all shadow-lg border border-gray-200 dark:border-gray-600"
                        aria-label={m.pinned ? 'Unpin message' : 'Pin message'}
                      >
                        <Icon name="star" className="w-3 h-3 text-gray-600 dark:text-gray-300" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
          <div ref={endRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
          <AnimatePresence>
            {showEmojiPicker && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="absolute bottom-20 left-4 right-4 z-50"
                ref={emojiPickerRef}
              >
                <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <button
                    onClick={() => setShowEmojiPicker(false)}
                    className="absolute top-3 right-3 z-10 p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all"
                    aria-label="Close emoji picker"
                  >
                    <Icon name="xmark" className="w-4 h-4" />
                  </button>
                  <Picker onEmojiClick={onEmojiClick} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="flex items-end gap-3">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`p-3 rounded-full transition-all duration-200 ${
                showEmojiPicker
                  ? 'bg-primary text-primary-content shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              aria-label="Toggle emoji picker"
            >
              <Icon name="emoji-happy" className="w-5 h-5" />
            </button>
            
            <div className="flex-1 relative">
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
                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-3xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:bg-white dark:focus:bg-gray-700 focus:ring-2 focus:ring-blue-500 transition-all duration-200 resize-none"
                placeholder="Type a message..."
                aria-label="Message input"
              />
            </div>
            
            <button
              onClick={createTask}
              disabled={!text.trim()}
              className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
              aria-label="Create task"
            >
              <Icon name="plus" className="w-5 h-5" />
            </button>
            
            <button
              onClick={send}
              disabled={!text.trim()}
              className={`p-3 rounded-full transition-all duration-200 transform ${
                text.trim()
                  ? 'bg-primary hover:bg-primary/90 text-primary-content shadow-lg hover:shadow-xl hover:scale-105'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              }`}
              aria-label="Send message"
            >
              <Icon name="paper-plane" className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      
      <EditGroupModal
        open={editOpen}
        chat={chatId ? { id: chatId, name: name || '', photo: photo || undefined } : null}
        onClose={() => setEditOpen(false)}
        onSaved={() => window.location.reload()}
      />
    </>
  );
}