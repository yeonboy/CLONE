import os

# 로컬 AI 모델 설정
LOCAL_AI_ENABLED = os.getenv("LOCAL_AI_ENABLED", "true").lower() == "true"

# Ollama 설정
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL_NAME = os.getenv("OLLAMA_MODEL_NAME", "llama3.1:8b")

# 임베딩 모델 설정
EMBEDDING_MODEL_NAME = os.getenv("EMBEDDING_MODEL_NAME", "sentence-transformers/all-MiniLM-L6-v2")

# ChromaDB 설정
CHROMA_DB_PATH = os.getenv("CHROMA_DB_PATH", "./chroma_db")

# 스타일/리포트(말투 가이드) 경로 설정
# Windows 기본값 예시: C:\연걸타워\RESEARCH
REPORTS_DIR = os.getenv("REPORTS_DIR", r"C:\\연걸타워\\RESEARCH")
# 세미콜론 구분 복수 패턴("*.txt;*.md")
REPORTS_GLOB = os.getenv("REPORTS_GLOB", "*.txt;*.md")

# 기존 GCP 설정 (로컬 모드에서는 사용하지 않음)
GCP_PROJECT_ID = os.getenv("GCP_PROJECT_ID", "your-gcp-project-id")
GCP_LOCATION = os.getenv("GCP_LOCATION", "asia-northeast3")

# Vertex AI 설정 (로컬 모드에서는 사용하지 않음)
VERTEX_AI_EMBEDDING_MODEL = "text-embedding-004"
VERTEX_AI_LLM_MODEL = "gemini-1.5-pro-001"
VECTOR_SEARCH_INDEX_ID = os.getenv("VECTOR_SEARCH_INDEX_ID", "your-vector-search-index-id")
VECTOR_SEARCH_ENDPOINT_ID = os.getenv("VECTOR_SEARCH_ENDPOINT_ID", "your-vector-search-endpoint-id")
VECTOR_SEARCH_DEPLOYED_INDEX_ID = os.getenv("VECTOR_SEARCH_DEPLOYED_INDEX_ID", "your-deployed-index-id")