import { useState, useEffect } from 'react';
import Voice from '@react-native-voice/voice';
import { uploadMedia } from '../services/MediaUploadService';
import { sendMessage } from '../services/ChatService';
import { useChatStore, Message } from '../store/useChatStore';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

export const useVoiceRecorder = (conversationId: string, userId: string) => {
  const [isRecording, setIsRecording] = useState(false);
  const addMessage = useChatStore(state => state.addMessage);

  const onSpeechResults = async (e: any) => {
    // react-native-voice는 녹음 파일이 아닌 텍스트 결과를 반환합니다.
    // 실제 녹음 파일 업로드를 위해서는 react-native-audio-recorder-player 같은 라이브러리가 필요합니다.
    // 여기서는 STT 결과를 직접 전송하는 로직으로 간소화합니다.
    const text = e.value?.[0] || '';
    if (text) {
      const messageId = uuidv4(); // Generate a unique ID for the message
      const message: Message = {
        messageId,
        senderId: userId,
        type: 'text' as const, // 음성 입력이지만 텍스트로 처리
        status: 'sent' as const,
        content: { text, mediaUrl: null, duration: null },
        timestamp: new Date(), // Add the current timestamp
      };
      addMessage(message);
      await sendMessage(conversationId, message);
    }
  };

  useEffect(() => {
    Voice.onSpeechResults = onSpeechResults;
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const startRecording = async () => {
    setIsRecording(true);
    await Voice.start('ko-KR');
  };

  const stopRecording = async () => {
    setIsRecording(false);
    await Voice.stop();
  };

  return { isRecording, startRecording, stopRecording };
};