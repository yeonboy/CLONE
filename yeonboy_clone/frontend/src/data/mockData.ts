import { Message } from '../types';

export const mockMessages: Message[] = [
  {
    messageId: '6',
    senderId: 'hwang_yeon_geol',
    timestamp: new Date(new Date().getTime() - 90000),
    type: 'voice',
    content: {
      text: null,
      mediaUrl: 'dummy_voice_url.mp3',
      duration: 8,
    },
    status: 'read',
  },
  {
    messageId: '5',
    senderId: 'me',
    timestamp: new Date(new Date().getTime() - 120000),
    type: 'text',
    content: {
      text: '이건 어때?',
      mediaUrl: null,
      duration: null,
    },
    status: 'read',
  },
  {
    messageId: '4',
    senderId: 'hwang_yeon_geol',
    timestamp: new Date(new Date().getTime() - 180000),
    type: 'text',
    content: {
      text: '어쩌라고. 전혀 아니고~',
      mediaUrl: null,
      duration: null,
    },
    status: 'read',
  },
  {
    messageId: '3',
    senderId: 'me',
    timestamp: new Date(new Date().getTime() - 240000),
    type: 'image',
    content: {
      text: '이거 봐봐',
      mediaUrl: 'https://placehold.co/600x800/e2e8f0/475569?text=Sample+Image',
      duration: null,
    },
    status: 'read',
  },
  {
    messageId: '2',
    senderId: 'hwang_yeon_geol',
    timestamp: new Date(new Date().getTime() - 300000),
    type: 'text',
    content: {
      text: '이걸 나한테 보내는 의도가 뭐냐. 특이해버리네 ㅋㅋ',
      mediaUrl: null,
      duration: null,
    },
    status: 'read',
  },
  {
    messageId: '1',
    senderId: 'me',
    timestamp: new Date(new Date().getTime() - 360000),
    type: 'text',
    content: {
      text: '안녕 연걸아',
      mediaUrl: null,
      duration: null,
    },
    status: 'read',
  },
];
