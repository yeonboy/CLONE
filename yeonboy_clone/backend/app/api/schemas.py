from pydantic import BaseModel, Field
from typing import Optional, Literal, Any

class MessageContent(BaseModel):
    text: Optional[str] = None
    media_url: Optional[str] = Field(None, alias='mediaUrl')
    duration: Optional[int] = None

class MessageData(BaseModel):
    senderId: str
    timestamp: Any # Firestore timestamp is a dict when passed via JSON
    type: Literal["text", "image"]
    content: MessageContent
    status: str

class ProcessMessageRequest(BaseModel):
    conversationId: str
    messageId: str
    messageData: MessageData