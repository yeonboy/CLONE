// Note: Message 타입은 이 파일에서 직접 사용되지 않습니다.

// Vite 프록시를 통해 백엔드(127.0.0.1:3001)로 전달
const API_BASE = '/api';

export interface ChatResponse {
  reply: string;
  status: 'success' | 'error';
}

export interface VoiceToTextResponse {
  text: string;
  confidence: number;
}

export interface ImageAnalysisResponse {
  description: string;
  analysis: string;
}

export interface FileUploadResponse {
  status: string;
  filename: string;
  file_path: string;
  file_size?: number;
  content_type?: string;
  metadata?: any;
}

export class AdvancedChatService {
  // 기본 텍스트 채팅
  static async sendTextMessage(text: string, sessionId: string = 'default'): Promise<ChatResponse> {
    try {
      const response = await fetch(`${API_BASE}/chat-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, session_id: sessionId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { reply: data.reply, status: 'success' };
    } catch (error) {
      console.error('텍스트 메시지 전송 실패:', error);
      return { 
        reply: '죄송합니다. 메시지 전송에 실패했습니다.', 
        status: 'error' 
      };
    }
  }

  // 음성을 텍스트로 변환
  static async convertVoiceToText(audioBlob: Blob): Promise<VoiceToTextResponse | null> {
    try {
      // 오디오를 base64로 인코딩
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      const response = await fetch(`${API_BASE}/voice-to-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio_data: base64Audio }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('음성-텍스트 변환 실패:', error);
      return null;
    }
  }

  // 음성 파일 업로드
  static async uploadAudio(audioFile: File): Promise<FileUploadResponse | null> {
    try {
      const formData = new FormData();
      formData.append('audio_file', audioFile);

      const response = await fetch(`${API_BASE}/upload-audio`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('음성 파일 업로드 실패:', error);
      return null;
    }
  }

  // 이미지 분석
  static async analyzeImage(imageFile: File, prompt: string = "이 이미지에 대해 설명해주세요."): Promise<ImageAnalysisResponse | null> {
    try {
      // 이미지를 base64로 인코딩
      const arrayBuffer = await imageFile.arrayBuffer();
      const base64Image = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      const response = await fetch(`${API_BASE}/analyze-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          image_data: base64Image,
          prompt 
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('이미지 분석 실패:', error);
      return null;
    }
  }

  // 이미지 파일 업로드
  static async uploadImage(imageFile: File, description: string = ""): Promise<FileUploadResponse | null> {
    try {
      const formData = new FormData();
      formData.append('image_file', imageFile);
      formData.append('description', description);

      const response = await fetch(`${API_BASE}/upload-image`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('이미지 파일 업로드 실패:', error);
      return null;
    }
  }

  // 일반 파일 업로드
  static async uploadFile(file: File, description: string = ""): Promise<FileUploadResponse | null> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('description', description);

      const response = await fetch(`${API_BASE}/upload-file`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('파일 업로드 실패:', error);
      return null;
    }
  }

  // 파일 다운로드
  static async downloadFile(fileType: string, filename: string): Promise<Blob | null> {
    try {
      const response = await fetch(`${API_BASE}/download/${fileType}/${filename}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('파일 다운로드 실패:', error);
      return null;
    }
  }

  // 서버 상태 확인
  static async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/health`);
      return response.ok;
    } catch (error) {
      console.error('서버 상태 확인 실패:', error);
      return false;
    }
  }

  // AI 상태 확인
  static async checkAIStatus(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE}/ai-status`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('AI 상태 확인 실패:', error);
      return null;
    }
  }

  // 메모리 초기화
  static async initializeMemories(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/initialize-memories`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.status === 'memories_initialized';
    } catch (error) {
      console.error('메모리 초기화 실패:', error);
      return false;
    }
  }

  // 복합 메시지 전송 (텍스트 + 첨부파일)
  static async sendComplexMessage(
    text?: string,
    attachments?: Array<{ type: 'image' | 'file', file: File, id: string }>
  ): Promise<ChatResponse> {
    try {
      let finalText = text || '';
      
      // 첨부파일이 있는 경우 처리
      if (attachments && attachments.length > 0) {
        for (const attachment of attachments) {
          if (attachment.type === 'image') {
            const imageAnalysis = await this.analyzeImage(attachment.file);
            if (imageAnalysis) {
              finalText += `\n\n[이미지 첨부: ${imageAnalysis.description}]`;
            }
          } else if (attachment.type === 'file') {
            const fileUpload = await this.uploadFile(attachment.file);
            if (fileUpload) {
              finalText += `\n\n[파일 첨부: ${fileUpload.filename} (${fileUpload.file_size} bytes)]`;
            }
          }
        }
      }

      // 텍스트가 있는 경우에만 AI 응답 요청
      if (finalText.trim()) {
        return await this.sendTextMessage(finalText);
      } else {
        return { 
          reply: '첨부파일이 성공적으로 업로드되었습니다.', 
          status: 'success' 
        };
      }
    } catch (error) {
      console.error('복합 메시지 전송 실패:', error);
      return { 
        reply: '죄송합니다. 메시지 전송에 실패했습니다.', 
        status: 'error' 
      };
    }
  }
}
