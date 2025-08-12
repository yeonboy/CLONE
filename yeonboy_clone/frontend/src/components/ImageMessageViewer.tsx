import React from 'react';
import { styles } from '../styles/chatStyles';

interface ImageMessageViewerProps {
  uri: string;
}

const ImageMessageViewer: React.FC<ImageMessageViewerProps> = ({ uri }) => (
  <img src={uri} style={styles.imageMessage} alt="User uploaded content" />
);

export default ImageMessageViewer;
