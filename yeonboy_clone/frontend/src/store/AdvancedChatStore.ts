import { create } from 'zustand';
import { AdvancedChatService, ChatResponse, VoiceToTextResponse } from '../services/AdvancedChatService';

export interface Message {
  id: string;
  text?: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  status: 'sending' | 'sent' | 'error';
  type?: 'text' | 'image' | 'voice' | 'file';
  imageUrl?: string;
  audioUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  duration?: number;
  metadata?: any;
}

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  isRecording: boolean;
  isConnected: boolean;
  aiStatus: any;
}

interface ChatActions {
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  removeMessage: (id: string) => void;
  clearChat: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setRecording: (recording: boolean) => void;
  setConnected: (connected: boolean) => void;
  setAIStatus: (status: any) => void;
  
  // 메시지 전송
  sendTextMessage: (text: string) => Promise<void>;
  sendVoiceMessage: (audioBlob: Blob) => Promise<void>;
  sendImageMessage: (imageFile: File, description?: string) => Promise<void>;
  sendFileMessage: (file: File, description?: string) => Promise<void>;
  sendComplexMessage: (text?: string, attachments?: Array<{ type: 'image' | 'file', file: File, id: string }>) => Promise<void>;
  
  // 서비스 상태 확인
  checkConnection: () => Promise<void>;
  checkAIStatus: () => Promise<void>;
  initializeMemories: () => Promise<void>;
  
  // 메시지 재시도
  retryMessage: (messageId: string) => Promise<void>;
}

export const useAdvancedChatStore = create<ChatState & ChatActions>((set, get) => ({
  // 초기 상태
  messages: [],
  isLoading: false,
  error: null,
  isRecording: false,
  isConnected: false,
  aiStatus: null,

  // 기본 액션
  addMessage: (message) => set((state) => ({ 
    messages: [...state.messages, message] 
  })),

  updateMessage: (id, updates) => set((state) => ({
    messages: state.messages.map(msg => 
      msg.id === id ? { ...msg, ...updates } : msg
    )
  })),

  removeMessage: (id) => set((state) => ({
    messages: state.messages.filter(msg => msg.id !== id)
  })),

  clearChat: () => set({ messages: [] }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setRecording: (recording) => set({ isRecording: recording }),
  setConnected: (connected) => set({ isConnected: connected }),
  setAIStatus: (status) => set({ aiStatus: status }),

  // 텍스트 메시지 전송
  sendTextMessage: async (text) => {
    const { addMessage, updateMessage, setLoading, setError } = get();
    
    if (!text.trim()) return;

    // 사용자 메시지 추가
    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date(),
      status: 'sending',
      type: 'text'
    };
    
    addMessage(userMessage);
    setLoading(true);
    setError(null);

    try {
      const response = await AdvancedChatService.sendTextMessage(text);
      
      if (response.status === 'success') {
        // 사용자 메시지 상태 업데이트
        updateMessage(userMessage.id, { status: 'sent' });
        
        // AI 응답 메시지 추가
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: response.reply,
          sender: 'ai',
          timestamp: new Date(),
          status: 'sent',
          type: 'text'
        };
        
        addMessage(aiMessage);
      } else {
        throw new Error(response.reply);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      setError(errorMessage);
      
      // 오류 메시지 추가
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: '죄송합니다. 응답을 생성하는 중 오류가 발생했습니다.',
        sender: 'ai',
        timestamp: new Date(),
        status: 'error',
        type: 'text'
      };
      
      addMessage(errorMsg);
      updateMessage(userMessage.id, { status: 'error' });
    } finally {
      setLoading(false);
    }
  },

  // 음성 메시지 전송
  sendVoiceMessage: async (audioBlob) => {
    const { addMessage, updateMessage, setLoading, setError } = get();
    
    setLoading(true);
    setError(null);

    try {
      // 음성을 텍스트로 변환
      const voiceResponse = await AdvancedChatService.convertVoiceToText(audioBlob);
      
      if (voiceResponse) {
        // 음성 메시지 추가
        const voiceMessage: Message = {
          id: Date.now().toString(),
          text: voiceResponse.text,
          sender: 'user',
          timestamp: new Date(),
          status: 'sent',
          type: 'voice',
          audioUrl: URL.createObjectURL(audioBlob),
          duration: Math.ceil(audioBlob.size / 16000) // 대략적인 길이 계산
        };
        
        addMessage(voiceMessage);
        
        // AI 응답 요청
        const response = await AdvancedChatService.sendTextMessage(voiceResponse.text);
        
        if (response.status === 'success') {
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: response.reply,
            sender: 'ai',
            timestamp: new Date(),
            status: 'sent',
            type: 'text'
          };
          
          addMessage(aiMessage);
        } else {
          throw new Error(response.reply);
        }
      } else {
        throw new Error('음성을 텍스트로 변환할 수 없습니다.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      setError(errorMessage);
      
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: '음성 메시지 처리 중 오류가 발생했습니다.',
        sender: 'ai',
        timestamp: new Date(),
        status: 'error',
        type: 'text'
      };
      
      addMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  },

  // 이미지 메시지 전송
  sendImageMessage: async (imageFile, description = "") => {
    const { addMessage, updateMessage, setLoading, setError } = get();
    
    setLoading(true);
    setError(null);

    try {
      // 이미지 메시지 추가
      const imageMessage: Message = {
        id: Date.now().toString(),
        text: description,
        sender: 'user',
        timestamp: new Date(),
        status: 'sending',
        type: 'image',
        imageUrl: URL.createObjectURL(imageFile),
        fileName: imageFile.name,
        fileSize: imageFile.size,
        fileType: imageFile.type
      };
      
      addMessage(imageMessage);
      
      // 이미지 분석 및 AI 응답
      const response = await AdvancedChatService.analyzeImage(imageFile, description);
      
      if (response) {
        updateMessage(imageMessage.id, { status: 'sent' });
        
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: response.analysis,
          sender: 'ai',
          timestamp: new Date(),
          status: 'sent',
          type: 'text'
        };
        
        addMessage(aiMessage);
      } else {
        throw new Error('이미지 분석에 실패했습니다.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      setError(errorMessage);
      
      updateMessage(imageMessage.id, { status: 'error' });
      
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: '이미지 처리 중 오류가 발생했습니다.',
        sender: 'ai',
        timestamp: new Date(),
        status: 'error',
        type: 'text'
      };
      
      addMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  },

  // 파일 메시지 전송
  sendFileMessage: async (file, description = "") => {
    const { addMessage, updateMessage, setLoading, setError } = get();
    
    setLoading(true);
    setError(null);

    try {
      // 파일 메시지 추가
      const fileMessage: Message = {
        id: Date.now().toString(),
        text: description,
        sender: 'user',
        timestamp: new Date(),
        status: 'sending',
        type: 'file',
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      };
      
      addMessage(fileMessage);
      
      // 파일 업로드
      const response = await AdvancedChatService.uploadFile(file, description);
      
      if (response) {
        updateMessage(fileMessage.id, { 
          status: 'sent',
          metadata: response
        });
        
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: `파일 "${file.name}"이 성공적으로 업로드되었습니다.`,
          sender: 'ai',
          timestamp: new Date(),
          status: 'sent',
          type: 'text'
        };
        
        addMessage(aiMessage);
      } else {
        throw new Error('파일 업로드에 실패했습니다.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      setError(errorMessage);
      
      updateMessage(fileMessage.id, { status: 'error' });
      
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: '파일 처리 중 오류가 발생했습니다.',
        sender: 'ai',
        timestamp: new Date(),
        status: 'error',
        type: 'text'
      };
      
      addMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  },

  // 복합 메시지 전송
  sendComplexMessage: async (text, attachments) => {
    const { addMessage, updateMessage, setLoading, setError } = get();
    
    setLoading(true);
    setError(null);

    try {
      // 첨부파일 메시지들 추가
      if (attachments) {
        for (const attachment of attachments) {
          if (attachment.type === 'image') {
            const imageMessage: Message = {
              id: Date.now().toString() + Math.random(),
              sender: 'user',
              timestamp: new Date(),
              status: 'sending',
              type: 'image',
              imageUrl: URL.createObjectURL(attachment.file),
              fileName: attachment.file.name,
              fileSize: attachment.file.size,
              fileType: attachment.file.type
            };
            addMessage(imageMessage);
          } else if (attachment.type === 'file') {
            const fileMessage: Message = {
              id: Date.now().toString() + Math.random(),
              sender: 'user',
              timestamp: new Date(),
              status: 'sending',
              type: 'file',
              fileName: attachment.file.name,
              fileSize: attachment.file.size,
              fileType: attachment.file.type
            };
            addMessage(fileMessage);
          }
        }
      }

      // 복합 메시지 전송
      const response = await AdvancedChatService.sendComplexMessage(text, attachments);
      
      if (response.status === 'success') {
        // 첨부파일 메시지들 상태 업데이트
        if (attachments) {
          attachments.forEach(attachment => {
            // 해당하는 메시지 찾아서 상태 업데이트
            const message = get().messages.find(msg => 
              msg.fileName === attachment.file.name && msg.status === 'sending'
            );
            if (message) {
              updateMessage(message.id, { status: 'sent' });
            }
          });
        }
        
        // AI 응답 메시지 추가
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: response.reply,
          sender: 'ai',
          timestamp: new Date(),
          status: 'sent',
          type: 'text'
        };
        
        addMessage(aiMessage);
      } else {
        throw new Error(response.reply);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      setError(errorMessage);
      
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: '메시지 전송 중 오류가 발생했습니다.',
        sender: 'ai',
        timestamp: new Date(),
        status: 'error',
        type: 'text'
      };
      
      addMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  },

  // 연결 상태 확인
  checkConnection: async () => {
    const { setConnected } = get();
    const isConnected = await AdvancedChatService.checkHealth();
    setConnected(isConnected);
  },

  // AI 상태 확인
  checkAIStatus: async () => {
    const { setAIStatus } = get();
    const status = await AdvancedChatService.checkAIStatus();
    setAIStatus(status);
  },

  // 메모리 초기화
  initializeMemories: async () => {
    const { setLoading, setError } = get();
    setLoading(true);
    setError(null);

    try {
      const success = await AdvancedChatService.initializeMemories();
      if (!success) {
        throw new Error('메모리 초기화에 실패했습니다.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  },

  // 메시지 재시도
  retryMessage: async (messageId) => {
    const { messages, sendTextMessage, removeMessage } = get();
    const message = messages.find(msg => msg.id === messageId);
    
    if (message && message.text) {
      removeMessage(messageId);
      await sendTextMessage(message.text);
    }
  }
}));
