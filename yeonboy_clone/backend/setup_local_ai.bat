@echo off
chcp 65001 >nul
echo 🤖 로컬 AI 모델 설치 및 초기화 시작
echo ==================================================

echo.
echo �� Ollama 설치 확인 중...

REM 여러 경로에서 Ollama 찾기 시도
set OLLAMA_FOUND=0

REM 1. PATH에서 확인
ollama --version >nul 2>&1
if %errorlevel% equ 0 (
    set OLLAMA_FOUND=1
    echo ✅ Ollama가 PATH에서 발견됨
    goto :ollama_found
)

REM 2. 기본 설치 경로 확인
if exist "C:\Users\%USERNAME%\AppData\Local\Programs\Ollama\ollama.exe" (
    set OLLAMA_FOUND=1
    set "PATH=%PATH%;C:\Users\%USERNAME%\AppData\Local\Programs\Ollama"
    echo ✅ Ollama가 기본 경로에서 발견됨
    goto :ollama_found
)

REM 3. Program Files 확인
if exist "C:\Program Files\Ollama\ollama.exe" (
    set OLLAMA_FOUND=1
    set "PATH=%PATH%;C:\Program Files\Ollama"
    echo ✅ Ollama가 Program Files에서 발견됨
    goto :ollama_found
)

REM 4. Program Files (x86) 확인
if exist "C:\Program Files (x86)\Ollama\ollama.exe" (
    set OLLAMA_FOUND=1
    set "PATH=%PATH%;C:\Program Files (x86)\Ollama"
    echo ✅ Ollama가 Program Files (x86)에서 발견됨
    goto :ollama_found
)

REM 5. winget으로 설치된 경우 확인
winget list Ollama.Ollama >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Ollama가 winget으로 설치됨 (PATH 재설정 필요)
    echo.
    echo 🔄 PATH 재설정 중...
    for /f "tokens=*" %%i in ('where ollama 2^>nul') do (
        set "OLLAMA_PATH=%%i"
        echo Ollama 경로: !OLLAMA_PATH!
        goto :ollama_found
    )
)

if %OLLAMA_FOUND% equ 0 (
    echo ❌ Ollama가 설치되지 않았습니다.
    echo.
    echo 📥 Ollama 설치 방법:
    echo.
    echo 방법 1: 공식 웹사이트에서 설치
    echo 1. https://ollama.ai/download 에서 Windows용 Ollama 다운로드
    echo 2. 다운로드한 파일 실행하여 설치
    echo 3. 설치 완료 후 컴퓨터 재시작
    echo.
    echo 방법 2: winget으로 설치
    echo 1. 관리자 권한으로 PowerShell 실행
    echo 2. 다음 명령어 실행: winget install Ollama.Ollama
    echo 3. 설치 완료 후 컴퓨터 재시작
    echo.
    echo 방법 3: Chocolatey로 설치
    echo 1. Chocolatey 설치 (https://chocolatey.org/install)
    echo 2. 다음 명령어 실행: choco install ollama
    echo 3. 설치 완료 후 컴퓨터 재시작
    echo.
    echo ⚠️  중요: 설치 후 반드시 컴퓨터를 재시작하세요!
    echo.
    echo 설치 완료 후 이 스크립트를 다시 실행하세요.
    pause
    exit /b 1
)

:ollama_found
echo.
echo 🔍 Ollama 버전 확인 중...
ollama --version
if %errorlevel% neq 0 (
    echo ❌ Ollama 실행 실패
    echo.
    echo 🔧 문제 해결 방법:
    echo 1. 컴퓨터 재시작
    echo 2. Ollama 재설치
    echo 3. 바이러스 백신 프로그램에서 Ollama 허용
    echo 4. Windows Defender에서 Ollama 허용
    pause
    exit /b 1
)

echo.
echo 🚀 Ollama 서비스 시작 중...
start /B ollama serve

echo.
echo ⏳ Ollama 서비스 시작 대기 중... (최대 30초)
for /L %%i in (1,1,30) do (
    timeout /t 1 /nobreak >nul
    echo    대기 중... (%%i/30)
)

echo.
echo 🔍 Ollama 서비스 상태 확인 중...
curl -s http://localhost:11434/api/tags >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Ollama 서비스가 아직 시작되지 않았습니다.
    echo    잠시 더 기다린 후 계속합니다...
    timeout /t 10 /nobreak >nul
)

echo.
echo 📦 Python 패키지 설치 중...
python -m pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ❌ Python 패키지 설치 실패
    pause
    exit /b 1
)

echo ✅ Python 패키지 설치 완료

echo.
echo 📥 Llama 3.1 8B 모델 다운로드 중...
ollama pull llama3.1:8b
if %errorlevel% neq 0 (
    echo ❌ 모델 다운로드 실패
    echo.
    echo 🔧 문제 해결 방법:
    echo 1. 인터넷 연결 확인
    echo 2. 방화벽 설정 확인
    echo 3. Ollama 서비스 재시작
    pause
    exit /b 1
)

echo ✅ 모델 다운로드 완료

echo.
echo 📝 환경 변수 파일 생성 중...
(
echo # AI 서비스 설정
echo LOCAL_AI_ENABLED=true
echo.
echo # Ollama 설정
echo OLLAMA_BASE_URL=http://localhost:11434
echo OLLAMA_MODEL_NAME=llama3.1:8b
echo.
echo # 임베딩 모델 설정
echo EMBEDDING_MODEL_NAME=sentence-transformers/all-MiniLM-L6-v2
echo.
echo # ChromaDB 설정
echo CHROMA_DB_PATH=./chroma_db
) > .env

echo ✅ .env 파일 생성 완료

echo.
echo ==================================================
echo 🎉 로컬 AI 모델 설정 완료!
echo.
echo 다음 단계:
echo 1. 백엔드 서버 시작: python -m uvicorn app.main:app --reload
echo 2. 기억 초기화: POST /initialize-memories
echo 3. AI 상태 확인: GET /ai-status
echo.
echo 문제가 있으면 다음을 확인하세요:
echo - Ollama가 실행 중인지 확인
echo - 방화벽 설정
echo - 포트 11434가 사용 가능한지 확인
echo.
pause
