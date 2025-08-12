import logging
from .local_ai_service import LocalAIService
from .vertex_ai_service import VertexAIService
from .. import config

class AIServiceFactory:
    """AI 서비스 팩토리 클래스"""
    
    @staticmethod
    def create_ai_service():
        """설정에 따라 적절한 AI 서비스를 생성합니다."""
        if config.LOCAL_AI_ENABLED:
            logging.info("로컬 AI 서비스 초기화 중...")
            return LocalAIService()
        else:
            logging.info("클라우드 AI 서비스 초기화 중...")
            return VertexAIService()
    
    @staticmethod
    def get_service_type():
        """현재 사용 중인 AI 서비스 타입을 반환합니다."""
        return "local" if config.LOCAL_AI_ENABLED else "cloud"
