import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, X, User, Loader } from 'lucide-react';

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
  const [isTyping, setIsTyping] = useState(false);
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
    setIsTyping(true);

    setTimeout(() => setIsTyping(false), 1800);

    // Simulate AI response
    setTimeout(() => {
      setMessages((msgs) => [
        ...msgs,
        {
          role: 'assistant',
          text: `I understand you're asking about "${query}". Here's my intelligent analysis and response based on the latest data patterns and insights.`,
        },
      ]);
      setLoading(false);
    }, 2000);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30"
      style={{
        backdropFilter: 'blur(10px) saturate(120%)', // Blur only on background overlay
      }}
    >
      {/* Main chat container */}
      <div
        className="relative w-full max-w-2xl h-[85vh] max-h-[800px] flex flex-col space-y-4 p-4 rounded-2xl bg-gradient-to-br from-[rgba(255,100,100,0.2)] via-[rgba(150,100,255,0.15)] to-[rgba(100,200,255,0.2)] border border-white/30 shadow-xl overflow-hidden"
        style={{
          boxShadow: `
            0 0 30px -5px rgba(100, 200, 255, 0.4),
            0 0 60px -10px rgba(255, 100, 100, 0.2),
            inset 0 1px 2px rgba(255, 255, 255, 0.3)
          `,
          animation: 'pulseGlow 4s infinite alternate',
        }}
      >
        {/* Header */}
        <div className="relative px-6 py-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div>
                <h2 className="text-xl font-semibold text-white">Proovia AI</h2>
                <p className="text-white/60 text-sm">Your AI Assistant</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center text-white/80 hover:text-white transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            /* Welcome state */
            <div className="text-center py-16">
              <div
                className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.1) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)',
                }}
              >
                <Sparkles className="w-8 h-8 text-white/80" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-3">Welcome to Proovia AI</h3>
              <p className="text-white/60 max-w-md mx-auto text-base">
                I'm here to help with creative solutions, data analysis, and smart insights.
              </p>
              {/* Suggestion pills */}
              <div className="flex flex-wrap justify-center gap-2 mt-6">
                {['✨ Creative ideas', '📊 Data analysis', '🎯 Problem solving', '💡 Smart insights'].map(
                  (suggestion, idx) => (
                    <div
                      key={idx}
                      className="px-4 py-2 rounded-full text-white/80 text-sm cursor-pointer hover:scale-105 transition-all duration-300"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%)',
                        border: '1px solid rgba(255, 255, 255, 0.25)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                      }}
                      onClick={() => setText(suggestion.split(' ').slice(1).join(' '))}
                    >
                      {suggestion}
                    </div>
                  )
                )}
              </div>
            </div>
          ) : (
            /* Messages */
            messages.map((message, idx) => (
              <div key={idx} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`flex items-end space-x-2 max-w-[75%] ${
                    message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center"
                    style={{
                      background:
                        message.role === 'user'
                          ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.1) 100%)'
                          : 'linear-gradient(135deg, rgba(100, 200, 255, 0.8) 0%, rgba(150, 100, 255, 0.8) 100%)',
                      border: '1px solid rgba(255, 255, 255, 0.25)',
                    }}
                  >
                    {message.role === 'user' ? (
                      <User className="w-4 h-4 text-white/80" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>
                  {/* Message bubble */}
                  <div
                    className={`px-4 py-3 text-white text-sm ${
                      message.role === 'user' ? 'rounded -full rounded-br-sm' : 'rounded -full rounded-bl-sm'
                    }`}
                    style={{
                      background:
                        message.role === 'user'
                          ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(147, 51, 234, 0.9) 100%)'
                          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%)',
                      border: '1px solid rgba(255, 255, 255, 0.25)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    }}
                  >
                    {message.text}
                  </div>
                </div>
              </div>
            ))
          )}
          {/* Typing indicator */}
          {(loading || isTyping) && (
            <div className="flex justify-start">
              <div className="flex items-end space-x-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(100, 200, 255, 0.8) 0%, rgba(150, 100, 255, 0.8) 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                  }}
                >
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div
                  className="px-4 py-3 rounded -full rounded-bl-sm"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 0.2}s` }}
                        />
                      ))}
                    </div>
                    <span className="text-white/60 text-xs">
                      {isTyping ? 'Thinking...' : 'Processing...'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input area */}
        <div className="relative p-6 pt-2">
          <div className="flex items-end space-x-3">
            <div className="flex-1">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={1}
                placeholder="Ask Intelligence anything..."
                className="w-full px-4 py-3 text-white placeholder-white/50 text-sm resize-none focus:outline-none rounded-full transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  minHeight: '48px',
                }}
              />
            </div>
            <button
              onClick={send}
              disabled={!text.trim() || loading}
              className="w-12 h-12 rounded-full flex items-center justify-center text-white transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: loading
                  ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%)'
                  : 'linear-gradient(135deg, rgba(100, 200, 255, 0.9) 0%, rgba(150, 100, 255, 0.9) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              }}
            >
              {loading ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="text-white/40 text-xs text-center mt-3">
            Intelligence may make mistakes. Consider checking important information.
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulseGlow {
          0% {
            box-shadow:
              0 0 30px -5px rgba(100, 200, 255, 0.4),
              0 0 60px -10px rgba(255, 100, 100, 0.2),
              inset 0 1px 2px rgba(255, 255, 255, 0.3);
          }
          100% {
            box-shadow:
              0 0 40px -5px rgba(100, 200, 255, 0.6),
              0 0 80px -10px rgba(255, 100, 100, 0.3),
              inset 0 1px 3px rgba(255, 255, 255, 0.4);
          }
        }
      `}</style>
    </div>
  );
}