import { createContext, useContext, useState, ReactNode } from 'react';
import ChatPanel from '../components/ChatPanel';

interface ChatState {
  open: boolean;
  user: string;
}

interface ChatContextValue extends ChatState {
  openChat: (user: string) => void;
  closeChat: () => void;
}

const ChatContext = createContext<ChatContextValue>({
  open: false,
  user: '',
  openChat: () => {},
  closeChat: () => {},
});

export function ChatProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ChatState>({ open: false, user: '' });

  const openChat = (user: string) => setState({ open: true, user });
  const closeChat = () => setState(s => ({ ...s, open: false }));

  return (
    <ChatContext.Provider value={{ ...state, openChat, closeChat }}>
      {children}
      <ChatPanel open={state.open} user={state.user} onClose={closeChat} />
    </ChatContext.Provider>
  );
}

export const useChat = () => useContext(ChatContext);
