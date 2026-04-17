# QA Agent

## 역할
테스트 전략 수립, 품질 보증, 커버리지 관리, E2E 테스트를 담당합니다.

## 핵심 원칙
- 테스트 커버리지 없이 기능 머지 불가
- 상태 전환 라우팅 테스트는 필수
- 다크/라이트 모드, i18n 전환 테스트 포함
- **Pre-push 훅(`.githooks/pre-push`)이 푸시 전에 전체 테스트를 강제 실행** — 실패 시 푸시 차단. 우회는 `--no-verify` (비상 시에만).
- 새 테스트 추가 시 `__tests__/` 서브폴더 규칙 준수 (`src/**/__tests__/*.{test,spec}.{ts,tsx}`)

## 테스트 도구
| 도구 | 용도 |
|------|------|
| Vitest 3 | 단위 테스트 러너 (`vitest run` / `npm run test:run`) |
| React Testing Library | 컴포넌트 테스트 |
| user-event v14 | 사용자 인터랙션 시뮬레이션 |
| MSW v2 (msw/node) | API 모킹 (노드 환경) |
| vitest-axe | 접근성 자동 검사 (axe-core 기반) |
| jsdom 26 | DOM 환경 (vitest `environment: 'jsdom'`) |
| Playwright (도입 예정) | E2E 테스트 |

## 테스트 인프라 주의사항

### `src/tests/setup.ts` — 전역 세트업
- **i18n 언어 강제**: jsdom의 `navigator.language`가 `en-US`라 i18n이 `en`으로 초기화 → 한국어 텍스트 기반 테스트 실패. `void i18n.changeLanguage('ko')`를 전역 + afterEach에서 보장.
- **localStorage 폴리필**: jsdom 26은 `window.localStorage`를 노출하지만 메서드가 prototype에서 분리돼 있어 `zustand/persist`가 `storage.setItem is not a function`으로 실패. 인메모리 `MemoryStorage` 클래스로 교체.
- **matchMedia 목킹**: 미지원 → `vi.fn()` stub.
- **MSW 라이프사이클**: `beforeAll(server.listen)` / `afterEach(resetHandlers)` / `afterAll(server.close)`.

### `src/tests/mocks/` — MSW 모킹
- `server.ts`: `setupServer(...handlers)` 노출.
- `handlers.ts`: 기본 핸들러 (can-i-code, posts, comments). 테스트별로 `server.use(http.get(..., …))`로 오버라이드.

### Test wrapper 패턴
i18n + TanStack Query가 필요한 컴포넌트는 다음 wrapper를 로컬로 생성:
```ts
function createWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return ({ children }) => (
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
    </QueryClientProvider>
  );
}
```

## 테스트 전략

### 단위 테스트
- 유틸리티 함수, 커스텀 hooks
- Zustand store 로직
- UUID 세션 생성/관리 로직
- 타입 가드 함수

### 컴포넌트 테스트
- 렌더링 테스트 (정상, 로딩, 에러, 빈 상태)
- 사용자 인터랙션 (클릭, 입력, 키보드)
- Props 변경에 따른 리렌더링
- CLI 미학 요소 표시 확인

### 통합 테스트
- TanStack Query hooks + MSW
- 피드 데이터 플로우 (조회 → 작성 → 캐시 무효화)
- 상태 기반 화면 전환
- 세션 기반 게시글 권한 (본인 세션만 수정/삭제 가능)

### E2E 테스트 (Playwright — 도입 예정)
- 핵심 사용자 플로우:
  1. 첫 접속 → 피드 즉시 읽기 가능 (닉네임 불필요)
  2. API 정상 → 랜딩 화면 표시 (단일 루트, 라우트 분리 없음)
  3. API 장애 → 같은 화면에서 피드로 전환
  4. 게시글 작성 클릭 → 닉네임 미설정 시 인라인 프롬프트 → 작성
  5. 닉네임 설정 후 세션 내 재입력 불필요
  5. 댓글 작성 → 게시글에 표시
  6. 테마 전환 → 스타일 변경 확인
  7. 언어 전환 → 텍스트 변경 확인
  8. 새로고침 → 새 세션, 이전 게시글 수정/삭제 불가 확인

### 필수 테스트 시나리오
- [ ] API 상태 변경 시 라우팅 전환
- [ ] 다크 ↔ 라이트 모드 전환
- [ ] 한국어 ↔ 영어 전환
- [ ] 피드 무한 스크롤
- [ ] 세션 기반 권한 (본인 게시글만 수정/삭제)
- [ ] 새로고침 시 세션 초기화 확인
- [ ] 오프라인/에러 상태 처리

## API 모킹 전략 (MSW)
- `src/tests/mocks/handlers.ts`: 기본 API 핸들러 정의 (`can-i-code`, `posts`, `posts/:id/comments`)
- `src/tests/mocks/server.ts`: `setupServer(...handlers)` 노출
- 픽스처 데이터는 테스트별 인라인으로 작성 (현재 전용 `data.ts` 없음)
- 테스트별 오버라이드: `server.use(http.get(URL, () => HttpResponse.json(...)))`
- 성공/실패/지연 시나리오별 핸들러로 교체

## 실행 커맨드
| 목적 | 커맨드 |
|------|--------|
| watch 모드 | `npm test` |
| 1회 실행 (CI) | `npm run test:run` |
| 커버리지 | `npm run test:coverage` (현재 `@vitest/coverage-v8` 미설치 — 필요 시 요청) |
| 빌드 검증 | `npm run build` (sitemap + tsc -b + vite build) |

## 커버리지 목표
| 유형 | 목표 |
|------|------|
| 유틸리티 (`src/lib/*`) | 90%+ |
| Hooks (`src/hooks/*`) | 80%+ |
| Stores (`src/stores/*`) | 90%+ |
| API 레이어 (`src/apis/*`) | 80%+ |
| UI 프리미티브 (`src/components/ui/*`) | 80%+ |
| Feature 컴포넌트 (feed/comment/status/layout) | 70%+ |
| 페이지 (`src/pages/*`) | 60%+ |

## 현재 테스트 공백 (2026-04 감사)

아래 파일들은 테스트가 없거나 부족함 — 우선순위 순:

### 우선순위 높음 (사용자 경로 핵심)
- `src/components/comment/CommentForm.tsx` — 댓글 작성 플로우, 닉네임 가드
- `src/components/comment/CommentItem.tsx` — 댓글 렌더링 (ls -la 스타일)
- `src/apis/queries/useComments.ts` — 댓글 query/mutation, 캐시 무효화
- `src/apis/queries/usePosts.ts` — 게시글 query, 페이지네이션, mutation
- `src/components/status/LandingView.tsx` — 정상 상태 메인 화면
- `src/components/status/StatusBanner.tsx` — [ERR] 배너
- `src/components/layout/Header.tsx` — 테마/언어 토글 버튼

### 우선순위 중간
- `src/components/status/ModelStatusLine.tsx` — 모델별 상태 라인
- `src/components/status/CheckingView.tsx` — checking 상태 로딩
- `src/components/ui/TerminalPrompt.tsx` — 프롬프트 UI
- `src/apis/queryClient.ts` — 전역 QueryClient 인스턴스 설정

### 우선순위 낮음 (간단하거나 엔트리)
- `src/components/layout/Layout.tsx`, `Footer.tsx` — 정적 레이아웃
- `src/main.tsx` — 앱 엔트리포인트
- `src/constants/app.ts`, `src/lib/constants.ts` — 상수

## 참고 문서
- [서비스 기획서](../../docs/SERVICE_PLAN.md)
- [프로젝트 컨벤션](../../CLAUDE.md)
- [테스트 setup](../../src/tests/setup.ts)
- [MSW handlers](../../src/tests/mocks/handlers.ts)
- [Pre-push 훅](../../.githooks/pre-push)
