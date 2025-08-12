import React, { useState, useRef, useCallback } from 'react';
import { Send, Mic, Image as ImageIcon, Paperclip, Smile, X } from 'lucide-react';
import { VoiceRecorder } from './VoiceRecorder';
import { ImageUploader } from './ImageUploader';

interface AdvancedChatInputProps {
  onSendMessage: (text: string) => void;
  onVoiceMessage: (audioBlob: Blob) => void;
  onImageMessage: (imageFile: File) => void;
  onFileMessage: (file: File) => void;
  isLoading?: boolean;
  placeholder?: string;
  maxMessageLength?: number;
  isConnected?: boolean;
}

export const AdvancedChatInput: React.FC<AdvancedChatInputProps> = ({
  onSendMessage,
  onVoiceMessage,
  onImageMessage,
  onFileMessage,
  isLoading = false,
  placeholder = "메시지를 입력하세요...",
  maxMessageLength = 1000,
  isConnected = true
}) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showImageUploader, setShowImageUploader] = useState(false);
  const [showFileUploader, setShowFileUploader] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachments, setAttachments] = useState<Array<{ type: 'image' | 'file', file: File, id: string }>>([]);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSendMessage = useCallback(() => {
    if (!message.trim() && attachments.length === 0) return;
    
    // 텍스트 메시지 전송
    if (message.trim()) {
      onSendMessage(message.trim());
    }
    
    // 첨부파일들 전송
    attachments.forEach(attachment => {
      if (attachment.type === 'image') {
        onImageMessage(attachment.file);
      } else if (attachment.type === 'file') {
        onFileMessage(attachment.file);
      }
    });
    
    // 상태 초기화
    setMessage('');
    setAttachments([]);
    setShowImageUploader(false);
    setShowFileUploader(false);
    
    // 텍스트영역 포커스
    textareaRef.current?.focus();
  }, [message, attachments, onSendMessage, onImageMessage, onFileMessage]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleImageUpload = (file: File) => {
    const attachment = {
      type: 'image' as const,
      file,
      id: Date.now().toString()
    };
    setAttachments(prev => [...prev, attachment]);
    setShowImageUploader(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const attachment = {
          type: 'file' as const,
          file,
          id: Date.now().toString() + Math.random()
        };
        setAttachments(prev => [...prev, attachment]);
      });
    }
    // 파일 입력 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  const handleVoiceMessage = (audioBlob: Blob) => {
    onVoiceMessage(audioBlob);
  };

  const toggleImageUploader = () => {
    setShowImageUploader(!showImageUploader);
    setShowFileUploader(false);
    setShowEmojiPicker(false);
  };

  const toggleFileUploader = () => {
    setShowFileUploader(!showFileUploader);
    setShowImageUploader(false);
    setShowEmojiPicker(false);
  };

  const toggleEmojiPicker = () => {
    setShowEmojiPicker(!showEmojiPicker);
    setShowImageUploader(false);
    setShowFileUploader(false);
  };

  const addEmoji = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const emojis = ['😊', '😂', '❤️', '👍', '🎉', '🔥', '💯', '✨', '😎', '🤔', '👏', '🙏'];

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      {/* 첨부파일 미리보기 */}
      {attachments.length > 0 && (
        <div className="mb-3 p-3 bg-gray-50 rounded-lg">
          <div className="flex flex-wrap gap-2">
            {attachments.map(attachment => (
              <div key={attachment.id} className="relative">
                {attachment.type === 'image' ? (
                  <div className="relative">
                    <img
                      src={URL.createObjectURL(attachment.file)}
                      alt="첨부 이미지"
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removeAttachment(attachment.id)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="relative bg-blue-100 p-2 rounded-lg min-w-[120px]">
                    <div className="flex items-center space-x-2">
                      <Paperclip size={16} className="text-blue-500" />
                      <span className="text-sm text-blue-700 truncate max-w-[80px]">
                        {attachment.file.name}
                      </span>
                    </div>
                    <button
                      onClick={() => removeAttachment(attachment.id)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 이미지 업로더 */}
      {showImageUploader && (
        <div className="mb-3">
          <ImageUploader onImageUpload={handleImageUpload} />
        </div>
      )}

      {/* 파일 업로더 */}
      {showFileUploader && (
        <div className="mb-3 p-3 bg-gray-50 rounded-lg">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileUpload}
            className="w-full"
          />
        </div>
      )}

      {/* 이모지 피커 */}
      {showEmojiPicker && (
        <div className="mb-3 p-3 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-6 gap-2">
            {emojis.map((emoji, index) => (
              <button
                key={index}
                onClick={() => addEmoji(emoji)}
                className="text-2xl hover:bg-gray-200 rounded p-2 transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 메인 입력 영역 */}
      <div className="flex items-end space-x-2">
        {/* 도구 버튼들 */}
        <div className="flex space-x-1">
          <button
            onClick={toggleImageUploader}
            disabled={!isConnected}
            className={`p-2 rounded-lg transition-colors ${
              !isConnected ? 'bg-gray-200 text-gray-400 cursor-not-allowed' :
              showImageUploader ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'
            }`}
            title={isConnected ? "이미지 업로드" : "서버 연결 필요"}
          >
            <ImageIcon size={20} />
          </button>
          
          <button
            onClick={toggleFileUploader}
            disabled={!isConnected}
            className={`p-2 rounded-lg transition-colors ${
              !isConnected ? 'bg-gray-200 text-gray-400 cursor-not-allowed' :
              showFileUploader ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'
            }`}
            title={isConnected ? "파일 업로드" : "서버 연결 필요"}
          >
            <Paperclip size={20} />
          </button>
          
          <button
            onClick={toggleEmojiPicker}
            className={`p-2 rounded-lg transition-colors ${
              showEmojiPicker ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'
            }`}
            title="이모지"
          >
            <Smile size={20} />
          </button>
        </div>

        {/* 음성 녹음기 */}
        <VoiceRecorder
          onVoiceMessage={handleVoiceMessage}
          isRecording={isRecording}
          onRecordingChange={setIsRecording}
          disabled={!isConnected}
        />

        {/* 텍스트 입력 영역 */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            rows={1}
            maxLength={maxMessageLength}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            style={{
              minHeight: '48px',
              maxHeight: '120px'
            }}
          />
          
          {/* 글자 수 표시 */}
          <div className="absolute bottom-2 right-2 text-xs text-gray-400">
            {message.length}/{maxMessageLength}
          </div>
        </div>

        {/* 전송 버튼 */}
        <button
          onClick={handleSendMessage}
          disabled={isLoading || (!message.trim() && attachments.length === 0)}
          className={`p-3 rounded-lg transition-colors ${
            isLoading || (!message.trim() && attachments.length === 0)
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
          title="메시지 전송"
        >
          <Send size={20} />
        </button>
      </div>

      {/* 숨겨진 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
};
