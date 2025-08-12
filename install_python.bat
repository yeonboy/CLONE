@echo off
chcp 65001 >nul
echo ========================================
echo Python 설치 및 설정 스크립트
echo ========================================
echo.

echo 1단계: Python 설치 확인 중...
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Python이 이미 설치되어 있습니다.
    python --version
    goto :check_pip
)

echo ❌ Python이 설치되어 있지 않습니다.
echo.

echo 2단계: Python 다운로드 중...
echo Python 3.11.8 (안정 버전)을 다운로드합니다...
echo.

REM Python 3.11.8 다운로드 (Windows 64-bit)
set PYTHON_URL=https://www.python.org/ftp/python/3.11.8/python-3.11.8-amd64.exe
set PYTHON_INSTALLER=python-3.11.8-amd64.exe

echo 다운로드 URL: %PYTHON_URL%
echo.

REM curl을 사용하여 다운로드
curl -L -o "%PYTHON_INSTALLER%" "%PYTHON_URL%"

if not exist "%PYTHON_INSTALLER%" (
    echo ❌ Python 다운로드 실패
    echo.
    echo 수동 설치 방법:
    echo 1. https://www.python.org/downloads/ 에서 Python 3.11.8 다운로드
    echo 2. 설치 시 "Add Python to PATH" 체크박스 선택
    echo 3. "Install Now" 클릭
    echo.
    pause
    exit /b 1
)

echo ✅ Python 다운로드 완료
echo.

echo 3단계: Python 설치 중...
echo 설치 시 "Add Python to PATH" 체크박스를 반드시 선택해주세요!
echo.
pause

start /wait "" "%PYTHON_INSTALLER%" /quiet InstallAllUsers=1 PrependPath=1 Include_test=0

echo.
echo 4단계: 설치 완료 확인 중...
echo.

REM 새 PATH 환경변수로 새 명령 프롬프트 열기
echo Python 설치가 완료되었습니다.
echo 새 명령 프롬프트를 열어서 다음 명령어로 확인해주세요:
echo   python --version
echo   pip --version
echo.

echo 설치 파일 정리 중...
if exist "%PYTHON_INSTALLER%" del "%PYTHON_INSTALLER%"

echo.
echo ========================================
echo Python 설치 완료!
echo ========================================
echo.
echo 다음 단계:
echo 1. 새 명령 프롬프트를 열어주세요
echo 2. python --version 명령어로 설치 확인
echo 3. setup_local_ai.bat 실행
echo.
pause
