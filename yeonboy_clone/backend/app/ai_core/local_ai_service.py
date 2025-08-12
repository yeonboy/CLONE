import logging
import os
from typing import List, Dict, Any
import requests
from sentence_transformers import SentenceTransformer
import chromadb

class LocalAIService:
    def __init__(self):
        """로컬 AI 서비스를 초기화합니다."""
        self.ollama_base_url = "http://localhost:11434"
        self.model_name = "llama3.1:8b"  # 한국어 지원 모델
        
        # 임베딩 모델 초기화
        try:
            self.embedding_model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
            logging.info("임베딩 모델 로드 완료")
        except Exception as e:
            logging.error(f"임베딩 모델 로드 실패: {e}")
            raise
        
        # ChromaDB 초기화 (최신 버전 호환)
        try:
            # 최신 ChromaDB 클라이언트 생성 방식
            self.chroma_client = chromadb.PersistentClient(path="./chroma_db")
            
            # 컬렉션이 없으면 생성
            try:
                self.memories_collection = self.chroma_client.get_collection("memories")
            except:
                self.memories_collection = self.chroma_client.create_collection(
                    name="memories",
                    metadata={"hnsw:space": "cosine"}
                )
            logging.info("ChromaDB 초기화 완료")
        except Exception as e:
            logging.error(f"ChromaDB 초기화 실패: {e}")
            raise
        
        # Ollama 모델 확인 및 다운로드
        self._ensure_ollama_model()
        
        # 대화 세션 관리
        self.conversation_sessions = {}
    
    def _ensure_ollama_model(self):
        """Ollama 모델이 설치되어 있는지 확인하고 없으면 다운로드합니다."""
        try:
            response = requests.get(f"{self.ollama_base_url}/api/tags")
            if response.status_code == 200:
                models = response.json().get("models", [])
                model_names = [model["name"] for model in models]
                
                if self.model_name not in model_names:
                    logging.info(f"모델 {self.model_name} 다운로드 시작...")
                    download_response = requests.post(
                        f"{self.ollama_base_url}/api/pull",
                        json={"name": self.model_name}
                    )
                    if download_response.status_code == 200:
                        logging.info(f"모델 {self.model_name} 다운로드 완료")
                    else:
                        logging.error(f"모델 다운로드 실패: {download_response.text}")
                else:
                    logging.info(f"모델 {self.model_name} 이미 설치됨")
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
    
    def find_similar_memories(self, query_text: str, num_neighbors: int = 5) -> str:
        """벡터 검색으로 유사한 기억을 찾고 맥락을 구성합니다."""
        try:
            query_embedding = self.get_embedding(query_text)
            
            # 더 많은 유사한 기억을 검색하여 맥락 구성
            results = self.chroma_client.get_collection("memories").query(
                query_embeddings=[query_embedding],
                n_results=num_neighbors,
                include=["documents", "metadatas", "distances"]
            )
            
            if results['documents'] and results['documents'][0]:
                memories = results['documents'][0]
                metadatas = results['metadatas'][0]
                distances = results['distances'][0]
                
                # 거리 기반으로 관련성 높은 순으로 정렬
                memory_with_scores = list(zip(memories, distances, metadatas))
                memory_with_scores.sort(key=lambda x: x[1])  # 거리 기준 정렬
                
                # 맥락을 구성하는 기억들 선택
                relevant_memories = []
                for memory, distance, metadata in memory_with_scores[:3]:  # 상위 3개만 사용
                    if distance < 0.8:  # 유사도 임계값
                        source = metadata.get('source_file', '알 수 없음') if metadata else '알 수 없음'
                        relevant_memories.append(f"[{source}] {memory}")
                
                if relevant_memories:
                    formatted_memories = "\n".join(relevant_memories)
                    logging.info(f"맥락 관련 기억 발견: {len(relevant_memories)}개")
                    return f"[과거 대화 맥락]\n{formatted_memories}"
                else:
                    logging.info("유사도가 높은 기억 없음")
                    return "기억 없음"
            else:
                logging.info("유사한 기억 없음")
                return "기억 없음"
                
        except Exception as e:
            logging.error(f"기억 검색 실패: {e}")
            return "기억 검색 중 오류 발생"
    
    def generate_response(self, system_prompt: str, user_input: str, memories: str, session_id: str = "default") -> str:
        """Ollama를 사용하여 맥락 있는 응답을 생성합니다."""
        try:
            # 대화 세션 맥락 가져오기
            conversation_context = self.get_conversation_context(session_id)
            
            # 맥락을 고려한 프롬프트 구성
            context_parts = []
            
            if memories and memories != "기억 없음":
                context_parts.append(f"[과거 대화 맥락 - 참고하여 맥락에 맞게 응답하세요]\n{memories}")
            
            if conversation_context:
                context_parts.append(f"[최근 대화 맥락]\n{conversation_context}")
            
            context_text = "\n\n".join(context_parts) if context_parts else ""
            
            if context_text:
                full_prompt = f"""{system_prompt}

{context_text}

[현재 대화 - 맥락을 유지하며 자연스럽게 대화하세요]
사용자: {user_input}
황연걸:"""
            else:
                full_prompt = f"""{system_prompt}

[현재 대화 - 자연스럽고 친근하게 대화하세요]
사용자: {user_input}
황연걸:"""
            
            # 더 세밀한 생성 옵션으로 맥락 있는 응답 생성
            response = requests.post(
                f"{self.ollama_base_url}/api/generate",
                json={
                    "model": self.model_name,
                    "prompt": full_prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.65,  # 일관성 높임
                        "top_p": 0.9,
                        "top_k": 50,         # 더 넓은 토큰 선택
                        "repeat_penalty": 1.15,  # 반복 방지 강화
                        "max_tokens": 1024,  # 적절한 응답 길이
                        "stop": ["사용자:", "황연걸:", "\n\n", "---", "###"]
                    }
                }
            )
            
            if response.status_code == 200:
                result = response.json()
                ai_response = result.get("response", "").strip()
                
                # 응답 품질 검증 및 개선
                if len(ai_response) < 10:
                    logging.warning("응답이 너무 짧음, 재생성 시도")
                    return self._regenerate_response(system_prompt, user_input, memories, session_id)
                
                # 대화 세션에 맥락 추가
                self.add_conversation_context(session_id, user_input, ai_response)
                
                logging.info(f"맥락 있는 AI 응답 생성 완료: {len(ai_response)}자")
                return ai_response
            else:
                logging.error(f"Ollama API 오류: {response.status_code} - {response.text}")
                raise Exception(f"Ollama API 오류: {response.status_code}")
                
        except Exception as e:
            logging.error(f"응답 생성 실패: {e}")
            raise
    
    def _regenerate_response(self, system_prompt: str, user_input: str, memories: str, session_id: str = "default") -> str:
        """응답이 부족할 경우 재생성을 시도합니다."""
        try:
            enhanced_prompt = f"""{system_prompt}

[과거 대화 맥락]
{memories}

[현재 대화 - 더 구체적이고 맥락에 맞는 응답을 해주세요]
사용자: {user_input}
황연걸:"""
            
            response = requests.post(
                f"{self.ollama_base_url}/api/generate",
                json={
                    "model": self.model_name,
                    "prompt": enhanced_prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.95,  # 더 높은 창의성
                        "top_p": 0.98,       # 더 넓은 토큰 선택
                        "top_k": 60,         # 더 넓은 선택 범위
                        "repeat_penalty": 1.1,
                        "max_tokens": 1500,
                        "stop": ["사용자:", "황연걸:", "\n\n", "---"]
                    }
                }
            )
            
            if response.status_code == 200:
                result = response.json()
                ai_response = result.get("response", "").strip()
                logging.info(f"재생성 응답 완료: {len(ai_response)}자")
                return ai_response
            else:
                return "죄송합니다. 응답을 생성하는 데 문제가 있었습니다."
                
        except Exception as e:
            logging.error(f"재생성 실패: {e}")
            return "죄송합니다. 응답을 생성하는 데 문제가 있었습니다."
    
    def enhance_memory_search(self, query_text: str, num_neighbors: int = 8) -> str:
        """향상된 메모리 검색으로 더 나은 맥락을 제공합니다."""
        try:
            # 기본 검색
            basic_memories = self.find_similar_memories(query_text, num_neighbors)
            
            # 추가 컨텍스트 검색
            enhanced_context = self._get_enhanced_context(query_text)
            
            if enhanced_context and basic_memories != "기억 없음":
                return f"{basic_memories}\n\n[추가 맥락 정보]\n{enhanced_context}"
            elif enhanced_context:
                return f"[맥락 정보]\n{enhanced_context}"
            else:
                return basic_memories
                
        except Exception as e:
            logging.error(f"향상된 메모리 검색 실패: {e}")
            return self.find_similar_memories(query_text, num_neighbors)
    
    def _get_enhanced_context(self, query_text: str) -> str:
        """쿼리와 관련된 추가 맥락 정보를 검색합니다."""
        try:
            # 키워드 기반 검색
            keywords = self._extract_keywords(query_text)
            if not keywords:
                return ""
            
            # 키워드와 관련된 메모리 검색
            related_memories = []
            for keyword in keywords[:3]:  # 상위 3개 키워드만 사용
                try:
                    results = self.chroma_client.get_collection("memories").query(
                        query_texts=[keyword],
                        n_results=2
                    )
                    if results['documents'] and results['documents'][0]:
                        related_memories.extend(results['documents'][0])
                except:
                    continue
            
            if related_memories:
                # 중복 제거 및 정리
                unique_memories = list(set(related_memories))
                return "\n".join([f"- {mem}" for mem in unique_memories[:3]])
            
            return ""
            
        except Exception as e:
            logging.error(f"향상된 컨텍스트 검색 실패: {e}")
            return ""
    
    def _extract_keywords(self, text: str) -> List[str]:
        """텍스트에서 중요한 키워드를 추출합니다."""
        import re
        
        # 한국어 단어 추출
        korean_words = re.findall(r'[가-힣]+', text)
        
        # 의미 있는 단어만 필터링 (2글자 이상)
        meaningful_words = [word for word in korean_words if len(word) >= 2]
        
        # 빈도 기반으로 상위 키워드 선택
        word_freq = {}
        for word in meaningful_words:
            word_freq[word] = word_freq.get(word, 0) + 1
        
        # 빈도순 정렬
        sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
        
        return [word for word, freq in sorted_words[:5]]  # 상위 5개 키워드
    
    def initialize_memories_from_files(self, file_paths: List[str]):
        """카카오톡 대화 파일들로부터 초기 기억을 생성합니다."""
        import re
        
        for file_path in file_paths:
            if os.path.exists(file_path):
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # 카카오톡 대화 파싱 (보고서 기반 정규표현식)
                    parsed_messages = self._parse_kakao_talk(content)
                    
                    # 파싱된 메시지들을 기억에 추가
                    for i, message in enumerate(parsed_messages):
                        if message.strip():  # 빈 메시지 제외
                            metadata = {
                                "source_file": os.path.basename(file_path),
                                "message_index": i,
                                "message_type": "kakao_talk",
                                "message_length": len(message)
                            }
                            self.add_memory(message, metadata)
                    
                    logging.info(f"파일 {file_path}에서 {len(parsed_messages)}개 메시지 파싱 완료")
                except Exception as e:
                    logging.error(f"파일 {file_path} 처리 실패: {e}")
    
    def _parse_kakao_talk(self, content: str) -> List[str]:
        """카카오톡 대화 내용을 파싱하여 맥락 있는 기억을 생성합니다."""
        import re
        
        # 카카오톡 메시지 패턴 (보고서 기반)
        # [작성자][시간] 메시지 형식
        pattern = r'\[([^\]]+)\]\[([^\]]+)\](.*?)(?=\n\[|$)'
        
        messages = []
        matches = re.findall(pattern, content, re.DOTALL)
        
        # 대화 맥락을 위한 버퍼
        conversation_buffer = []
        current_author = None
        
        for author, time, message in matches:
            # 시스템 메시지 제거
            if any(keyword in message for keyword in [
                "님이 들어왔습니다", "님이 나갔습니다", "---------------", 
                "2023년", "2024년", "2025년", "월요일", "화요일", "수요일", 
                "목요일", "금요일", "토요일", "일요일", "님이 채팅방을 나갔습니다",
                "님이 채팅방에 들어왔습니다", "님이 초대되었습니다"
            ]):
                continue
                
            # 메시지 정제
            clean_message = message.strip()
            if clean_message and len(clean_message) > 3:  # 너무 짧은 메시지 제외
                # 이모지 제거 (유니코드 이모지 범위)
                clean_message = re.sub(r'[\U0001F600-\U0001F64F\U0001F300-\U0001F5FF\U0001F680-\U0001F6FF\U0001F1E0-\U0001F1FF\U00002600-\U000027BF]', '', clean_message)
                # URL 제거
                clean_message = re.sub(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', '', clean_message)
                # 특수 문자 정리
                clean_message = re.sub(r'[^\w\s가-힣ㄱ-ㅎㅏ-ㅣ.,!?~()]', '', clean_message)
                
                if clean_message.strip():
                    # 대화 맥락 구성
                    if current_author == author:
                        # 같은 사람의 연속 메시지인 경우
                        conversation_buffer.append(clean_message.strip())
                    else:
                        # 다른 사람의 메시지인 경우, 이전 대화를 저장
                        if conversation_buffer:
                            context_message = f"[{current_author}] {' '.join(conversation_buffer)}"
                            messages.append(context_message)
                            conversation_buffer = []
                        
                        current_author = author
                        conversation_buffer = [clean_message.strip()]
        
        # 마지막 대화 버퍼 처리
        if conversation_buffer:
            context_message = f"[{current_author}] {' '.join(conversation_buffer)}"
            messages.append(context_message)
        
        # 맥락이 있는 메시지만 필터링
        filtered_messages = []
        for msg in messages:
            if len(msg) > 10 and not any(keyword in msg for keyword in [
                "알림", "공지", "설정", "초대", "나감", "들어옴"
            ]):
                filtered_messages.append(msg)
        
        return filtered_messages
    
    def add_conversation_context(self, session_id: str, user_input: str, ai_response: str):
        """대화 세션에 맥락 정보를 추가합니다."""
        if session_id not in self.conversation_sessions:
            self.conversation_sessions[session_id] = []
        
        # 최근 5개의 대화만 유지 (메모리 효율성)
        if len(self.conversation_sessions[session_id]) >= 10:
            self.conversation_sessions[session_id] = self.conversation_sessions[session_id][-5:]
        
        self.conversation_sessions[session_id].append({
            "user": user_input,
            "ai": ai_response,
            "timestamp": len(self.conversation_sessions[session_id])
        })
    
    def get_conversation_context(self, session_id: str) -> str:
        """대화 세션의 맥락 정보를 반환합니다."""
        if session_id not in self.conversation_sessions:
            return ""
        
        context = []
        recent_conversations = self.conversation_sessions[session_id][-3:]  # 최근 3개 대화만
        
        for conv in recent_conversations:
            context.append(f"사용자: {conv['user']}")
            context.append(f"황연걸: {conv['ai']}")
        
        return "\n".join(context) if context else ""
    
    def _split_text_into_chunks(self, text: str, chunk_size: int) -> List[str]:
        """텍스트를 청크로 나눕니다."""
        chunks = []
        for i in range(0, len(text), chunk_size):
            chunk = text[i:i + chunk_size]
            if chunk.strip():  # 빈 청크 제외
                chunks.append(chunk)
        return chunks
