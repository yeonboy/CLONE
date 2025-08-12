import logging
import os
from typing import List, Dict, Any
import requests
import re
from sentence_transformers import SentenceTransformer
import chromadb

class YeongulAIService:
    def __init__(self):
        """연걸 AI 서비스를 초기화합니다."""
        self.ollama_base_url = "http://localhost:11434"
        self.model_name = "yeongul"  # 연걸 모델
        
        # 임베딩 모델 초기화
        try:
            self.embedding_model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
            logging.info("임베딩 모델 로드 완료")
        except Exception as e:
            logging.error(f"임베딩 모델 로드 실패: {e}")
            raise
        
        # ChromaDB 초기화
        try:
            self.chroma_client = chromadb.PersistentClient(path="./chroma_db")
            
            # 컬렉션이 없으면 생성
            try:
                self.memories_collection = self.chroma_client.get_collection("yeongul_memories")
            except:
                self.memories_collection = self.chroma_client.create_collection(
                    name="yeongul_memories",
                    metadata={"hnsw:space": "cosine"}
                )
            logging.info("ChromaDB 초기화 완료")
        except Exception as e:
            logging.error(f"ChromaDB 초기화 실패: {e}")
            raise
        
        # Ollama 모델 확인
        self._ensure_ollama_model()
    
    def _ensure_ollama_model(self):
        """연걸 모델이 설치되어 있는지 확인합니다."""
        try:
            response = requests.get(f"{self.ollama_base_url}/api/tags")
            if response.status_code == 200:
                models = response.json().get("models", [])
                model_names = [model["name"] for model in models]
                
                if self.model_name not in model_names:
                    logging.error(f"연걸 모델 {self.model_name}이 설치되지 않았습니다.")
                    logging.info("Modelfile을 사용하여 모델을 생성해주세요.")
                else:
                    logging.info(f"연걸 모델 {self.model_name} 로드 완료")
            else:
                logging.error("Ollama 서비스에 연결할 수 없습니다")
        except Exception as e:
            logging.error(f"Ollama 모델 확인 중 오류: {e}")
    
    def get_embedding(self, text: str) -> List[float]:
        """주어진 텍스트의 임베딩 벡터를 생성합니다."""
        try:
            embedding = self.embedding_model.encode(text)
            return embedding.tolist()
        except Exception as e:
            logging.error(f"임베딩 생성 실패: {e}")
            raise
    
    def add_memory(self, text: str, metadata: Dict[str, Any] = None):
        """새로운 기억을 벡터 데이터베이스에 추가합니다."""
        try:
            embedding = self.get_embedding(text)
            self.memories_collection.add(
                embeddings=[embedding],
                documents=[text],
                metadatas=[metadata or {}],
                ids=[f"memory_{len(self.memories_collection.get()['ids'])}"]
            )
            logging.info("기억 추가 완료")
        except Exception as e:
            logging.error(f"기억 추가 실패: {e}")
    
    def find_similar_memories(self, query_text: str, num_neighbors: int = 3) -> str:
        """벡터 검색으로 유사한 기억을 찾습니다."""
        try:
            query_embedding = self.get_embedding(query_text)
            
            results = self.memories_collection.query(
                query_embeddings=[query_embedding],
                n_results=num_neighbors
            )
            
            if results['documents'] and results['documents'][0]:
                return "\n".join(results['documents'][0])
            return ""
        except Exception as e:
            logging.error(f"유사한 기억 검색 실패: {e}")
            return ""
    
    def _remove_duplicates(self, text: str) -> str:
        """중복된 내용을 제거합니다."""
        # 연속된 동일한 문장 제거
        lines = text.split('\n')
        cleaned_lines = []
        prev_line = ""
        
        for line in lines:
            line = line.strip()
            if line and line != prev_line:
                cleaned_lines.append(line)
                prev_line = line
        
        # 중복된 단어나 표현 제거
        cleaned_text = '\n'.join(cleaned_lines)
        
        # 반복적인 패턴 제거
        cleaned_text = re.sub(r'(\b\w+\b)(?:\s+\1)+', r'\1', cleaned_text)
        
        return cleaned_text
    
    def _limit_output_length(self, text: str, max_sentences: int = 3) -> str:
        """출력 길이를 제한합니다."""
        sentences = re.split(r'[.!?]+', text)
        sentences = [s.strip() for s in sentences if s.strip()]
        
        if len(sentences) > max_sentences:
            sentences = sentences[:max_sentences]
        
        return '. '.join(sentences) + '.'
    
    def generate_response(self, user_input: str, context: str = "") -> str:
        """연걸 모델을 사용하여 응답을 생성합니다."""
        try:
            # 유사한 기억 검색
            memories = self.find_similar_memories(user_input)
            
            # 프롬프트 구성
            prompt = f"""사용자: {user_input}

{context}

{memories}

연걸:"""
            
            # Ollama API 호출
            response = requests.post(
                f"{self.ollama_base_url}/api/generate",
                json={
                    "model": self.model_name,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.7,
                        "top_p": 0.9,
                        "max_tokens": 150
                    }
                }
            )
            
            if response.status_code == 200:
                result = response.json()
                generated_text = result.get("response", "")
                
                # 중복 제거 및 길이 제한
                cleaned_text = self._remove_duplicates(generated_text)
                final_text = self._limit_output_length(cleaned_text)
                
                return final_text
            else:
                logging.error(f"Ollama API 호출 실패: {response.text}")
                return "죄송합니다. 응답을 생성할 수 없습니다."
                
        except Exception as e:
            logging.error(f"응답 생성 실패: {e}")
            return "죄송합니다. 오류가 발생했습니다."
    
    def initialize_memories_from_files(self, file_paths: List[str]):
        """카카오톡 파일들에서 기억을 초기화합니다."""
        for file_path in file_paths:
            try:
                if os.path.exists(file_path):
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # 연걸의 메시지만 추출
                    yeongul_messages = re.findall(r'\[연걸\](.*?)(?=\[|$)', content, re.DOTALL)
                    
                    for message in yeongul_messages:
                        message = message.strip()
                        if message:
                            self.add_memory(message, {"source": file_path})
                    
                    logging.info(f"{file_path}에서 {len(yeongul_messages)}개의 메시지 추출 완료")
                else:
                    logging.warning(f"파일을 찾을 수 없습니다: {file_path}")
            except Exception as e:
                logging.error(f"파일 처리 중 오류 발생 {file_path}: {e}")
    
    def _split_text_into_chunks(self, text: str, chunk_size: int = 1000) -> List[str]:
        """긴 텍스트를 청크로 분할합니다."""
        words = text.split()
        chunks = []
        current_chunk = []
        current_size = 0
        
        for word in words:
            if current_size + len(word) + 1 > chunk_size:
                chunks.append(' '.join(current_chunk))
                current_chunk = [word]
                current_size = len(word)
            else:
                current_chunk.append(word)
                current_size += len(word) + 1
        
        if current_chunk:
            chunks.append(' '.join(current_chunk))
        
        return chunks
