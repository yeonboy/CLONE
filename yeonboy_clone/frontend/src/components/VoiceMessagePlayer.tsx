import React from 'react';
import { styles } from '../styles/chatStyles';

interface VoiceMessagePlayerProps {
  duration: number;
  isMyMessage: boolean;
}

const VoiceMessagePlayer: React.FC<VoiceMessagePlayerProps> = ({ duration, isMyMessage }) => {
  const textColor = isMyMessage ? '#FFFFFF' : '#E6EDF3';
  
  return (
    <div style={styles.voiceContainer}>
      <button style={styles.voiceButton}>▶️</button>
      <div style={styles.voiceProgressBar}>
        <div style={styles.voiceProgressDot} />
      </div>
      <span style={{ ...styles.voiceDuration, color: textColor }}>
        {`0:${String(duration).padStart(2, '0')}`}
      </span>
    </div>
  );
};

export default VoiceMessagePlayer;
