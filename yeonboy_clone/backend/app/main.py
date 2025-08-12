import logging
from dotenv import load_dotenv
import base64
import io
from PIL import Image
import speech_recognition as sr
from pydub import AudioSegment
import tempfile
import os

# .env 파일에서 환경 변수를 로드합니다.
# 이 코드는 다른 모듈이 환경 변수를 사용하기 전에 실행되어야 합니다.
load_dotenv()

from fastapi import FastAPI, BackgroundTasks, HTTPException, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from .api.schemas import ProcessMessageRequest
from .services.chat_processor import process_user_message
# Firebase 초기화 - 로컬 AI 모드에서는 선택적
# from .db.firebase_admin import initialize_firebase
from .ai_core.ai_service_factory import AIServiceFactory
import os
from pydantic import BaseModel

app = FastAPI(
    title="Hwang Yeon Geol AI Clone Backend",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# 한국어 인코딩을 위한 미들웨어 추가
from fastapi.middleware.gzip import GZipMiddleware
app.add_middleware(GZipMiddleware)

# CORS 미들웨어 추가
# 프론트엔드 개발 서버의 주소를 허용해야 합니다.
origins = [
    # Vite 개발 서버
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    # Vite가 다른 포트로 바인딩될 수 있음 (예: 5175)
    "http://localhost:5175",
    "http://127.0.0.1:5175",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    # CRA 등
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    """
    애플리케이션 시작 시 초기화를 수행합니다.
    """
    logging.info("Application startup complete. Local AI mode enabled.")

@app.get("/health", tags=["System"])
def health_check():
    return {"status": "ok"}

@app.get("/ai-status", tags=["AI"])
def get_ai_status():
    """현재 AI 서비스 상태를 확인합니다."""
    try:
        service_type = AIServiceFactory.get_service_type()
        return {
            "status": "ok",
            "service_type": service_type,
            "local_ai_enabled": os.getenv("LOCAL_AI_ENABLED", "true").lower() == "true"
        }
    except Exception as e:
        logging.error(f"AI 상태 확인 실패: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/initialize-memories", tags=["AI"])
async def initialize_memories():
    """카카오톡 대화 파일들로부터 초기 기억을 생성합니다."""
    try:
        # 카카오톡 대화 파일 경로들 (AI_feed 폴더 기준)
        kakao_files = [
            "../AI_feed/KakaoTalk_20250807_0213_42_770_친구.txt",
            "../AI_feed/KakaoTalk_20250807_0214_27_006_연인2.txt", 
            "../AI_feed/KakaoTalk_20250807_0214_49_203_연인1.txt",
            "../AI_feed/KakaoTalk_20250807_0215_09_157_직장 동료.txt",
            "../AI_feed/KakaoTalk_20250807_0215_09_157_직장상사.txt",
            "../AI_feed/KakaoTalk_20250810_2103_00_460_박시연.txt",
            "../AI_feed/KakaoTalk_20250810_2103_44_445_김상진.txt",
            "../AI_feed/KakaoTalk_20250810_2103_55_392_성균.txt"
        ]
        
        # 로컬 AI 서비스가 활성화된 경우에만 실행
        if AIServiceFactory.get_service_type() == "local":
            ai_service = AIServiceFactory.create_ai_service()
            ai_service.initialize_memories_from_files(kakao_files)
            return {"status": "memories_initialized", "files_processed": len(kakao_files)}
        else:
            return {"status": "skipped", "reason": "Local AI not enabled"}
            
    except Exception as e:
        logging.error(f"기억 초기화 실패: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/process-message", status_code=202, tags=["AI"])
async def handle_process_message(
    request: ProcessMessageRequest,
    background_tasks: BackgroundTasks,
):
    """
    Cloud Function에서 오는 새 메시지 처리 요청을 받아 백그라운드에서 실행합니다.
    AI 처리 파이프라인은 시간이 걸릴 수 있으므로, 즉시 202 Accepted 응답을 반환합니다.
    """
    background_tasks.add_task(
        process_user_message,
        conversation_id=request.conversationId,
        message_id=request.messageId,
        message_data=request.messageData,
    )
    return {"status": "processing_started"}

# ----- 동기식 채팅 엔드포인트 -----
class ChatSyncRequest(BaseModel):
    text: str
    session_id: str | None = None

class ChatSyncResponse(BaseModel):
    reply: str

@app.post("/chat-sync", response_model=ChatSyncResponse, tags=["AI"])
def chat_sync(request: ChatSyncRequest):
    """간단한 동기식 채팅 엔드포인트. 프론트엔드에서 바로 호출해 응답을 받습니다."""
    try:
        ai_service = AIServiceFactory.create_ai_service()
        # 향상된 메모리 검색 사용
        memories = ai_service.enhance_memory_search(request.text)
        
        # 말투 리포트 기반 시스템 프롬프트 (외부 보고서 + 규칙)
        system_prompt = (
            "당신은 황연걸(Hwang Yeon Geol)입니다. 한국어로 대화합니다.\n"
            "[캐릭터] 친근하고 편안한 친구 같은 톤. 과장 없이 담백하되 가끔 짧은 농담.\n"
            "[스타일] 짧고 명료(2~3문장 중심), 불필요한 수식어 최소화. 이모지는 사용하지 않음.\n"
            "[금지] 공격적/비속어 과다, 과한 텐션, 과도한 영어 혼용.\n"
            "[맥락] 과거 대화를 참고해 호응하고, 모르면 솔직히 모른다고 말하고 다음 질문을 유도.\n"
            "[종결어미] 구어체지만 부드럽게: '~해', '~해볼까', '~같아', 상황에 맞게 '~하자'.\n"
            "[톤 유지] 이전 발화와 말투 일치. 같은 질문엔 일관된 답변.\n"
        )
        
        # 세션 ID: 프론트에서 전달되면 사용, 없으면 기본값
        session_id = request.session_id or "default"
        
        reply = ai_service.generate_response(
            system_prompt=system_prompt,
            user_input=request.text,
            memories=memories,
            session_id=session_id
        )
        return ChatSyncResponse(reply=reply)
    except Exception as e:
        logging.error(f"채팅 응답 생성 실패: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ----- 음성 처리 엔드포인트 -----
class VoiceToTextRequest(BaseModel):
    audio_data: str  # base64 인코딩된 오디오 데이터

class VoiceToTextResponse(BaseModel):
    text: str
    confidence: float

@app.post("/voice-to-text", response_model=VoiceToTextResponse, tags=["Voice"])
async def convert_voice_to_text(request: VoiceToTextRequest):
    """음성 파일을 텍스트로 변환합니다."""
    try:
        # base64 디코딩
        audio_bytes = base64.b64decode(request.audio_data)
        
        # 임시 파일로 저장
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
            temp_file.write(audio_bytes)
            temp_file_path = temp_file.name
        
        try:
            # 음성 인식
            recognizer = sr.Recognizer()
            with sr.AudioFile(temp_file_path) as source:
                audio = recognizer.record(source)
                text = recognizer.recognize_google(audio, language="ko-KR")
                confidence = 0.8  # Google Speech-to-Text는 confidence를 제공하지 않음
                
                return VoiceToTextResponse(text=text, confidence=confidence)
        finally:
            # 임시 파일 삭제
            os.unlink(temp_file_path)
            
    except Exception as e:
        logging.error(f"음성-텍스트 변환 실패: {e}")
        raise HTTPException(status_code=500, detail=f"음성 인식 실패: {str(e)}")

@app.post("/upload-audio", tags=["Voice"])
async def upload_audio(audio_file: UploadFile = File(...)):
    """음성 파일을 업로드하고 처리합니다."""
    try:
        # 파일 검증
        if not audio_file.content_type.startswith('audio/'):
            raise HTTPException(status_code=400, detail="음성 파일만 업로드 가능합니다.")
        
        # 파일 저장
        upload_dir = "uploads/audio"
        os.makedirs(upload_dir, exist_ok=True)
        
        file_path = os.path.join(upload_dir, f"{audio_file.filename}")
        with open(file_path, "wb") as buffer:
            content = await audio_file.read()
            buffer.write(content)
        
        return {
            "status": "success",
            "filename": audio_file.filename,
            "file_path": file_path,
            "file_size": len(content)
        }
        
    except Exception as e:
        logging.error(f"음성 파일 업로드 실패: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ----- 이미지 처리 엔드포인트 -----
class ImageAnalysisRequest(BaseModel):
    image_data: str  # base64 인코딩된 이미지 데이터
    prompt: str = "이 이미지에 대해 설명해주세요."

class ImageAnalysisResponse(BaseModel):
    description: str
    analysis: str

@app.post("/analyze-image", response_model=ImageAnalysisResponse, tags=["Image"])
async def analyze_image(request: ImageAnalysisRequest):
    """이미지를 분석하고 설명을 생성합니다."""
    try:
        # base64 디코딩
        image_bytes = base64.b64decode(request.image_data)
        
        # PIL로 이미지 열기
        image = Image.open(io.BytesIO(image_bytes))
        
        # 이미지 정보 추출
        width, height = image.size
        format_info = image.format
        mode_info = image.mode
        
        # 기본 이미지 설명
        description = f"이미지 크기: {width}x{height} 픽셀, 형식: {format_info}, 색상 모드: {mode_info}"
        
        # AI 서비스를 통한 이미지 분석 (향후 구현)
        ai_service = AIServiceFactory.create_ai_service()
        analysis = f"사용자 요청: {request.prompt}\n\n{description}\n\n이미지 분석 기능은 현재 개발 중입니다."
        
        return ImageAnalysisResponse(description=description, analysis=analysis)
        
    except Exception as e:
        logging.error(f"이미지 분석 실패: {e}")
        raise HTTPException(status_code=500, detail=f"이미지 분석 실패: {str(e)}")

@app.post("/upload-image", tags=["Image"])
async def upload_image(
    image_file: UploadFile = File(...),
    description: str = Form("")
):
    """이미지 파일을 업로드하고 처리합니다."""
    try:
        # 파일 검증
        if not image_file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="이미지 파일만 업로드 가능합니다.")
        
        # 파일 저장
        upload_dir = "uploads/images"
        os.makedirs(upload_dir, exist_ok=True)
        
        file_path = os.path.join(upload_dir, f"{image_file.filename}")
        with open(file_path, "wb") as buffer:
            content = await image_file.read()
            buffer.write(content)
        
        # 이미지 메타데이터 추출
        image = Image.open(file_path)
        metadata = {
            "width": image.size[0],
            "height": image.size[1],
            "format": image.format,
            "mode": image.mode,
            "size_bytes": len(content)
        }
        
        return {
            "status": "success",
            "filename": image_file.filename,
            "file_path": file_path,
            "metadata": metadata,
            "description": description
        }
        
    except Exception as e:
        logging.error(f"이미지 파일 업로드 실패: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ----- 파일 처리 엔드포인트 -----
@app.post("/upload-file", tags=["File"])
async def upload_file(
    file: UploadFile = File(...),
    description: str = Form("")
):
    """일반 파일을 업로드하고 처리합니다."""
    try:
        # 파일 저장
        upload_dir = "uploads/files"
        os.makedirs(upload_dir, exist_ok=True)
        
        file_path = os.path.join(upload_dir, f"{file.filename}")
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        return {
            "status": "success",
            "filename": file.filename,
            "file_path": file_path,
            "file_size": len(content),
            "content_type": file.content_type,
            "description": description
        }
        
    except Exception as e:
        logging.error(f"파일 업로드 실패: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/download/{file_type}/{filename}", tags=["File"])
async def download_file(file_type: str, filename: str):
    """업로드된 파일을 다운로드합니다."""
    try:
        file_path = f"uploads/{file_type}/{filename}"
        
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="파일을 찾을 수 없습니다.")
        
        return FileResponse(
            path=file_path,
            filename=filename,
            media_type='application/octet-stream'
        )
        
    except Exception as e:
        logging.error(f"파일 다운로드 실패: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# 서버 실행 코드 추가
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8080, log_level="info")