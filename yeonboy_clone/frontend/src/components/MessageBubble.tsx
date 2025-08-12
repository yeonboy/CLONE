import React from 'react';
import { Message } from '../types';
import { styles } from '../styles/chatStyles';
import ImageMessageViewer from './ImageMessageViewer';
import VoiceMessagePlayer from './VoiceMessagePlayer';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isMyMessage = message.senderId === 'me';
  const textColor = isMyMessage ? '#FFF' : '#E6EDF3';

  const renderMessageContent = () => {
    switch (message.type) {
      case 'image':
        return (
          <div>
            {message.content.mediaUrl && (
              <ImageMessageViewer uri={message.content.mediaUrl} />
            )}
            {message.content.text && (
              <p style={{ ...styles.imageText, color: textColor }}>
                {message.content.text}
              </p>
            )}
          </div>
        );
      case 'voice':
        return (
          <VoiceMessagePlayer 
            duration={message.content.duration!} 
            isMyMessage={isMyMessage} 
          />
        );
      default:
        return <p style={styles.textMessage}>{message.content.text}</p>;
    }
  };

  return (
    <div
      style={{
        ...styles.messageRow,
        ...(isMyMessage ? styles.myMessageRow : styles.otherMessageRow),
      }}
    >
      <div
        style={{
          ...styles.bubble,
          ...(isMyMessage ? styles.myBubble : styles.otherBubble),
        }}
      >
        {renderMessageContent()}
      </div>
      <span style={styles.timestamp}>
        {message.timestamp.toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </span>
    </div>
  );
};

export default MessageBubble;
