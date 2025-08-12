#!/usr/bin/env python3
"""
로컬 AI 모델 설치 및 초기화 스크립트
"""

import subprocess
import sys
import os
import requests
import time

def check_python_version():
    """Python 버전을 확인합니다."""
    if sys.version_info < (3, 8):
        print("❌ Python 3.8 이상이 필요합니다.")
        sys.exit(1)
    print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor} 확인됨")

def install_requirements():
    """필요한 Python 패키지들을 설치합니다."""
    print("📦 Python 패키지 설치 중...")
    try:
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], check=True)
        print("✅ Python 패키지 설치 완료")
    except subprocess.CalledProcessError as e:
        print(f"❌ Python 패키지 설치 실패: {e}")
        sys.exit(1)

def check_ollama():
    """Ollama가 설치되어 있는지 확인합니다."""
    print("🔍 Ollama 설치 확인 중...")
    
    # Windows에서 Ollama 설치 확인
    try:
        result = subprocess.run(["ollama", "--version"], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ Ollama 이미 설치됨: {result.stdout.strip()}")
            return True
    except FileNotFoundError:
        pass
    
    print("❌ Ollama가 설치되지 않았습니다.")
    print("📥 https://ollama.ai/download 에서 Ollama를 다운로드하여 설치하세요.")
    print("   또는 다음 명령어로 설치할 수 있습니다:")
    print("   winget install Ollama.Ollama")
    
    return False

def start_ollama_service():
    """Ollama 서비스를 시작합니다."""
    print("🚀 Ollama 서비스 시작 중...")
    try:
        # 백그라운드에서 Ollama 시작
        subprocess.Popen(["ollama", "serve"], 
                        stdout=subprocess.DEVNULL, 
                        stderr=subprocess.DEVNULL)
        
        # 서비스가 시작될 때까지 대기
        for i in range(30):
            try:
                response = requests.get("http://localhost:11434/api/tags", timeout=5)
                if response.status_code == 200:
                    print("✅ Ollama 서비스 시작 완료")
                    return True
            except:
                pass
            time.sleep(1)
            print(f"   대기 중... ({i+1}/30)")
        
        print("❌ Ollama 서비스 시작 실패")
        return False
        
    except Exception as e:
        print(f"❌ Ollama 서비스 시작 중 오류: {e}")
        return False

def download_llama_model():
    """Llama 3.1 8B 모델을 다운로드합니다."""
    print("📥 Llama 3.1 8B 모델 다운로드 중...")
    try:
        response = requests.post(
            "http://localhost:11434/api/pull",
            json={"name": "llama3.1:8b"},
            stream=True
        )
        
        if response.status_code == 200:
            print("✅ 모델 다운로드 완료")
            return True
        else:
            print(f"❌ 모델 다운로드 실패: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ 모델 다운로드 중 오류: {e}")
        return False

def create_env_file():
    """환경 변수 파일을 생성합니다."""
    print("📝 환경 변수 파일 생성 중...")
    
    env_content = """# AI 서비스 설정
LOCAL_AI_ENABLED=true

# Ollama 설정
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL_NAME=llama3.1:8b

# 임베딩 모델 설정
EMBEDDING_MODEL_NAME=sentence-transformers/all-MiniLM-L6-v2

# ChromaDB 설정
CHROMA_DB_PATH=./chroma_db
"""
    
    try:
        with open(".env", "w", encoding="utf-8") as f:
            f.write(env_content)
        print("✅ .env 파일 생성 완료")
    except Exception as e:
        print(f"❌ .env 파일 생성 실패: {e}")

def main():
    """메인 실행 함수"""
    print("🤖 로컬 AI 모델 설치 및 초기화 시작")
    print("=" * 50)
    
    # 1. Python 버전 확인
    check_python_version()
    
    # 2. Python 패키지 설치
    install_requirements()
    
    # 3. Ollama 설치 확인
    if not check_ollama():
        print("\n💡 Ollama를 설치한 후 다시 실행하세요.")
        return
    
    # 4. Ollama 서비스 시작
    if not start_ollama_service():
        print("\n💡 Ollama 서비스를 수동으로 시작한 후 다시 실행하세요.")
        return
    
    # 5. 모델 다운로드
    download_llama_model()
    
    # 6. 환경 변수 파일 생성
    create_env_file()
    
    print("\n" + "=" * 50)
    print("🎉 로컬 AI 모델 설정 완료!")
    print("\n다음 단계:")
    print("1. 백엔드 서버 시작: python -m uvicorn app.main:app --reload")
    print("2. 기억 초기화: POST /initialize-memories")
    print("3. AI 상태 확인: GET /ai-status")
    print("\n문제가 있으면 다음을 확인하세요:")
    print("- Ollama가 실행 중인지 확인")
    print("- 방화벽 설정")
    print("- 포트 11434가 사용 가능한지 확인")

if __name__ == "__main__":
    main()
