# Yeonboy Clone

## 로컬 실행

### Backend (FastAPI)
```bash
# Windows PowerShell
cd yeonboy_clone/backend
python -m venv .venv
. .venv/Scripts/Activate.ps1
pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8080 --reload
```

- Health: `GET http://127.0.0.1:8080/health`
- AI Status: `GET http://127.0.0.1:8080/ai-status`

### Frontend (Vite + React)
```bash
cd yeonboy_clone/frontend
npm ci
npm run dev
```
- 개발 프록시가 `/api` → `http://127.0.0.1:8080`로 전달됩니다.

## 배포(프론트)
정적 호스팅(Netlify/Vercel/GitHub Pages 등) 가능.

1) 프로덕션 환경변수 파일 생성
```
# yeonboy_clone/frontend/.env.production
VITE_API_BASE_URL=https://<배포된-백엔드-주소>
```

2) 빌드
```bash
cd yeonboy_clone/frontend
npm run build
```
- 산출물: `yeonboy_clone/frontend/dist`

3) 업로드/배포
- Netlify/Vercel: Publish Directory에 `frontend/dist` 지정
- GitHub Pages: `frontend/dist`를 Pages로 서빙

## 백엔드 CORS
배포한 프론트 도메인을 `yeonboy_clone/backend/app/main.py`의 `origins` 목록에 추가하세요.

## 포함/제외(.gitignore 요약)
- 포함: `backend/app/**`, `backend/requirements.txt`, `frontend/**`, `README.md`
- 제외: `**/node_modules/`, `backend/.venv/`, `backend/uploads/`, `backend/chroma_db/`, `**/.env*`, `frontend/dist/`
