@echo off
chcp 65001 >nul
echo 🔧 Ollama PATH 문제 자동 수정 도구
echo ==================================================

echo.
echo 🔍 Ollama 설치 경로 찾는 중...

set "OLLAMA_FOUND=0"
set "OLLAMA_PATH="

REM 일반적인 설치 경로들 확인
for %%p in (
    "C:\Users\%USERNAME%\AppData\Local\Programs\Ollama"
    "C:\Program Files\Ollama"
    "C:\Program Files (x86)\Ollama"
) do (
    if exist "%%~p\ollama.exe" (
        set "OLLAMA_PATH=%%~p"
        set "OLLAMA_FOUND=1"
        echo ✅ Ollama 발견: !OLLAMA_PATH!
        goto :found_ollama
    )
)

if %OLLAMA_FOUND% equ 0 (
    echo ❌ Ollama를 찾을 수 없습니다.
    echo.
    echo 📥 Ollama를 먼저 설치해주세요:
    echo 1. https://ollama.ai/download 에서 Windows용 다운로드
    echo 2. 다운로드한 파일 실행하여 설치
    echo 3. 설치 완료 후 이 스크립트를 다시 실행
    pause
    exit /b 1
)

:found_ollama
echo.
echo 🔧 PATH에 Ollama 경로 추가 중...

REM 현재 PATH에 이미 Ollama 경로가 있는지 확인
echo %PATH% | findstr /i "%OLLAMA_PATH%" >nul
if %errorlevel% equ 0 (
    echo ℹ️  Ollama 경로가 이미 PATH에 있습니다.
    goto :test_ollama
)

REM PATH에 Ollama 경로 추가
echo 현재 PATH: %PATH%
echo.
echo Ollama 경로 추가: %OLLAMA_PATH%
setx PATH "%PATH%;%OLLAMA_PATH%"
if %errorlevel% equ 0 (
    echo ✅ PATH 업데이트 완료!
    echo.
    echo ⚠️  중요: 새 명령 프롬프트 창을 열어야 변경사항이 적용됩니다.
    echo.
    echo 🔄 새 명령 프롬프트 창을 열고 ollama --version을 테스트해보세요.
) else (
    echo ❌ PATH 업데이트 실패
    echo.
    echo 🔧 수동으로 PATH를 추가하려면:
    echo 1. 시스템 속성 > 고급 > 환경 변수
    echo 2. PATH 변수 편집
    echo 3. 새로 만들기: %OLLAMA_PATH%
    pause
    exit /b 1
)

:test_ollama
echo.
echo 🧪 Ollama 테스트 중...
echo.
echo 현재 PATH에서 ollama 명령어 테스트:
where ollama 2>nul
if %errorlevel% equ 0 (
    echo ✅ ollama 명령어를 찾았습니다!
    echo.
    echo 🚀 Ollama 버전 확인:
    ollama --version
    if %errorlevel% equ 0 (
        echo.
        echo 🎉 Ollama가 정상적으로 작동합니다!
        echo.
        echo 다음 단계:
        echo 1. setup_local_ai.bat 실행
        echo 2. 또는 수동으로 ollama serve 실행
    ) else (
        echo ❌ Ollama 실행 실패
        echo.
        echo 🔧 문제 해결:
        echo 1. 컴퓨터 재시작
        echo 2. Ollama 재설치
        echo 3. 바이러스 백신 프로그램에서 Ollama 허용
    )
) else (
    echo ❌ ollama 명령어를 찾을 수 없습니다.
    echo.
    echo 🔧 해결 방법:
    echo 1. 새 명령 프롬프트 창 열기
    echo 2. 컴퓨터 재시작
    echo 3. PATH 환경 변수 수동 확인
)

echo.
pause
