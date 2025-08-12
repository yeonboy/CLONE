import React, { useState } from 'react';
import { styles } from '../styles/chatStyles';

interface ChatInputProps {
  onSend: (text: string) => void;
  onListenStart: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, onListenStart }) => {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (text.trim().length === 0) return;
    onSend(text);
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={styles.inputOuterContainer}>
      <style>{`
        .sci-fi-searchbar {
          display: flex;
          z-index: 3;
          height: 48px;
          background: rgba(0, 209, 255, 0.05);
          border: 1px solid rgba(0, 209, 255, 0.2);
          box-shadow: 0 0 15px rgba(0, 209, 255, 0.1);
          border-radius: 8px;
          margin: 0 auto;
          width: 100%;
          max-width: 700px;
          transition: box-shadow 0.3s, border-color 0.3s;
        }
        .sci-fi-searchbar:hover {
          box-shadow: 0 0 20px rgba(0, 209, 255, 0.3);
          border-color: rgba(0, 209, 255, 0.5);
        }
        .sci-fi-searchbar-wrapper {
          flex: 1;
          display: flex;
          padding: 5px 8px 0 14px;
          align-items: center;
        }
        .sci-fi-searchbar-center {
          display: flex;
          flex: 1;
        }
        .sci-fi-searchbar-input {
          font-family: 'Orbitron', sans-serif;
          background-color: transparent;
          border: none;
          margin: 0;
          padding: 0;
          color: #E6EDF3;
          word-wrap: break-word;
          outline: none;
          display: flex;
          flex: 1;
          height: 34px;
          font-size: 16px;
          width: 100%;
        }
        .sci-fi-searchbar-right {
          display: flex;
          flex: 0 0 auto;
        }
        .sci-fi-voice-search {
          display: flex;
          cursor: pointer;
          align-items: center;
          border: 0;
          background: transparent;
          outline: none;
          padding: 0 8px;
          color: #8B949E;
          transition: color 0.2s;
        }
        .sci-fi-send-button-active {
          color: #00D1FF;
        }
      `}</style>
      <div className="sci-fi-searchbar">
        <div className="sci-fi-searchbar-wrapper">
          <div className="sci-fi-searchbar-center">
            <input
              type="text"
              className="sci-fi-searchbar-input"
              placeholder="명령어 입력..."
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              value={text}
            />
          </div>
          <div className="sci-fi-searchbar-right">
            <button
              className={`sci-fi-voice-search ${text ? 'sci-fi-send-button-active' : ''}`}
              onClick={text ? handleSend : onListenStart}
            >
              {text ? (
                <svg
                  focusable="false"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                >
                  <path
                    fill="currentColor"
                    d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"
                  ></path>
                </svg>
              ) : (
                <svg
                  focusable="false"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                >
                  <path
                    fill="currentColor"
                    d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.49 6-3.31 6-6.72h-1.7z"
                  ></path>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
