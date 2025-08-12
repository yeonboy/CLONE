import React, { useState, useEffect, useRef } from 'react';
import { Message } from '../types';
import { mockMessages } from '../data/mockData';
import FloatingDataBackground from '../components/FloatingDataBackground';
import MessageBubble from '../components/MessageBubble';
import ChatInput from '../components/ChatInput';
import FaceAvatar from '../components/FaceAvatar';
import { styles } from '../styles/chatStyles';
import { AdvancedChatService } from '../services/AdvancedChatService';

const ChatScreen: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [isThinking, setIsThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const listRef = useRef<HTMLDivElement>(null);

  // 연결 상태 주기적 확인
  useEffect(() => {
    const check = async () => {
      const ok = await AdvancedChatService.checkHealth();
      if (ok) {
        const ai = await AdvancedChatService.checkAIStatus();
        setIsConnected(!!ai && ai.status === 'ok');
      } else {
        setIsConnected(false);
      }
    };
    check();
    const t = setInterval(check, 10000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    const now = new Date();
    const userMessage: Message = {
      messageId: now.toISOString(),
      senderId: 'me',
      timestamp: now,
      type: 'text',
      content: { text, mediaUrl: null, duration: null },
      status: 'sent',
    };
    setMessages(prev => [userMessage, ...prev]);

    setIsThinking(true);
    setIsListening(false);

    try {
      if (isConnected) {
        const result = await AdvancedChatService.sendTextMessage(text, 'default');
        const replyText = result.status === 'success' ? result.reply : '죄송, 지금은 답하기 어려워.';
        const aiMsg: Message = {
          messageId: new Date().toISOString() + '_ai',
          senderId: 'hwang_yeon_geol',
          timestamp: new Date(),
          type: 'text',
          content: { text: replyText, mediaUrl: null, duration: null },
          status: 'read',
        };
        setMessages(prev => [aiMsg, ...prev]);
      } else {
        const aiMsg: Message = {
          messageId: new Date().toISOString() + '_ai',
          senderId: 'hwang_yeon_geol',
          timestamp: new Date(),
          type: 'text',
          content: { text: '서버 연결이 없어. 백엔드를 먼저 켜줘!', mediaUrl: null, duration: null },
          status: 'read',
        };
        setMessages(prev => [aiMsg, ...prev]);
      }
    } catch (e) {
      const errMsg: Message = {
        messageId: new Date().toISOString() + '_err',
        senderId: 'system',
        timestamp: new Date(),
        type: 'text',
        content: { text: '메시지 처리 중 오류가 발생했어.', mediaUrl: null, duration: null },
        status: 'failed',
      };
      setMessages(prev => [errMsg, ...prev]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleListenStart = () => {
    setIsListening(true);
    setIsThinking(false);
    setTimeout(() => setIsListening(false), 1500);
  };

  const avatarStatus: 'idle' | 'listening' | 'thinking' = isListening ? 'listening' : isThinking ? 'thinking' : 'idle';

  return (
    <div style={styles.container}>
      <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap" rel="stylesheet" />
      <FloatingDataBackground />

      {/* 헤더: 푸른색 애니메이션 아바타 유지 */}
      <div style={{ position: 'relative', zIndex: 2, padding: '12px 16px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
          <FaceAvatar status={avatarStatus} />
        </div>
        <h1 style={{
          margin: 0,
          fontSize: 'clamp(20px, 4vw, 26px)',
          fontWeight: 700,
          background: 'linear-gradient(45deg, #00D1FF, #FF6B6B)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          황연걸 AI 채팅
        </h1>
        <div style={{ marginTop: 6, fontSize: 12, color: isConnected ? '#00ff8a' : '#ff6b6b' }}>
          {isConnected ? '백엔드 연결됨' : '백엔드 연결 안됨'} · {isListening ? '녹음 중' : isThinking ? '생각 중' : '대기'}
        </div>
      </div>

      {/* 채팅 UI */}
      <div style={styles.chatUIContainer}>
        <div style={styles.messageList} ref={listRef}>
          {isThinking && (
            <div style={{ alignSelf: 'flex-start', opacity: 0.8, fontStyle: 'italic', margin: '8px 0 0 10px' }}>생각 중...</div>
          )}
          {messages.map((msg) => (
            <MessageBubble key={msg.messageId} message={msg} />
          ))}
        </div>
        <div style={{ paddingLeft: 8, paddingRight: 8 }}>
          <ChatInput onSend={handleSend} onListenStart={handleListenStart} />
        </div>
      </div>
    </div>
  );
};

export default ChatScreen;