import React from 'react';
import { AvatarStatus } from '../types';

interface FaceAvatarProps {
  status: AvatarStatus;
}

const FaceAvatar: React.FC<FaceAvatarProps> = ({ status }) => (
  <>
    <style>{`
      @keyframes idle-glow {
        0%, 100% { filter: drop-shadow(0 0 8px rgba(0, 209, 255, 0.5)); }
        50% { filter: drop-shadow(0 0 15px rgba(0, 209, 255, 0.8)); }
      }
      @keyframes listening-wave-pulse {
        0% { r: 40; opacity: 1; }
        100% { r: 60; opacity: 0; }
      }
      @keyframes thinking-scan {
        0% { transform: translateY(-15px); }
        100% { transform: translateY(15px); }
      }
      
      .face-avatar { position: relative; width: 80px; height: 80px; }
      .face-svg { width: 100%; height: 100%; }
      .face-outline { fill: none; stroke: rgba(0, 209, 255, 0.8); stroke-width: 2; }
      .face-eye { fill: #00D1FF; transition: all 0.3s ease; }
      
      /* Idle State */
      .face-avatar.idle .face-outline { animation: idle-glow 4s ease-in-out infinite; }
      
      /* Listening State */
      .face-avatar.listening .listening-wave {
        stroke: rgba(255, 0, 230, 0.8);
        stroke-width: 2;
        fill: none;
        animation: listening-wave-pulse 1.5s ease-out infinite;
      }
      .face-avatar.listening .face-eye { transform-origin: center; transform: scale(1.2); }

      /* Thinking State */
      .face-avatar.thinking .face-eye { transform: scaleY(0.2); }
      .face-avatar.thinking .thinking-scan-line {
        fill: none;
        stroke: #FF00E6;
        stroke-width: 2;
        stroke-linecap: round;
        animation: thinking-scan 1s ease-in-out infinite alternate;
      }
    `}</style>
    <div className={`face-avatar ${status}`}>
      <svg className="face-svg" viewBox="0 0 100 100">
        {status === 'listening' && <circle className="listening-wave" cx="50" cy="50" r="40" />} 
        <circle className="face-outline" cx="50" cy="50" r="48" />
        <g className="face-eyes">
          <rect className="face-eye" x="25" y="45" width="15" height="10" rx="5" />
          <rect className="face-eye" x="60" y="45" width="15" height="10" rx="5" />
        </g>
        {status === 'thinking' && (
          <g className="thinking-scan">
            <path className="thinking-scan-line" d="M 20 50 L 80 50" />
          </g>
        )}
      </svg>
    </div>
  </>
);

export default FaceAvatar;
