import { useState, useCallback } from 'react';

export function useChatStore() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const addMessage = useCallback((message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const setLoading = useCallback((loading) => {
    setIsLoading(loading);
  }, []);

  const setError = useCallback((error) => {
    setError(error);
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    addMessage,
    setLoading,
    setError,
    clearChat
  };
}
