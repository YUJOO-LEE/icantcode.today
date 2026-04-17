# ARCHITECTURE.md — icantcode.today 아키텍처 문서

---

## 1. 기술 스택 결정 및 근거

### 1.1 React + Vite SPA

**선택 이유:**
- 백엔드 API가 별도로 존재하므로 SSR/SSG 불필요
- **SEO/GEO 전략**: SSG 없이 `index.html` 정적 강화(JSON-LD, hreflang, hidden SEO body, robots.txt, sitemap.xml, llms.txt)로 대응 — "static-first explainability" 원칙. 크롤러·LLM이 JS 없이도 서비스 주제를 파악할 수 있어야 한다 (2026-04 기조 변경)
- 정적 호스팅 가능 (GitHub Pages) → 서버 비용 절감
- SPA 특유의 빠른 페이지 전환이 터미널 감성 UX와 잘 어울림
- Vite의 빠른 HMR로 개발 생산성 극대화

**대안 검토:**
- Next.js: SSR 장점 있으나 단일 루트(`/`) 구조에서 불필요한 복잡도 추가
- Remix: 마찬가지로 오버엔지니어링
- Astro: 정적 콘텐츠 중심 프로젝트에 적합, SNS 동적 피드와 맞지 않음

### 1.2 TypeScript Strict Mode

**선택 이유:**
- `strict: true` 강제로 런타임 에러 사전 차단
- API 응답 타입 명시로 계약(Contract) 명확화
- 리팩토링 안전성 확보
- IDE 자동완성으로 개발 속도 향상

### 1.3 TanStack Query v5

**선택 이유:**
- 서버 상태(Server State) 관리에 특화
- 자동 캐싱, 백그라운드 리페치, 낙관적 업데이트 내장
- API 폴링 (`refetchInterval`) 네이티브 지원 → API 상태 모니터링에 최적
- 무한 스크롤 (`useInfiniteQuery`) 내장
- React Query DevTools로 디버깅 용이

**서버 상태 = TanStack Query, 클라이언트 상태 = Zustand** 원칙 엄수.

### 1.4 Zustand v5

**선택 이유:**
- 클라이언트 상태(Client State)에 특화: 테마, 인증 정보, UI 상태
- Redux 대비 보일러플레이트 최소화
- TypeScript 지원 우수
- Immer 없이도 직관적인 상태 업데이트
- persist 미들웨어로 localStorage 연동 간편

### 1.5 Tailwind CSS v4

**선택 이유:**
- CSS 커스텀 프로퍼티 기반 v4로 다크/라이트 모드 전환 용이
- CLI 컴포넌트 스타일링에 유틸리티 클래스가 적합
- JIT 엔진으로 사용하지 않는 CSS 자동 제거
- 디자인 토큰 일관성 유지

### 1.6 react-i18next

**선택 이유:**
- React 생태계 표준 i18n 라이브러리
- 네임스페이스 기반 번역 파일 분리로 유지보수 용이
- 언어 감지, 폴백 지원

### 1.7 ~~React Router v7~~ → 제거됨 (2026-03-08 재검토)

**제거 근거:**
- 단일 루트(`/`)에서 상태 기반 조건부 렌더링만 사용 — 라우터 자체가 불필요
- ~14KB (gzip) 번들 절감
- 향후 프로필 페이지 등 다중 라우트 필요 시 재도입 검토 (TanStack Router도 대안)

### 1.8 motion (구 framer-motion)

**선택 이유:**
- 터미널 감성 애니메이션(타이핑 효과, 커서 깜빡임, 페이지 전환)
- 선언적 API로 복잡한 애니메이션 간단하게 구현
- `AnimatePresence`로 컴포넌트 언마운트 애니메이션 처리

**패키지명 변경 (2026-03-08):** `framer-motion` → `motion`으로 리브랜딩 완료. import 경로만 변경, API 동일.

### 1.9 fetch 래퍼 (axios 대신 채택)

**선택 이유:**
- JWT 없는 익명 세션 → axios 인터셉터의 핵심 가치(토큰 갱신) 불필요
- 간단한 fetch 래퍼(~20줄)로 충분
- TanStack Query가 재시도, 에러 핸들링을 이미 담당
- ~13KB (gzip) 번들 절감
- 브라우저 네이티브 API로 추가 의존성 없음

---

## 2. 전체 기술 스택

| 분류 | 기술 | 버전 |
|------|------|------|
| UI Framework | React | 19.x |
| Build Tool | Vite | 6.x |
| Language | TypeScript | 5.x (strict) |
| Server State | TanStack Query | v5 |
| Client State | Zustand | v5 |
| Styling | Tailwind CSS | v4 |
| i18n | react-i18next | latest |
| Animation | motion (구 framer-motion) | latest |
| HTTP Client | fetch 래퍼 (apis/client.ts) | — |
| Font | MulmaruMono (물마루 Mono) | — |

---

## 3. 폴더 구조

```
src/
├── apis/                        # API 레이어
│   ├── client.ts                # API 클라이언트 (fetch 래퍼)
│   └── queries/                 # TanStack Query hooks
│       ├── useStatus.ts         # API 상태 폴링 쿼리
│       ├── usePosts.ts          # 피드 목록 (무한스크롤)
│       └── useComments.ts       # 댓글 목록
│
├── components/
│   ├── ui/                      # 기본 CLI 스타일 UI 컴포넌트
│   │   ├── TerminalCard.tsx     # box-drawing 문자 카드 래퍼
│   │   ├── TerminalPrompt.tsx   # > $ # 프롬프트 라인
│   │   ├── TerminalInput.tsx    # 프롬프트 prefix가 있는 입력창
│   │   ├── TerminalButton.tsx   # CLI 스타일 버튼
│   │   ├── TerminalBadge.tsx    # 상태 뱃지 (예: [DOWN])
│   │   ├── Cursor.tsx           # 깜빡이는 커서 컴포넌트
│   │   └── TypewriterText.tsx   # 타이핑 효과 텍스트
│   │
│   ├── feed/                    # 피드 관련 컴포넌트
│   │   ├── FeedList.tsx         # 타임라인 전체 목록
│   │   ├── FeedItem.tsx         # 개별 게시물 카드
│   │   └── FeedComposer.tsx     # 게시물 작성 폼
│   │
│   ├── comment/                 # 댓글 관련 컴포넌트
│   │   ├── CommentList.tsx      # 댓글 목록
│   │   ├── CommentItem.tsx      # 개별 댓글
│   │   └── CommentForm.tsx      # 댓글 작성 폼
│   │
│   ├── status/                  # API 상태 관련 컴포넌트
│   │   ├── CheckingView.tsx     # 상태 확인 중 UI
│   │   ├── LandingView.tsx      # API 정상 시 랜딩 UI
│   │   └── StatusBanner.tsx     # 상단 상태 배너
│   │
│   ├── layout/                  # 레이아웃 컴포넌트
│   │   ├── Header.tsx           # 상단 헤더
│   │   ├── Footer.tsx           # 하단 푸터
│   │   └── Layout.tsx           # 페이지 레이아웃 래퍼
│   │
│   └── common/                  # 공통 유틸리티 컴포넌트
│       ├── ThemeToggle.tsx      # 다크/라이트 모드 토글
│       └── LanguageSwitch.tsx   # 언어 전환 버튼
│
├── pages/                       # 페이지 컴포넌트
│   └── HomePage.tsx             # 유일한 페이지 — API 상태에 따라 랜딩/피드 조건부 렌더링
│
├── hooks/                       # 커스텀 훅
│   └── useNicknameGuard.ts      # 닉네임 미설정 시 작성 차단 가드
│
├── stores/                      # Zustand 스토어
│   ├── themeStore.ts            # 다크/라이트 모드 상태
│   ├── sessionStore.ts          # 세션 상태 (UUID, nickname)
│   └── statusStore.ts           # API 상태 캐시
│
├── styles/                      # 전역 스타일
│   ├── globals.css              # CSS reset, 기본 전역 스타일
│   ├── theme.css                # CSS 커스텀 프로퍼티 (색상 토큰)
│   └── terminal.css             # CLI 특화 애니메이션, 스타일
│
├── lib/                         # 유틸리티 모듈
│   ├── i18n.ts                  # react-i18next 설정
│   ├── constants.ts             # 전역 상수 (폴링 간격, API URL 등)
│   ├── nicknameGenerator.ts     # 랜덤 닉네임 생성기
│   └── utils.ts                 # 공통 유틸 함수 (날짜 포맷 등)
│
├── types/                       # TypeScript 타입 정의
│   └── api.ts                   # API 응답 타입, 도메인 모델 통합 정의
│
├── locales/                     # i18n 번역 파일
│   ├── ko/
│   │   ├── common.json
│   │   ├── feed.json
│   │   ├── auth.json
│   │   └── status.json
│   └── en/
│       ├── common.json
│       ├── feed.json
│       ├── auth.json
│       └── status.json
│
├── App.tsx                      # 라우터 설정, 전역 프로바이더
└── main.tsx                     # 앱 진입점
```

---

## 4. 상태 관리 전략

### 4.1 원칙: Server State vs Client State 분리

```
TanStack Query  →  서버에서 오는 모든 데이터
Zustand         →  순수 클라이언트 UI 상태
```

| 상태 | 관리 도구 | 예시 |
|------|----------|------|
| 피드 목록 | TanStack Query | 서버에서 페이지네이션으로 가져옴 |
| 게시물 상세 | TanStack Query | ID 기반 캐싱 |
| API 상태 | TanStack Query | 30초 폴링 |
| 다크/라이트 모드 | Zustand + localStorage | 서버와 무관한 UI 설정 |
| 세션 (UUID + 닉네임) | Zustand (메모리만) | 새로고침 시 초기화 |
| 전역 API 상태 요약 | Zustand | TanStack Query 결과를 파생 저장 |

### 4.2 Zustand 스토어 설계

세션/테마/상태 3개 스토어로 분리:

- **sessionStore**: 익명 세션 관리 (메모리만, localStorage 저장 안 함)
- **themeStore**: 다크/라이트 모드 (localStorage persist)
- **statusStore**: API 상태 캐시

### 4.3 TanStack Query 설정

- 전역 QueryClient에 staleTime, gcTime, retry 등 설정
- API 상태 폴링: `refetchInterval` 사용, 탭 비활성 시 중단
- 구체적 수치는 `src/lib/constants.ts` 참조

---

## 5. 데이터 플로우

### 5.1 API 상태 기반 화면 전환 플로우

```
App.tsx (최상위)
  │
  ├── <QueryClientProvider>
  │     └── <ZustandHydration>
  │           └── <ApiHealthWatcher>   ← 30초 폴링, statusStore 업데이트
  │                 │
  │                 ▼
  │           statusStore.apiStatus
  │                 │
  │                 ├── 'normal'    → 랜딩 UI (피드 완전 숨김, 컴포넌트 미렌더링)
  │                 ├── 'down'      → 피드 UI (닉네임 없이도 읽기 가능)
  │                 ├── 'degraded'  → 피드 UI (닉네임 없이도 읽기 가능)
  │                 └── 'checking'  → 상태 확인 UI
  │
  └── / (단일 루트 경로)
        └── <Layout><HomePage /></Layout>
            └── HomePage 내부에서 apiStatus에 따라 조건부 렌더링
```

> **별도 라우트 없음**: `/feed` 경로 불필요. 상태 기반 조건부 렌더링으로 화면 전환.

### 5.2 피드 데이터 플로우

```
피드 UI (HomePage 내부)
  │
  ├── useInfiniteQuery('posts')
  │     │
  │     ├── [캐시 히트]  →  즉시 렌더링 (stale-while-revalidate)
  │     └── [캐시 미스]  →  API fetch → TanStack Query 캐시 저장
  │                               │
  │                          FeedList → FeedItem 렌더링
  │
└── useMutation (게시글 작성)
      │
      ├── Optimistic Update (즉시 UI 반영)
      └── 성공 시 queryClient.invalidateQueries
```

### 5.3 익명 세션 + 닉네임 지연 입력 플로우

상세 플로우는 [SERVICE_PLAN.md Section 4.3](SERVICE_PLAN.md) 참조.
UI 스펙은 [DESIGN_SYSTEM.md Section 5](DESIGN_SYSTEM.md) 참조.

---

## 6. API 통합 패턴

- **API 클라이언트**: `apis/client.ts`에 fetch 래퍼 구현
- **Query hooks**: `apis/queries/`에 TanStack Query hooks 패턴으로 구현
- API 명세는 Swagger UI 참조, 타입은 `openapi-typescript`로 자동 생성

---

## 7. 성능 최적화

### 7.1 코드 스플리팅

피드 관련 컴포넌트를 React.lazy로 지연 로딩:

```typescript
const FeedSection = lazy(() => import('./components/feed/FeedSection'));
```

피드 컴포넌트는 API 장애 시에만 로드됨 → 정상 상황에서 불필요한 번들 로드 방지.

### 7.2 폴링 최적화

- `refetchIntervalInBackground: false`: 탭 비활성 시 폴링 중단 (배터리/네트워크 절약)
- `visibilitychange` 이벤트로 탭 복귀 시 즉시 한 번 상태 확인
- 장애 상태에서 정상 전환 시 polling interval 증가 고려 (60초)

### 7.3 렌더링 최적화

- `FeedItem` 컴포넌트 `React.memo` 적용 (타임라인 스크롤 시 불필요한 리렌더 방지)
- 무한스크롤: IntersectionObserver 활용, 스크롤 이벤트 리스너 대신 사용
- 가상 스크롤: 피드가 길어질 경우 TanStack Virtual 도입 검토 (P2)

### 7.4 번들 최적화

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          query: ['@tanstack/react-query'],
          motion: ['motion'],
        },
      },
    },
  },
});
```

---

## 8. 환경 변수

`.env.example` 파일을 참조하세요.

---

## 9. 배포 아키텍처

```
GitHub Repository
  │
  ├── Push to main
  │     │
  │     └── Vercel / Netlify CI/CD
  │           │
  │           ├── vite build
  │           ├── 정적 파일 CDN 배포
  │           └── SPA fallback (/* → index.html)
  │
  └── Backend API (별도 서버)
        └── REST API 서버 (이 문서 범위 외)
```

---

## 10. 기술 스택 재검토 이력

### 2026-03-08: 초기 스택 종합 검증

**결론: 현재 스택은 2026년 업계 표준과 정확히 일치. 트렌드 역행 기술 없음.**

| 기술 | 판정 | 근거 |
|------|------|------|
| React 19 + Vite 6 | KEEP | 프론트엔드 표준 조합 |
| TypeScript strict | KEEP | TS 6.0이 strict 기본값 채택 |
| TanStack Query v5 | KEEP | 서버 상태 관리 1위, SWR 추월 |
| Zustand v5 | KEEP | 클라이언트 상태 1위, ~1.5KB |
| Tailwind CSS v4 | KEEP | Rust 엔진, 100배 빠른 증분 빌드 |
| react-i18next | KEEP | i18n 표준, 번들 ~3KB |
| Vitest + RTL + MSW | KEEP | 테스트 스택 업계 표준 (Playwright 도입 예정) |
| React Router v7 | **REMOVE** | 단일 루트만 사용 — 불필요 (~14KB 절감) |
| framer-motion | **RENAME** | `motion`으로 리브랜딩 완료 |
| axios | **REMOVED** | JWT 없는 프로젝트에서 과잉 — fetch 래퍼로 전환 완료 (~13KB 절감) |

**주목할 업계 변화:**
- TypeScript 6.0 (2026.03.17 정식): strict 기본값 — 영향 없음
- TypeScript 7.0 (Go 컴파일러): 빌드 10배 빠름 — 2026 중반 자동 적용
- TanStack Router 성장 중: 라우팅 재도입 시 대안 검토

---

*마지막 업데이트: 2026-03-09*
