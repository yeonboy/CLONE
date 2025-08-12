# Hwang Yeon Geol AI Clone

황연걸 AI 클론 프로젝트 - 로컬 AI 모델을 사용한 대화형 AI 시스템

## 🚀 주요 기능

- **로컬 AI 모델**: Ollama + Llama 3.1 8B 기반
- **벡터 검색**: ChromaDB를 사용한 RAG (Retrieval-Augmented Generation)
- **대화 기억**: 카카오톡 대화 기록을 기반으로 한 개인화된 응답
- **FastAPI 백엔드**: 비동기 처리 및 RESTful API
- **React + TypeScript 프론트엔드**: 모던 웹 애플리케이션
- **고급 채팅 기능**: 음성 메시지, 이미지 분석, 파일 업로드 지원

## 🖥️ 시스템 요구사항

### 최소 사양
- **CPU**: AMD 라이젠 5 7500F 이상
- **GPU**: RTX 5070 12GB 이상 (CUDA 지원)
- **RAM**: 32GB 이상
- **저장공간**: 50GB 이상 (AI 모델 포함)

### 권장 사양
- **GPU**: RTX 5070 12GB 이상
- **RAM**: 64GB 이상
- **SSD**: NVMe SSD 권장

## 📦 설치 방법

### 1. Ollama 설치

#### Windows
```bash
# winget 사용
winget install Ollama.Ollama

# 또는 수동 설치
# https://ollama.ai/download 에서 Windows용 다운로드
```

#### macOS
```bash
# Homebrew 사용
brew install ollama

# 또는 수동 설치
# https://ollama.ai/download 에서 macOS용 다운로드
```

#### Linux
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

### 2. 프로젝트 설정

```bash
# 프로젝트 클론
git clone <repository-url>
cd yeonboy_clone

# 백엔드 디렉토리로 이동
cd backend

# 가상환경 생성 (선택사항)
python -m venv .venv
source .venv/bin/activate  # Linux/macOS
# 또는
.venv\Scripts\activate  # Windows

# 자동 설정 스크립트 실행
# Windows
setup_local_ai.bat

# Linux/macOS
python setup_local_ai.py
```

### 3. 프론트엔드 설정

```bash
# 프론트엔드 디렉토리로 이동
cd frontend

# 의존성 설치
npm install
```

### 4. 수동 설정 (선택사항)

```bash
# Python 패키지 설치
pip install -r requirements.txt

# 환경 변수 설정
cp env.example .env
# .env 파일을 편집하여 필요한 설정 수정

# Ollama 모델 다운로드
ollama pull llama3.1:8b
```

## 🚀 실행 방법

### 1. Ollama 서비스 시작

```bash
# 새 터미널에서
ollama serve
```

### 2. 백엔드 서버 시작

```bash
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8080
```

### 3. 프론트엔드 시작

```bash
cd frontend
npm run dev
```

## 🔧 API 엔드포인트

### 시스템 상태
- `GET /health` - 서버 상태 확인
- `GET /ai-status` - AI 서비스 상태 확인

### AI 서비스
- `POST /initialize-memories` - 카카오톡 대화 기록으로 기억 초기화
- `POST /chat-sync` - 동기식 채팅 메시지 처리

### 음성 서비스
- `POST /voice-to-text` - 음성을 텍스트로 변환
- `POST /upload-audio` - 음성 파일 업로드

### 이미지 서비스
- `POST /analyze-image` - 이미지 분석
- `POST /upload-image` - 이미지 파일 업로드

### 파일 서비스
- `POST /upload-file` - 일반 파일 업로드
- `GET /download/{file_type}/{filename}` - 파일 다운로드

## 📁 프로젝트 구조

```
yeonboy_clone/
├── backend/                 # FastAPI 백엔드
│   ├── app/
│   │   ├── ai_core/        # AI 서비스 (로컬/클라우드)
│   │   ├── api/            # API 스키마 및 라우터
│   │   ├── db/             # 데이터베이스 연결
│   │   ├── services/       # 비즈니스 로직
│   │   └── main.py         # 메인 애플리케이션
│   ├── requirements.txt     # Python 의존성
│   └── setup_local_ai.py   # 자동 설정 스크립트
├── frontend/                # React + TypeScript 프론트엔드
│   ├── src/
│   │   ├── components/     # UI 컴포넌트
│   │   │   ├── AdvancedChatInput.tsx      # 고급 채팅 입력
│   │   │   ├── AdvancedMessageBubble.tsx  # 고급 메시지 표시
│   │   │   ├── VoiceRecorder.tsx          # 음성 녹음
│   │   │   ├── ImageUploader.tsx          # 이미지 업로드
│   │   │   └── FaceAvatar.tsx             # 아바타 표시
│   │   ├── screens/        # 화면 컴포넌트
│   │   ├── services/       # API 서비스
│   │   │   └── AdvancedChatService.ts     # 고급 채팅 서비스
│   │   ├── types/          # TypeScript 타입 정의
│   │   └── styles/         # 스타일 정의
│   └── package.json
└── README.md
```

## 🎨 프론트엔드 기능

### 고급 채팅 기능
- **텍스트 메시지**: 일반적인 텍스트 채팅
- **음성 메시지**: 음성 녹음 및 텍스트 변환
- **이미지 메시지**: 이미지 업로드 및 AI 분석
- **파일 메시지**: 다양한 파일 형식 지원
- **실시간 상태**: 연결 상태, 로딩 상태 표시

### UI/UX 특징
- **반응형 디자인**: 다양한 화면 크기 지원
- **모던 인터페이스**: 직관적이고 아름다운 UI
- **애니메이션**: 부드러운 전환 효과
- **접근성**: 키보드 네비게이션 및 스크린 리더 지원

## 🤖 AI 모델 정보

### LLM 모델
- **모델**: Llama 3.1 8B
- **제공자**: Meta
- **특징**: 한국어 지원, 로컬 실행
- **메모리 사용량**: ~8GB VRAM

### 임베딩 모델
- **모델**: all-MiniLM-L6-v2
- **제공자**: Sentence Transformers
- **특징**: 다국어 지원, 경량화
- **메모리 사용량**: ~1GB RAM

### 벡터 데이터베이스
- **데이터베이스**: ChromaDB
- **특징**: 로컬 실행, DuckDB 기반
- **저장 위치**: `./chroma_db`

## 🔄 모드 전환

### 로컬 모드 (기본값)
```bash
# .env 파일에서
LOCAL_AI_ENABLED=true
```

### 클라우드 모드
```bash
# .env 파일에서
LOCAL_AI_ENABLED=false
# GCP 관련 환경 변수 설정 필요
```

## 🐛 문제 해결

### Ollama 연결 오류
```bash
# Ollama 서비스 상태 확인
ollama list

# 서비스 재시작
ollama serve
```

### Windows에서 Ollama 설치 문제
Windows에서 Ollama가 설치되었지만 `ollama` 명령어를 찾을 수 없는 경우:

1. **진단 도구 실행**:
   ```bash
   # 백엔드 디렉토리에서
   diagnose_ollama.bat
   ```

2. **PATH 자동 수정**:
   ```bash
   # 백엔드 디렉토리에서
   fix_ollama_path.bat
   ```

3. **수동 PATH 추가**:
   - 시스템 속성 > 고급 > 환경 변수
   - PATH 변수 편집
   - 새로 만들기: `C:\Users\%USERNAME%\AppData\Local\Programs\Ollama`
   - 또는: `C:\Program Files\Ollama`

4. **설치 확인**:
   ```bash
   # winget으로 설치된 경우
   winget list Ollama.Ollama
   
   # 수동 설치 확인
   dir "C:\Users\%USERNAME%\AppData\Local\Programs\Ollama"
   ```

5. **재시작 후 테스트**:
   ```bash
   # 새 명령 프롬프트에서
   ollama --version
   ```

### 메모리 부족 오류
```bash
# 더 작은 모델 사용
ollama pull llama3.1:3b

# .env 파일에서 모델명 변경
OLLAMA_MODEL_NAME=llama3.1:3b
```

### 포트 충돌
```bash
# 다른 포트 사용
OLLAMA_BASE_URL=http://localhost:11435
```

### 프론트엔드 빌드 오류
```bash
# 의존성 재설치
cd frontend
rm -rf node_modules package-lock.json
npm install

# TypeScript 오류 확인
npm run build
```

## 📊 성능 최적화

### GPU 가속
```bash
# CUDA 지원 확인
nvidia-smi

# Ollama에서 GPU 사용
OLLAMA_HOST=0.0.0.0:11434
```

### 메모리 최적화
```bash
# ChromaDB 메모리 제한
CHROMA_DB_PATH=./chroma_db
CHROMA_DB_IMPL=duckdb+parquet
```

## 🧪 테스트

### 백엔드 테스트
```bash
cd backend
python -m pytest tests/
```

### 프론트엔드 테스트
```bash
cd frontend
npm test
```

### E2E 테스트
```bash
# 브라우저에서 http://localhost:5173 접속
# 채팅 기능 테스트
```

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 지원

문제가 있거나 질문이 있으시면 이슈를 생성해 주세요.

---

**참고**: 이 프로젝트는 교육 및 연구 목적으로 제작되었습니다.
