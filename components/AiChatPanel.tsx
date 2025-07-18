import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { Bot, Send, Sparkles, X, User, Loader } from 'lucide-react';
import debounce from 'lodash/debounce';
import '../styles/AiChatPanel.css'; // If in src/styles/

interface AiChatPanelProps {
  open: boolean;
  onClose: () => void;
  initialText?: string;
}

interface Message {
  role: 'user' | 'assistant';
  text: string;
  type?: 'sql' | 'conversation' | 'error';
  sqlQuery?: string;
  data?: any;
}

const suggestions = [
  'Show all orders',
  'Find customer by name "John"',
  'How many drivers are there?',
  'Hello!',
];

const AiChatPanel = memo(({ open, onClose, initialText }: AiChatPanelProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Optimized scroll behavior
  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, loading]); // Depend on messages length and loading to scroll to bottom

  // Focus on textarea when panel opens and apply initial text
  useEffect(() => {
    if (open) {
      setText(initialText || '');
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  }, [open, initialText]);

  // Memoized and debounced send function
  const sendMessage = useCallback(
    debounce(async (userQuery: string) => {
      if (!userQuery.trim()) return;

      setMessages((prev) => [...prev, { role: 'user', text: userQuery }]);
      setText(''); // Clear input immediately
      setLoading(true);

      try {
        const res = await fetch('/api/ai-query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userQuery }),
        });

        const data = await res.json();

        if (res.ok) {
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              type: data.type,
              text:
                data.type === 'sql'
                  ? data.data?.length
                    ? JSON.stringify(data.data, null, 2)
                    : 'No results found for this SQL query.'
                  : data.responseText || data.error || 'An unknown error occurred.',
              ...(data.type === 'sql' && { sqlQuery: data.sqlQuery, data: data.data }),
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', type: 'error', text: data.error || 'Failed to contact the AI service.' },
          ]);
        }
      } catch (err) {
        console.error("Error sending message:", err);
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', type: 'error', text: 'An unexpected error occurred. Please try again.' },
        ]);
      } finally {
        setLoading(false);
      }
    }, 300),
    [] // Empty dependency array means this function is created once
  );

  const handleSendMessage = () => {
    sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Memoized message rendering
  const renderMessageContent = useCallback(
    (message: Message) => {
      if (message.type === 'sql') {
        return (
          <div className="message-sql">
            {message.sqlQuery && (
              <>
                <p className="message-sql-label">Generated SQL Query:</p>
                <pre className="message-sql-query">
                  <code>{message.sqlQuery}</code>
                </pre>
              </>
            )}
            <p className="message-sql-label">Result:</p>
            <pre className="message-sql-result">
              <code>{message.text}</code>
            </pre>
          </div>
        );
      }
      return <div className="message-text">{message.text}</div>;
    },
    []
  );

  if (!open) return null;

  return (
    <div className="chat-panel-container">
      <div className="chat-panel">
        {/* Header */}
        <div className="chat-header">
          <div className="chat-header-title">
            <h2>Proovia AI</h2>
            <p>Your AI Assistant</p>
          </div>
          <button onClick={onClose} className="chat-close-button" aria-label="Close chat">
            <X size={20} />
          </button>
        </div>

        {/* Messages area */}
        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="chat-welcome">
              <div className="chat-welcome-icon">
                <Sparkles size={32} />
              </div>
              <h3>Welcome to Proovia AI</h3>
              <p>Ask me about orders and customers, or just have a chat.</p>
              <div className="chat-suggestions">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    className="chat-suggestion-button"
                    onClick={() => setText(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message, idx) => (
              <div key={idx} className={`chat-message ${message.role}`}>
                <div className="chat-message-content">
                  <div className={`chat-message-icon ${message.role}`}>
                    {message.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div className={`chat-message-text ${message.type}`}>
                    {renderMessageContent(message)}
                  </div>
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="chat-message assistant">
              <div className="chat-message-content">
                <div className="chat-message-icon assistant">
                  <Bot size={16} />
                </div>
                <div className="chat-message-text">
                  <div className="chat-loading">
                    <div className="chat-loading-dots">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="chat-loading-dot" style={{ animationDelay: `${i * 0.2}s` }} />
                      ))}
                    </div>
                    <span>Thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input area */}
        <div className="chat-input-area"> {/* Changed class name for clarity */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            className="chat-textarea"
            placeholder="Ask me anything..."
            disabled={loading} // Disable textarea when loading
          />
          <button
            onClick={handleSendMessage}
            disabled={!text.trim() || loading}
            className="chat-send-button"
            aria-label="Send message"
          >
            {loading ? <Loader size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
         
        </div>
      </div>
    </div>
  );
});

export default AiChatPanel;