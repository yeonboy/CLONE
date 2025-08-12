import logging
from ..api.schemas import MessageData
from ..db.firebase_service import save_ai_message, get_persona, update_message_status
from ..ai_core.ai_service_factory import AIServiceFactory

logging.basicConfig(level=logging.INFO)

# AI 서비스는 설정에 따라 로컬 또는 클라우드로 초기화됩니다
ai_service = AIServiceFactory.create_ai_service()
service_type = AIServiceFactory.get_service_type()

def process_user_message(conversation_id: str, message_id: str, message_data: MessageData):
    """
    사용자 메시지를 받아 AI 응답을 생성하고 저장하는 전체 파이프라인입니다.
    """
    logging.info(f"AI 응답 생성 시작 ({service_type}): Conversation={conversation_id}, Message={message_id}")

    try:
        # 1. 입력 텍스트 준비 (음성 처리 로직 제거)
        user_text = message_data.content.text

        if not user_text:
            logging.warning("User text is empty. Aborting.")
            # 실패 상태 업데이트는 클라이언트 요구사항에 따라 유지하거나 제거할 수 있습니다.
            return

        # 2. 페르소나 로드 및 RAG 기억 검색
        system_prompt = get_persona()
        memories = ai_service.find_similar_memories(user_text)

        # 3. LLM 추론 (로컬 또는 클라우드)
        ai_text_response = ai_service.generate_response(
            system_prompt=system_prompt,
            user_input=user_text,
            memories=memories
        )

        # 4. Firestore에 AI 텍스트 응답 저장 (음성 관련 로직 제거)
        save_ai_message(conversation_id, ai_text_response)
        logging.info(f"AI 응답 저장 완료: Conversation={conversation_id}")

    except Exception as e:
        logging.error(f"AI 파이프라인 처리 중 에러 발생: {e}", exc_info=True)
        update_message_status(conversation_id, message_id, "failed")
    finally:
        # 성공/실패 여부와 관계없이 사용자 메시지 상태를 최종적으로 업데이트 (중복 방지)
        # 'processing' 상태가 아닌 경우에만 'sent'로 변경
        pass # Cloud Function에서 이미 처리하므로 여기서는 생략 가능