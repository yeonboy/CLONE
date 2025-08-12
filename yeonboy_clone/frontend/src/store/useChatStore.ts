import { create } from 'zustand';
import { Message, Chat } from '../types';

interface ChatState {
  currentChat: Chat | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setCurrentChat: (chat: Chat | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessageStatus: (messageId: string, status: Message['status']) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearChat: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  currentChat: null,
  messages: [],
  isLoading: false,
  error: null,
  
  setCurrentChat: (chat) => set({ currentChat: chat, messages: chat?.messages || [] }),
  setMessages: (messages) => set({ messages, isLoading: false, error: null }),
  addMessage: (message) => set((state) => ({ 
    messages: [...state.messages, message],
    error: null 
  })),
  updateMessageStatus: (messageId, status) => set((state) => ({
    messages: state.messages.map(msg => 
      msg.id === messageId ? { ...msg, status } : msg
    )
  })),
  setLoading: (isLoading) => set({ isLoading, error: null }),
  setError: (error) => set({ error, isLoading: false }),
  clearChat: () => set({ messages: [], error: null, currentChat: null }),
}));
