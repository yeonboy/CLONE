import logging
from typing import List

# Google Cloud 의존성 제거 - 로컬 모드에서는 사용하지 않음
# from google.cloud import aiplatform
# from vertexai.language_models import TextEmbeddingModel
# from vertexai.generative_models import GenerativeModel

from .. import config

class VertexAIService:
    def __init__(self):
        logging.warning("Vertex AI Service is not available in local mode. Please use LocalAIService instead.")
        # 더미 초기화
        self.embedding_model = None
        self.llm_model = None
        self.vector_search_endpoint = None

    def get_embedding(self, text: str) -> List[float]:
        """더미 임베딩 - 로컬 모드에서는 사용하지 않음"""
        logging.error("Vertex AI Service is not available in local mode")
        raise NotImplementedError("Vertex AI Service is not available in local mode. Use LocalAIService instead.")

    def find_similar_memories(self, query_text: str, num_neighbors: int = 3) -> str:
        """더미 메모리 검색 - 로컬 모드에서는 사용하지 않음"""
        logging.error("Vertex AI Service is not available in local mode")
        raise NotImplementedError("Vertex AI Service is not available in local mode. Use LocalAIService instead.")

    def generate_response(self, system_prompt: str, user_input: str, memories: str) -> str:
        """더미 응답 생성 - 로컬 모드에서는 사용하지 않음"""
        logging.error("Vertex AI Service is not available in local mode")
        raise NotImplementedError("Vertex AI Service is not available in local mode. Use LocalAIService instead.")