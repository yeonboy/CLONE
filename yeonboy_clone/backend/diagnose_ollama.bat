@echo off
chcp 65001 >nul
echo 🔍 Ollama 설치 진단 도구
echo ==================================================

echo.
echo 📋 시스템 정보:
echo OS: %OS%
echo USERNAME: %USERNAME%
echo PATH: %PATH%

echo.
echo 🔍 Ollama 설치 상태 확인 중...

REM 1. PATH에서 ollama 명령어 확인
echo.
echo 1️⃣ PATH에서 ollama 명령어 확인:
where ollama 2>nul
if %errorlevel% equ 0 (
    echo ✅ ollama 명령어를 PATH에서 찾았습니다.
    for /f "tokens=*" %%i in ('where ollama 2^>nul') do (
        echo    경로: %%i
    )
) else (
    echo ❌ PATH에서 ollama 명령어를 찾을 수 없습니다.
)

REM 2. 일반적인 설치 경로 확인
echo.
echo 2️⃣ 일반적인 설치 경로 확인:
set "INSTALL_PATHS=C:\Users\%USERNAME%\AppData\Local\Programs\Ollama;C:\Program Files\Ollama;C:\Program Files (x86)\Ollama"
for %%p in (%INSTALL_PATHS%) do (
    if exist "%%p\ollama.exe" (
        echo ✅ 발견: %%p\ollama.exe
        set "FOUND_PATH=%%p"
    )
)

REM 3. winget으로 설치된 패키지 확인
echo.
echo 3️⃣ winget 패키지 확인:
winget list Ollama.Ollama 2>nul
if %errorlevel% equ 0 (
    echo ✅ Ollama가 winget으로 설치되어 있습니다.
) else (
    echo ❌ winget에서 Ollama를 찾을 수 없습니다.
)

REM 4. 프로세스 확인
echo.
echo 4️⃣ 실행 중인 Ollama 프로세스 확인:
tasklist /FI "IMAGENAME eq ollama.exe" 2>nul
if %errorlevel% equ 0 (
    echo ✅ Ollama 프로세스가 실행 중입니다.
) else (
    echo ❌ 실행 중인 Ollama 프로세스가 없습니다.
)

REM 5. 포트 사용 확인
echo.
echo 5️⃣ 포트 11434 사용 확인:
netstat -an | findstr :11434
if %errorlevel% equ 0 (
    echo ✅ 포트 11434가 사용 중입니다.
) else (
    echo ❌ 포트 11434가 사용되지 않고 있습니다.
)

REM 6. 방화벽 규칙 확인
echo.
echo 6️⃣ Windows 방화벽 규칙 확인:
netsh advfirewall firewall show rule name="Ollama" 2>nul
if %errorlevel% equ 0 (
    echo ✅ Ollama 방화벽 규칙이 있습니다.
) else (
    echo ❌ Ollama 방화벽 규칙이 없습니다.
)

echo.
echo ==================================================
echo 📝 진단 결과 및 해결 방법:
echo.

if defined FOUND_PATH (
    echo ✅ Ollama가 설치되어 있습니다: %FOUND_PATH%
    echo.
    echo 🔧 해결 방법:
    echo 1. PATH에 Ollama 경로 추가:
    echo    setx PATH "%PATH%;%FOUND_PATH%"
    echo 2. 새 명령 프롬프트 창을 열어서 다시 시도
    echo 3. 또는 컴퓨터 재시작
) else (
    echo ❌ Ollama가 설치되지 않았습니다.
    echo.
    echo 📥 설치 방법:
    echo 1. https://ollama.ai/download 에서 Windows용 다운로드
    echo 2. 다운로드한 파일 실행하여 설치
    echo 3. 설치 완료 후 컴퓨터 재시작
    echo.
    echo 또는 winget으로 설치:
    echo winget install Ollama.Ollama
)

echo.
echo 🔍 추가 진단이 필요하면:
echo 1. 이 스크립트를 관리자 권한으로 실행
echo 2. Ollama 공식 문서 참조: https://ollama.ai/docs
echo 3. GitHub Issues 확인: https://github.com/ollama/ollama/issues
echo.
pause
