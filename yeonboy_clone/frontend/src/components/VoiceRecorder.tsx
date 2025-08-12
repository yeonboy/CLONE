import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2 } from 'lucide-react';

interface VoiceRecorderProps {
  onVoiceMessage: (audioBlob: Blob) => void;
  isRecording: boolean;
  onRecordingChange: (recording: boolean) => void;
  disabled?: boolean;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onVoiceMessage,
  isRecording,
  onRecordingChange,
  disabled = false
}) => {
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        chunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioURL(audioUrl);
        onVoiceMessage(audioBlob);
        
        // 스트림 정리
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      onRecordingChange(true);
    } catch (error) {
      console.error('음성 녹음을 시작할 수 없습니다:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      onRecordingChange(false);
    }
  };

  const playAudio = () => {
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

  const deleteRecording = () => {
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
      setAudioURL(null);
      setDuration(0);
      setCurrentTime(0);
      setIsPlaying(false);
    }
  };

  const updateProgress = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.addEventListener('loadedmetadata', () => {
        setDuration(audioRef.current?.duration || 0);
      });
      
      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false);
        setCurrentTime(0);
      });
      
      audioRef.current.addEventListener('timeupdate', updateProgress);
    }
  }, [audioURL]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
      {/* 녹음 버튼 */}
      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={disabled}
        className={`p-3 rounded-full transition-all duration-200 ${
          disabled 
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
            : isRecording 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-blue-500 hover:bg-blue-600 text-white'
        }`}
        title={disabled ? "서버 연결 필요" : "음성 녹음"}
      >
        {isRecording ? <Square size={20} /> : <Mic size={20} />}
      </button>

      {/* 녹음 상태 표시 */}
      {isRecording && (
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600">녹음 중...</span>
        </div>
      )}

      {/* 녹음된 오디오 재생 */}
      {audioURL && (
        <div className="flex items-center space-x-2">
          <button
            onClick={playAudio}
            className="p-2 rounded-full bg-green-500 hover:bg-green-600 text-white"
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>
          
          <div className="flex items-center space-x-2 min-w-[120px]">
            <span className="text-xs text-gray-500">{formatTime(currentTime)}</span>
            <div className="flex-1 bg-gray-200 rounded-full h-1">
              <div 
                className="bg-blue-500 h-1 rounded-full transition-all duration-100"
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              ></div>
            </div>
            <span className="text-xs text-gray-500">{formatTime(duration)}</span>
          </div>
          
          <button
            onClick={deleteRecording}
            className="p-2 rounded-full bg-red-500 hover:bg-red-600 text-white"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}

      {/* 숨겨진 오디오 요소 */}
      {audioURL && (
        <audio
          ref={audioRef}
          src={audioURL}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      )}
    </div>
  );
};
