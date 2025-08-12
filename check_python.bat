@echo off
chcp 65001 >nul
echo ========================================
echo Python 설치 상태 확인
echo ========================================
echo.

echo 1. Python 명령어 확인:
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Python 사용 가능
    python --version
) else (
    echo ❌ Python 명령어를 찾을 수 없음
)

echo.
echo 2. Python3 명령어 확인:
python3 --version >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Python3 사용 가능
    python3 --version
) else (
    echo ❌ Python3 명령어를 찾을 수 없음
)

echo.
echo 3. py 명령어 확인:
py --version >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ py 명령어 사용 가능
    py --version
) else (
    echo ❌ py 명령어를 찾을 수 없음
)

echo.
echo 4. pip 명령어 확인:
pip --version >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ pip 사용 가능
    pip --version
) else (
    echo ❌ pip 명령어를 찾을 수 없음
)

echo.
echo 5. Python 설치 경로 확인:
echo Program Files:
dir "C:\Program Files\Python*" 2>nul | findstr "Python"
if %errorlevel% neq 0 echo   - Python 폴더 없음

echo.
echo AppData Local:
dir "C:\Users\%USERNAME%\AppData\Local\Programs\Python*" 2>nul | findstr "Python"
if %errorlevel% neq 0 echo   - Python 폴더 없음

echo.
echo 6. PATH 환경변수에서 Python 확인:
echo %PATH% | findstr /i "python"
if %errorlevel% == 0 (
    echo ✅ PATH에 Python 경로 포함됨
) else (
    echo ❌ PATH에 Python 경로 없음
)

echo.
echo ========================================
echo 확인 완료
echo ========================================
echo.
if exist "install_python.bat" (
    echo Python이 설치되어 있지 않다면 install_python.bat을 실행하세요.
) else (
    echo Python 설치가 필요합니다.
    echo https://www.python.org/downloads/ 에서 다운로드하세요.
)
echo.
pause
