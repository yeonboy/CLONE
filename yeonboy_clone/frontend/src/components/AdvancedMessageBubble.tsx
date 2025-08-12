import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Download, 
  Eye, 
  EyeOff, 
  Copy, 
  Check,
  FileText,
  Image as ImageIcon,
  Mic,
  Paperclip,
  X
} from 'lucide-react';
import { Message } from '../types';

interface AdvancedMessageBubbleProps {
  message: Message;
  onRetry?: (messageId: string) => void;
}

export const AdvancedMessageBubble: React.FC<AdvancedMessageBubbleProps> = ({
  message,
  onRetry
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showImage, setShowImage] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number>();

  const isUser = message.senderId === 'me';
  const isError = message.status === 'failed';
  const isSystem = message.senderId === 'system';

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleAudioPlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const updateAudioProgress = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      animationFrameRef.current = requestAnimationFrame(updateAudioProgress);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleAudioTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('클립보드 복사 실패:', error);
    }
  };

  const downloadFile = (url: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderMessageContent = () => {
    switch (message.type) {
      case 'text':
        return (
          <div className="message-text">
            {message.content.text}
            <button
              onClick={() => copyToClipboard(message.content.text || '')}
              className="copy-button"
              title="텍스트 복사"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
        );

      case 'image':
        return (
          <div className="message-image">
            {message.content.mediaUrl && (
              <>
                <img 
                  src={message.content.mediaUrl} 
                  alt={message.content.text || '이미지'}
                  onClick={() => setShowImage(!showImage)}
                  className="clickable-image"
                />
                {showImage && (
                  <div className="image-modal" onClick={() => setShowImage(false)}>
                    <img 
                      src={message.content.mediaUrl} 
                      alt={message.content.text || '이미지'}
                      className="modal-image"
                    />
                    <button className="close-modal">
                      <X size={24} />
                    </button>
                  </div>
                )}
                {message.content.text && (
                  <div className="image-description">{message.content.text}</div>
                )}
              </>
            )}
          </div>
        );

      case 'voice':
        return (
          <div className="message-voice">
            <div className="voice-controls">
              <button onClick={handleAudioPlay} className="play-button">
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>
              <div className="voice-info">
                <div className="voice-duration">
                  {message.content.duration ? formatTime(message.content.duration) : '00:00'}
                </div>
                <div className="voice-text">{message.content.text || '음성 메시지'}</div>
              </div>
            </div>
            {message.content.mediaUrl && (
              <audio
                ref={audioRef}
                src={message.content.mediaUrl}
                onEnded={handleAudioEnded}
                onTimeUpdate={handleAudioTimeUpdate}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
            )}
          </div>
        );

      case 'file':
        return (
          <div className="message-file">
            <div className="file-info">
              <div className="file-icon">
                <Paperclip size={24} />
              </div>
              <div className="file-details">
                <div className="file-name">{message.content.fileName || '파일'}</div>
                {message.content.fileSize && (
                  <div className="file-size">{formatFileSize(message.content.fileSize)}</div>
                )}
                {message.content.text && (
                  <div className="file-description">{message.content.text}</div>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="message-text">
            {message.content.text}
          </div>
        );
    }
  };

  const getMessageStyle = () => {
    if (isSystem) {
      return {
        backgroundColor: '#f0f0f0',
        color: '#666',
        border: '1px solid #ddd',
        fontStyle: 'italic'
      };
    }
    
    if (isError) {
      return {
        backgroundColor: '#ffebee',
        color: '#c62828',
        border: '1px solid #ffcdd2'
      };
    }

    return isUser ? {
      backgroundColor: '#e3f2fd',
      color: '#1565c0',
      marginLeft: 'auto',
      marginRight: '10px'
    } : {
      backgroundColor: '#f5f5f5',
      color: '#424242',
      marginRight: 'auto',
      marginLeft: '10px'
    };
  };

  const getSenderName = () => {
    switch (message.senderId) {
      case 'me':
        return '나';
      case 'hwang_yeon_geol':
        return '황연걸';
      case 'system':
        return '시스템';
      default:
        return '알 수 없음';
    }
  };

  return (
    <div className="message-bubble" style={getMessageStyle()}>
      <div className="message-header">
        <span className="sender-name">{getSenderName()}</span>
        <span className="timestamp">
          {message.timestamp.toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </span>
      </div>
      
      <div className="message-content">
        {renderMessageContent()}
      </div>

      {isError && onRetry && (
        <div className="message-actions">
          <button 
            onClick={() => onRetry(message.messageId)}
            className="retry-button"
          >
            재시도
          </button>
        </div>
      )}

      <style jsx>{`
        .message-bubble {
          max-width: 70%;
          padding: 12px 16px;
          margin: 8px 0;
          border-radius: 18px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          word-wrap: break-word;
          position: relative;
        }

        .message-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          font-size: 12px;
          opacity: 0.8;
        }

        .sender-name {
          font-weight: bold;
        }

        .timestamp {
          font-size: 11px;
        }

        .message-content {
          line-height: 1.4;
        }

        .message-text {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .copy-button {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          opacity: 0.6;
          transition: opacity 0.2s;
        }

        .copy-button:hover {
          opacity: 1;
        }

        .message-image {
          text-align: center;
        }

        .clickable-image {
          max-width: 100%;
          max-height: 300px;
          border-radius: 8px;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .clickable-image:hover {
          transform: scale(1.02);
        }

        .image-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.9);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          cursor: pointer;
        }

        .modal-image {
          max-width: 90%;
          max-height: 90%;
          object-fit: contain;
        }

        .close-modal {
          position: absolute;
          top: 20px;
          right: 20px;
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          padding: 8px;
          border-radius: 50%;
          cursor: pointer;
          transition: background 0.2s;
        }

        .close-modal:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .image-description {
          margin-top: 8px;
          font-size: 14px;
          color: inherit;
          opacity: 0.8;
        }

        .message-voice {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .voice-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .play-button {
          background: #2196f3;
          color: white;
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.2s;
        }

        .play-button:hover {
          background: #1976d2;
        }

        .voice-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .voice-duration {
          font-size: 12px;
          opacity: 0.7;
        }

        .voice-text {
          font-size: 14px;
        }

        .message-actions {
          margin-top: 8px;
          text-align: center;
        }

        .retry-button {
          background: #ff5722;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 16px;
          cursor: pointer;
          font-size: 12px;
          transition: background 0.2s;
        }

        .retry-button:hover {
          background: #d84315;
        }

        .message-file {
          padding: 12px;
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }

        .file-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .file-icon {
          color: #6c757d;
          flex-shrink: 0;
        }

        .file-details {
          flex: 1;
          min-width: 0;
        }

        .file-name {
          font-weight: 600;
          color: #495057;
          margin-bottom: 4px;
          word-break: break-all;
        }

        .file-size {
          font-size: 12px;
          color: #6c757d;
          margin-bottom: 4px;
        }

        .file-description {
          font-size: 14px;
          color: #6c757d;
          font-style: italic;
        }
      `}</style>
    </div>
  );
};
