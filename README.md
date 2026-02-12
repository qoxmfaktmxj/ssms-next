# SSMS Next (Next.js Fullstack)

한국어 사용자 기준으로 운영되는 SSMS 차세대 웹 애플리케이션입니다.
프론트엔드/백엔드를 Next.js App Router 기반으로 통합했고, 데이터 저장소는 PostgreSQL을 사용합니다.

## 1) 프로젝트 현황

- 프레임워크: Next.js 16 + React 19 + TypeScript
- 인증: 쿠키 기반 JWT (`accessToken`, `refreshToken`)
- DB: PostgreSQL
- API: `src/app/api/*` Route Handler (Next 네이티브 백엔드)
- 서버 데이터 계층: `src/server/data/*`
- 공통 DB 연결: `src/server/db/pool.ts`

## 2) 한국어화 정책

- 핵심 공통 화면(로그인/셸/대시보드/오류/로딩/404)을 한국어로 변환
- 메뉴 시드는 기존 운영 메뉴 구조(운영/추가개발/공통/시스템) 중심으로 한국어 라벨 반영
- 메뉴 레거시 경로는 `src/features/menu/api.ts`에서 Next 라우트로 매핑

## 3) 메뉴 시드 구조 (요청 반영)

`npm run db:seed` 실행 시 아래와 같은 구조로 메뉴가 초기화됩니다.

- 루트: `SSMS`
- 운영: 고객사관리, HR담당자현황, 인프라구성관리, 외주인력계약관리, 외주인력일정관리, 외주인력근태관리
- 추가개발: 추가개발관리, 추가개발인력관리, 추가개발프로젝트관리, 추가개발문의관리
- 공통: 일일업무(N), 토론방(N)
- 시스템: 사용자관리, 메뉴관리, 공통코드관리 (+ 비활성 항목 일부)

주의:
- 시드 실행 시 `SSMS` 테넌트의 메뉴/퀵메뉴를 재구성합니다.
- 운영 중 데이터가 있는 환경에서는 백업 후 실행하세요.

## 4) 앱 구조 분석

### 4.1 라우팅/화면

- 공개 화면: `src/app/(public)/login/page.tsx`
- 보호 화면 레이아웃: `src/app/(protected)/layout.tsx`
- 도메인 화면:
  - 시스템: `src/app/(protected)/system/*`
  - 운영: `src/app/(protected)/manage/*`
  - 추가개발: `src/app/(protected)/develop/*`

### 4.2 기능(Feature) 계층

- `src/features/*`
  - 화면에서 사용하는 API 호출/타입/컴포넌트 관리
  - 예: `src/features/develop-management/api.ts`, `src/features/system-user/user-table.tsx`

### 4.3 서버 계층

- Route Handler: `src/app/api/**/route.ts`
- 도메인 데이터 처리: `src/server/data/*.ts`
- 인증 처리: `src/server/auth/*`

## 5) 인프라 구성

### 5.1 로컬 인프라

- PostgreSQL: `docker-compose.yml`의 `postgres` 서비스 (`localhost:55432`)
- 앱 서버: Next.js 개발 서버 (`localhost:3000`)

### 5.2 환경 변수

`ssms-next/.env.local`

```env
NEXT_PUBLIC_API_BASE_URL=/api
DATABASE_URL=postgresql://ssms:ssms@localhost:55432/ssms
JWT_SECRET=change-me-to-a-long-random-secret-value-for-local-dev-1234567890
JWT_ACCESS_TTL_SECONDS=3600
JWT_REFRESH_TTL_SECONDS=604800
SECURE_COOKIE=false
```

## 6) 앱 진입점

- 전역 루트: `src/app/layout.tsx`
- 보호영역 진입: `src/app/(protected)/layout.tsx` -> `AuthGate`
- 기본 리다이렉트: `src/app/(protected)/page.tsx` -> `/dashboard`
- 로그인 경로: `/login` (`src/app/(public)/login/page.tsx`)

## 7) 백엔드 통신 흐름

### 7.1 호출 흐름

1. UI/Feature API (`src/features/**/api.ts`)에서 `request()` 호출
2. `src/shared/api/http.ts`가 `/api/*`로 요청
3. `src/app/api/**/route.ts`가 요청 수신 및 검증
4. `src/server/data/*.ts`에서 SQL 실행
5. `src/server/db/pool.ts`로 PostgreSQL 질의
6. 응답(JSON) 반환

### 7.2 쿼리 위치

- 도메인 SQL은 모두 `src/server/data/*.ts`에 존재
  - 예: `src/server/data/menu-store.ts`, `src/server/data/company-store.ts`, `src/server/data/develop-management-store.ts`
- 로그 저장: `src/server/log/system-log.ts`

## 8) 개발자가 화면 추가/수정하는 방법

예: "새 관리 화면" 추가 절차

1. 타입 정의
- `src/features/<domain>/types.ts`

2. 클라이언트 API 정의
- `src/features/<domain>/api.ts`
- `request('/<path>')` 형태로 Route Handler 호출

3. 화면 작성
- `src/app/(protected)/<group>/<page>/page.tsx`
- 조회/등록/수정/삭제 UI 구성

4. API 라우트 작성
- `src/app/api/<domain>/<action>/route.ts`
- 입력 검증(`zod`) + 인증 체크 + 에러 핸들링

5. 서버 데이터 로직 작성
- `src/server/data/<domain>-store.ts`
- SQL/트랜잭션/매핑 처리

6. 메뉴 연결
- DB 메뉴(`tsys301_new`)에 경로 추가
- 레거시 경로 사용 시 `src/features/menu/api.ts` 매핑 추가

7. 검증
- `npm run lint`
- `npm run typecheck`
- `npm run build`

## 9) 실행 방법

```bash
# 1) DB 기동
cd ..
docker compose up -d postgres

# 2) 앱 실행
cd ssms-next
npm ci
npm run dev
```

접속: `http://localhost:3000/login`

기본 계정:
- `enterCd`: `SSMS`
- `sabun`: `admin`
- `password`: `admin`

## 10) 초기 데이터(시드)

```bash
cd ssms-next
npm run db:seed
```

- 테이블별 기준 데이터(사용자/메뉴/코드/고객사/운영/추가개발/퀵메뉴) 생성
- 재실행 가능하도록 idempotent하게 구성

## 11) 품질/스모크 테스트

```bash
cd ssms-next
npm run lint
npm run typecheck
npm run build
```

(루트 `scripts/`에 smoke 스크립트가 있으면 추가로 실행)

## 12) Git 반영

현재 변경사항을 커밋/푸시할 때:

```bash
git add .
git commit -m "feat: 한국어 UI/메뉴 시드/README 정리"
git push origin master
```

원격 브랜치 정책이 `main`이면 마지막 명령을 `git push origin master:main`으로 사용하세요.