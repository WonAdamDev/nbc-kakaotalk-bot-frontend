# NBC Basketball Game Management - Frontend

React + Vite 기반 농구 경기 실시간 관리 웹 애플리케이션

## 기술 스택

- **React 18** - UI 프레임워크
- **Vite** - 빌드 도구
- **React Router** - 라우팅
- **Socket.io Client** - 실시간 WebSocket 통신
- **Axios** - HTTP 클라이언트
- **Tailwind CSS** - 스타일링

## 주요 기능

### 1. 실시간 경기 관리
- WebSocket을 통한 실시간 데이터 동기화
- 여러 사용자가 동시에 경기 페이지를 보며 실시간 업데이트 수신

### 2. 선수 도착 관리
- 블루팀 / 화이트팀 선수 도착 처리
- 자동 순번 부여
- 도착 시각 기록

### 3. 쿼터 관리
- 자동 로테이션 시스템
- 출전 선수 / 벤치 선수 관리
- 실시간 점수 입력 및 업데이트

### 4. 스코어보드
- 총점 표시
- 쿼터별 점수 표시
- 최종 승자 표시 (경기 종료 시)

## 로컬 개발 환경 설정

### 1. 의존성 설치

```bash
cd nbc-kakaotalk-bot-frontend
npm install
```

### 2. 환경 변수 설정

`.env` 파일 생성:

```env
VITE_API_URL=http://localhost:5000
VITE_FRONTEND_URL=http://localhost:3000
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 접속

### 4. 프로덕션 빌드

```bash
npm run build
npm run preview
```

## Railway 배포 가이드

### 1. Railway 프로젝트 생성

1. [Railway](https://railway.app) 로그인
2. "New Project" 클릭
3. "Deploy from GitHub repo" 선택
4. `nbc-kakaotalk-bot-frontend` 저장소 연결

### 2. 환경 변수 설정

Railway 대시보드에서 Variables 탭:

```
VITE_API_URL=https://your-backend-url.up.railway.app
VITE_FRONTEND_URL=https://your-frontend-url.up.railway.app
```

**중요**: 백엔드 서버를 먼저 배포하고 URL을 얻어야 합니다!

### 3. 빌드 설정

Railway는 자동으로 다음을 인식합니다:
- `Procfile`의 `web: npm run start` 명령어
- `package.json`의 build 스크립트

배포 명령어:
```bash
npm install
npm run build
npm run start
```

### 4. 백엔드 CORS 설정 업데이트

백엔드 서버의 `app/__init__.py`에서 CORS 설정:

```python
# 프로덕션 환경에서는 실제 프론트엔드 URL만 허용
CORS(app, origins=[
    "http://localhost:3000",  # 로컬 개발
    "https://your-frontend-url.up.railway.app"  # 프로덕션
])
```

### 5. WebSocket CORS 설정

`app/__init__.py`의 SocketIO 초기화:

```python
socketio.init_app(app,
    cors_allowed_origins=[
        "http://localhost:3000",
        "https://your-frontend-url.up.railway.app"
    ],
    async_mode='threading'
)
```

### 6. 백엔드에서 프론트엔드 URL 반환하도록 수정

`app/routes/game/commands.py`의 `create_game()` 함수:

```python
# 환경 변수에서 프론트엔드 URL 가져오기
FRONTEND_URL = os.environ.get('FRONTEND_URL') or 'http://localhost:3000'

game_url = f"{FRONTEND_URL}/game/{game_id}"
```

그리고 백엔드 `config.py`에 추가:

```python
FRONTEND_URL = os.environ.get('FRONTEND_URL') or 'http://localhost:3000'
```

Railway 백엔드 환경 변수에 추가:
```
FRONTEND_URL=https://your-frontend-url.up.railway.app
```

## 프로젝트 구조

```
nbc-kakaotalk-bot-frontend/
├── public/                 # 정적 파일
├── src/
│   ├── components/         # React 컴포넌트
│   │   ├── GamePage.jsx           # 메인 경기 페이지
│   │   ├── GameHeader.jsx         # 경기 헤더
│   │   ├── ScoreBoard.jsx         # 스코어보드
│   │   ├── GameControls.jsx       # 경기 시작/종료 컨트롤
│   │   ├── LineupSection.jsx      # 선수 도착 관리
│   │   ├── QuarterSection.jsx     # 쿼터 관리
│   │   └── NotFound.jsx           # 404 페이지
│   ├── hooks/              # Custom Hooks
│   │   └── useWebSocket.js        # WebSocket 연결 Hook
│   ├── App.jsx             # 메인 앱
│   ├── main.jsx            # 엔트리 포인트
│   └── index.css           # Tailwind CSS
├── index.html              # HTML 템플릿
├── vite.config.js          # Vite 설정
├── tailwind.config.js      # Tailwind 설정
├── package.json            # 의존성
├── Procfile                # Railway 배포 설정
└── README.md
```

## API 엔드포인트 연동

### REST API (Axios)

```javascript
// 경기 조회
GET /api/game/:gameId

// 경기 시작
POST /api/game/:gameId/start

// 경기 종료
POST /api/game/:gameId/end

// 선수 도착
POST /api/game/:gameId/lineup/arrival
Body: { team: "블루", member: "홍길동" }

// 쿼터 시작
POST /api/game/:gameId/quarter/start

// 점수 업데이트
PUT /api/game/:gameId/quarter/:num/score
Body: { score_blue: 10, score_white: 8 }
```

### WebSocket (Socket.io)

```javascript
// 연결
socket.on('connect', () => { ... })

// 경기 방 참여
socket.emit('join_game', { game_id: 'ABC12345' })

// 실시간 업데이트 수신
socket.on('game_update', (data) => {
  // data.type: 'game_started', 'player_arrived', 'score_updated', etc.
  // data.data: 업데이트된 데이터
})
```

## 컴포넌트 설명

### GamePage
- 메인 경기 관리 페이지
- WebSocket 연결 관리
- 전체 상태 관리 (game, lineups, quarters)
- 실시간 업데이트 처리

### useWebSocket Hook
- Socket.io 클라이언트 관리
- 자동 재연결
- 경기 방 입장/퇴장
- 실시간 이벤트 리스닝

### LineupSection
- 선수 도착 처리
- 팀별 라인업 표시
- 선수 제거 기능

### QuarterSection
- 쿼터 시작 (자동 로테이션)
- 출전/벤치 선수 표시
- 점수 입력 및 업데이트
- 쿼터 종료

## 실시간 업데이트 이벤트

WebSocket을 통해 수신하는 이벤트:

- `game_started` - 경기 시작
- `game_ended` - 경기 종료
- `player_arrived` - 선수 도착
- `player_removed` - 선수 제거
- `quarter_started` - 쿼터 시작
- `quarter_ended` - 쿼터 종료
- `score_updated` - 점수 업데이트
- `game_deleted` - 경기 삭제

## 트러블슈팅

### WebSocket 연결 실패
- 백엔드 서버의 CORS 설정 확인
- SocketIO `cors_allowed_origins` 설정 확인
- 환경 변수 `VITE_API_URL` 확인

### 빌드 오류
```bash
# 의존성 재설치
rm -rf node_modules package-lock.json
npm install

# 캐시 삭제 후 빌드
npm run build -- --force
```

### Railway 배포 실패
- `Procfile` 확인
- 환경 변수 설정 확인
- 빌드 로그에서 에러 메시지 확인

## 라이선스

MIT
