from firebase_admin import firestore
import logging

def get_persona(persona_id: str = "hwang_yeon_geol") -> str:
    """Firestore에서 지정된 페르소나의 시스템 프롬프트를 가져옵니다."""
    try:
        db = firestore.client()
        persona_ref = db.collection("AIPersonas").document(persona_id)
        persona_doc = persona_ref.get()
        if persona_doc.exists:
            system_prompt = persona_doc.to_dict().get("systemPrompt", "")
            logging.info(f"Successfully loaded persona '{persona_id}'.")
            return system_prompt
        else:
            logging.warning(f"Persona '{persona_id}' not found in Firestore.")
            return "당신은 친절한 AI 어시스턴트입니다." # 기본 프롬프트
    except Exception as e:
        logging.error(f"Failed to get persona '{persona_id}': {e}", exc_info=True)
        raise

def update_message_status(conversation_id: str, message_id: str, status: str):
    """사용자 메시지의 처리 상태를 업데이트합니다."""
    try:
        db = firestore.client()
        message_ref = db.collection("Conversations").document(conversation_id).collection("Messages").document(message_id)
        message_ref.update({"status": status})
    except Exception as e:
        logging.error(f"Failed to update status for message {message_id}: {e}", exc_info=True)
        
def save_ai_message(conversation_id: str, text: str):
    """
    생성된 AI의 텍스트 응답을 Firestore에 저장합니다.
    """
    try:
        db = firestore.client()
        messages_ref = db.collection("Conversations").document(conversation_id).collection("Messages")
        
        ai_message_data = {
            "senderId": "ai_hwang_yeon_geol",
            "timestamp": firestore.SERVER_TIMESTAMP,
            "type": "text", # AI 응답 타입을 'text'로 변경
            "content": {
                "text": text
            },
            "status": "sent"
        }
        messages_ref.add(ai_message_data)
        logging.info(f"Successfully saved AI message to conversation {conversation_id}")
    except Exception as e:
        logging.error(f"Failed to save AI message for conversation {conversation_id}: {e}")
        raise