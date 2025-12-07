# Railway 배포 가이드

## 사전 준비

1. GitHub 계정
2. Railway 계정 (https://railway.app)
3. 백엔드와 프론트엔드 코드를 각각 GitHub 저장소에 푸시

---

## 1단계: 백엔드 배포 (우선)

### 1.1 Railway 프로젝트 생성

1. Railway 로그인
2. "New Project" 클릭
3. "Deploy from GitHub repo" 선택
4. `nbc-kakaotalk-bot-server` 저장소 선택

### 1.2 PostgreSQL 데이터베이스 추가

1. 프로젝트 내에서 "New" 클릭
2. "Database" → "Add PostgreSQL" 선택
3. 자동으로 `DATABASE_URL` 환경 변수 생성됨

### 1.3 Redis 추가

1. 프로젝트 내에서 "New" 클릭
2. "Database" → "Add Redis" 선택
3. 자동으로 `REDIS_URL` 환경 변수 생성됨

### 1.4 MongoDB Atlas 설정 (외부)

Railway에는 MongoDB가 없으므로 MongoDB Atlas 사용:

1. https://www.mongodb.com/cloud/atlas 접속
2. 무료 클러스터 생성
3. Database Access에서 유저 생성
4. Network Access에서 `0.0.0.0/0` 허용 (모든 IP)
5. Connect → Drivers에서 연결 문자열 복사

### 1.5 백엔드 환경 변수 설정

Railway 대시보드 → Variables 탭:

```env
SECRET_KEY=your-random-secret-key-here-change-this
DEBUG=False
FRONTEND_URL=https://your-frontend-url.up.railway.app

# PostgreSQL (자동 생성됨)
DATABASE_URL=postgresql://...

# Redis (자동 생성됨)
REDIS_URL=redis://...

# MongoDB (Atlas에서 복사)
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/
MONGO_DB_NAME=nbc_kakaotalk_bot
```

**중요**: `SECRET_KEY`는 랜덤 문자열로 설정하세요:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

**중요**: `FRONTEND_URL`은 나중에 프론트엔드 배포 후 업데이트합니다!

### 1.6 배포 확인

1. Railway가 자동으로 빌드 & 배포 시작
2. Deployments 탭에서 로그 확인
3. Settings → Domains에서 도메인 생성 (Generate Domain)
4. 생성된 URL 복사 (예: `https://nbc-backend.up.railway.app`)

### 1.7 헬스 체크

브라우저나 Postman으로 테스트:
```
POST https://your-backend-url.up.railway.app/health/
Content-Type: application/json

{}
```

응답:
```json
{
  "status": "ok",
  "redis": "ok",
  "mongodb": "ok",
  "postgresql": "ok"
}
```

---

## 2단계: 프론트엔드 배포

### 2.1 Railway 프로젝트 생성 (또는 같은 프로젝트에 추가)

옵션 A: 새 프로젝트
1. "New Project" → "Deploy from GitHub repo"
2. `nbc-kakaotalk-bot-frontend` 선택

옵션 B: 같은 프로젝트에 추가 (추천)
1. 기존 백엔드 프로젝트 내에서 "New" 클릭
2. "GitHub Repo" 선택
3. `nbc-kakaotalk-bot-frontend` 선택

### 2.2 프론트엔드 환경 변수 설정

Variables 탭:

```env
VITE_API_URL=https://your-backend-url.up.railway.app
VITE_FRONTEND_URL=https://your-frontend-url.up.railway.app
```

**주의**:
- `VITE_API_URL`은 백엔드 URL (1.6에서 복사한 URL)
- `VITE_FRONTEND_URL`은 이 서비스의 도메인 (아래에서 생성)

### 2.3 도메인 생성

1. Settings → Domains → Generate Domain
2. 생성된 URL 복사 (예: `https://nbc-frontend.up.railway.app`)
3. `VITE_FRONTEND_URL` 환경 변수 업데이트

### 2.4 백엔드 FRONTEND_URL 업데이트

백엔드 서비스로 돌아가서:
1. Variables 탭 열기
2. `FRONTEND_URL` 값을 프론트엔드 URL로 업데이트
3. 재배포 트리거됨

---

## 3단계: 카카오톡 봇 설정

### 3.1 config.json 업데이트

메신저 R 봇의 `config.json`:

```json
{
  "serverUrl": "https://your-backend-url.up.railway.app",
  "timeout": 10000
}
```

### 3.2 테스트

카카오톡에서:
```
!경기생성
```

응답:
```
=== 경기가 생성되었습니다 ===

경기 ID: ABC12345
생성자: 홍길동
날짜: 2024-01-25

경기 관리 페이지:
https://your-frontend-url.up.railway.app/game/ABC12345

※ 위 링크에서 선수 도착, 쿼터 관리, 점수 기록 등 모든 경기 관리가 가능합니다.
```

---

## 4단계: 검증

### 4.1 백엔드 헬스 체크
```bash
curl -X POST https://your-backend-url.up.railway.app/health/ \
  -H "Content-Type: application/json" \
  -d '{}'
```

### 4.2 경기 생성 테스트
```bash
curl -X POST https://your-backend-url.up.railway.app/api/game/create \
  -H "Content-Type: application/json" \
  -d '{
    "room": "테스트방",
    "creator": "관리자"
  }'
```

### 4.3 프론트엔드 접속

브라우저에서 반환된 URL 접속:
```
https://your-frontend-url.up.railway.app/game/ABC12345
```

- 실시간 연결 상태 확인 (우측 상단 녹색 불)
- 선수 도착 처리 테스트
- 쿼터 시작 테스트
- 점수 입력 테스트

---

## 환경 변수 요약

### 백엔드 (nbc-kakaotalk-bot-server)

| 변수 | 값 예시 | 필수 |
|------|---------|------|
| `SECRET_KEY` | `a1b2c3d4e5f6...` | ✅ |
| `DEBUG` | `False` | ✅ |
| `FRONTEND_URL` | `https://nbc-frontend.up.railway.app` | ✅ |
| `DATABASE_URL` | `postgresql://...` | ✅ (자동) |
| `REDIS_URL` | `redis://...` | ✅ (자동) |
| `MONGO_URI` | `mongodb+srv://...` | ✅ |
| `MONGO_DB_NAME` | `nbc_kakaotalk_bot` | ✅ |

### 프론트엔드 (nbc-kakaotalk-bot-frontend)

| 변수 | 값 예시 | 필수 |
|------|---------|------|
| `VITE_API_URL` | `https://nbc-backend.up.railway.app` | ✅ |
| `VITE_FRONTEND_URL` | `https://nbc-frontend.up.railway.app` | ✅ |

---

## 트러블슈팅

### 문제: CORS 에러
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**해결**:
1. 백엔드 `FRONTEND_URL` 환경 변수가 정확한지 확인
2. 백엔드 재배포
3. 브라우저 캐시 삭제 (Ctrl+Shift+R)

### 문제: WebSocket 연결 실패
```
WebSocket connection to 'wss://...' failed
```

**해결**:
1. 백엔드 CORS 설정 확인
2. 프론트엔드 `VITE_API_URL`이 정확한지 확인
3. Railway 로그에서 WebSocket 에러 확인

### 문제: 데이터베이스 연결 실패
```
PostgreSQL connection failed
```

**해결**:
1. Railway PostgreSQL 서비스 상태 확인
2. `DATABASE_URL` 환경 변수 확인
3. Railway 로그에서 상세 에러 확인

### 문제: MongoDB 연결 실패
```
MongoDB connection failed
```

**해결**:
1. MongoDB Atlas 클러스터 상태 확인
2. Network Access에서 `0.0.0.0/0` 허용 확인
3. `MONGO_URI` 형식 확인 (username, password 포함)

### 문제: 빌드 실패 (프론트엔드)
```
npm ERR! code ELIFECYCLE
```

**해결**:
1. `package.json`의 `scripts` 확인
2. Railway 빌드 로그에서 상세 에러 확인
3. 로컬에서 `npm run build` 테스트

---

## 비용 예상 (Railway)

Railway는 사용량 기반 과금:

- **무료 티어**: 월 $5 크레딧 (약 500시간)
- **Hobby 플랜**: 월 $5 (무제한 사용)

예상 비용:
- Backend + Frontend + PostgreSQL + Redis = 월 $5~10
- MongoDB Atlas (외부): 무료 티어 (512MB)

---

## 로컬 개발 vs 프로덕션

### 로컬 개발

**백엔드**:
```bash
cd nbc-kakaotalk-bot-server
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# .env 파일 생성
FRONTEND_URL=http://localhost:3000

python app.py
```

**프론트엔드**:
```bash
cd nbc-kakaotalk-bot-frontend
npm install

# .env 파일 생성
VITE_API_URL=http://localhost:5000
VITE_FRONTEND_URL=http://localhost:3000

npm run dev
```

### 프로덕션 (Railway)

- 자동 빌드 & 배포
- 환경 변수는 Railway 대시보드에서 관리
- HTTPS 자동 제공
- 자동 스케일링

---

## 다음 단계

1. ✅ 백엔드 배포
2. ✅ 프론트엔드 배포
3. ✅ 카카오톡 봇 연동
4. 🔄 실제 경기에서 테스트
5. 📊 모니터링 설정 (Railway Metrics)
6. 🔒 보안 강화 (환경 변수 점검)

---

## 유용한 링크

- Railway 문서: https://docs.railway.app
- MongoDB Atlas: https://www.mongodb.com/cloud/atlas
- Flask-SocketIO: https://flask-socketio.readthedocs.io
- Socket.io Client: https://socket.io/docs/v4/client-api/
