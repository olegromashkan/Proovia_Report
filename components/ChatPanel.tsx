import { useState, useEffect, useRef, useCallback } from 'react';
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
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/messages?user=${user}`);
      if (res.ok) {
        const d = await res.json();
        setMessages(d.messages);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  }, [user]);

  const scrollToBottom = useCallback(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Load messages and set up polling
  useEffect(() => {
    if (!open || !user) return;
    
    load();
    intervalRef.current = setInterval(load, 3000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [open, user, load]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [messages, scrollToBottom]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open]);

  const send = async () => {
    if (!text.trim() || isLoading) return;
    
    setIsLoading(true);
    const messageText = text.trim();
    setText('');
    
    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: user, text: messageText }),
      });
      
      // Optimistically add message to UI
      const tempMessage: Message = {
        id: Date.now(),
        sender: me,
        receiver: user,
        text: messageText,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, tempMessage]);
      
      // Reload to get actual message from server
      setTimeout(load, 500);
    } catch (error) {
      console.error('Failed to send message:', error);
      setText(messageText); // Restore text on error
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const createTask = async () => {
    if (!text.trim() || isLoading) return;
    
    setIsLoading(true);
    const taskText = text.trim();
    setText('');
    
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignee: user, text: taskText }),
      });
    } catch (error) {
      console.error('Failed to create task:', error);
      setText(taskText); // Restore text on error
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const onEmojiClick = (emojiObject: { emoji: string }) => {
    setText((prev) => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    
    // Simple typing indicator
    if (!isTyping && e.target.value.length > 0) {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 1000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    } else if (e.key === 'Escape') {
      setShowEmojiPicker(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getUserInitials = (username: string) => {
    return username.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="fixed bottom-4 right-4 w-full max-w-sm h-[600px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl z-50 border border-gray-200/50 dark:border-gray-700/50 flex flex-col overflow-hidden"
      style={{
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        background: 'rgba(255, 255, 255, 0.95)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200/30 dark:border-gray-700/30">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <span className="text-sm font-semibold text-white">
                {getUserInitials(user)}
              </span>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
              {user}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {messages.length > 0 ? 'Active now' : 'Start conversation'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all duration-200"
        >
          <Icon name="xmark" className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30 dark:bg-gray-900/30">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <Icon name="chat" className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">No messages yet</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Start the conversation!</p>
          </div>
        ) : (
          <>
            {messages.map((m, index) => {
              const isMe = m.sender === me;
              const showAvatar = index === 0 || messages[index - 1].sender !== m.sender;
              
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  {!isMe && (
                    <div className="w-6 h-6 flex-shrink-0">
                      {showAvatar && (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
                          <span className="text-xs font-medium text-white">
                            {getUserInitials(m.sender)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%]`}>
                    <div
                      className={`
                        px-4 py-2 rounded-2xl text-sm relative
                        ${isMe
                          ? 'bg-blue-500 text-white rounded-br-md shadow-lg'
                          : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md shadow-md border border-gray-200/50 dark:border-gray-600/50'
                        }
                      `}
                    >
                      <div className="break-words leading-relaxed">{m.text}</div>
                    </div>
                    <div className={`text-xs text-gray-500 dark:text-gray-400 mt-1 px-1 ${isMe ? 'text-right' : 'text-left'}`}>
                      {formatTime(m.created_at)}
                    </div>
                  </div>
                </motion.div>
              );
            })}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2"
              >
                <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                    {getUserInitials(user)}
                  </span>
                </div>
                <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl px-4 py-2 flex items-center gap-1">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
        <div ref={endRef} />
      </div>

      {/* Emoji Picker */}
      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-gray-200/30 dark:border-gray-700/30"
          >
            <div className="p-2">
              <Picker 
                onEmojiClick={onEmojiClick}
                width="100%"
                height={300}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200/30 dark:border-gray-700/30 bg-white/80 dark:bg-gray-800/80">
        <div className="flex items-end gap-2">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`flex-shrink-0 p-2 rounded-full transition-all duration-200 ${
              showEmojiPicker 
                ? 'bg-blue-500 text-white' 
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" clipRule="evenodd" />
            </svg>
          </button>
          
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              value={text}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-200/50 dark:border-gray-600/50 rounded-2xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
              placeholder="Type a message..."
              maxLength={500}
            />
            {text.length > 400 && (
              <div className="absolute right-3 bottom-1 text-xs text-gray-400">
                {500 - text.length}
              </div>
            )}
          </div>

          <button
            onClick={createTask}
            disabled={!text.trim() || isLoading}
            className="flex-shrink-0 p-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            title="Create Task"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>

          <button
            onClick={send}
            disabled={!text.trim() || isLoading}
            className="flex-shrink-0 p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
            title="Send Message"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}