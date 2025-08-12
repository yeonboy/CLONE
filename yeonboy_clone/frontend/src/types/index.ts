export interface Message {
  messageId: string;
  senderId: 'me' | 'hwang_yeon_geol' | 'system';
  timestamp: Date;
  type: 'text' | 'image' | 'voice' | 'file';
  content: {
    text: string | null;
    mediaUrl: string | null;
    duration: number | null;
    fileName?: string;
    fileSize?: number;
  };
  status: 'sent' | 'processing' | 'read' | 'failed';
}

export type AvatarStatus = 'idle' | 'listening' | 'thinking';

export interface Chat {
  id: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  title?: string;
}

export interface User {
  id: string;
  name: string;
  avatar?: string;
}

export interface AIResponse {
  reply: string;
  confidence?: number;
  memories?: string[];
}
