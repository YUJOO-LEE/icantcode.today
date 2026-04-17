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
- `src/tests/mocks/handlers.ts`: 기본 API 핸들러 (`can-i-code`, `posts`, `posts/:id/comments` — 전부 성공 기본값)
- `src/tests/mocks/server.ts`: `setupServer(...handlers)` 노출
- **`src/tests/mocks/presets.ts`**: 성공/에러/지연 핸들러 팩토리 + `buildPost` / `buildComment` 픽스처 빌더
  ```ts
  import { presets, buildComment } from '@/tests/mocks/presets';
  server.use(presets.commentsError(1));
  server.use(presets.statusDelayed(500));
  server.use(presets.commentsList(1, [buildComment({ content: 'x' })]));
  ```
- 테스트별 오버라이드: `server.use(...)` 로 임시 교체 → `afterEach`에서 자동 리셋

## 실행 커맨드
| 목적 | 커맨드 |
|------|--------|
| watch 모드 | `npm test` |
| 1회 실행 (CI) | `npm run test:run` |
| 커버리지 | `npm run test:coverage` (v8 + HTML 리포트 `coverage/index.html`) |
| 빌드 검증 | `npm run build` (sitemap + tsc -b + vite build) |

커버리지 threshold 는 `vitest.config.ts` 에서 강제 (statements 97, branches 92, functions 95, lines 97). 미달 시 명령 실패.

## CI 파이프라인
- `.github/workflows/deploy.yml` — `push:master` / `pull_request` 양쪽에서 실행
- **`test` job** 이 먼저 `npm run test:coverage` 실행 → threshold 미달 시 실패
- `build` job 은 `test` 의존 → SEO smoke + pages artifact
- `deploy` job 은 master push 한정

로컬 측에서도 `.githooks/pre-push` 가 동일한 `npm run test:run` 실행. 우회는 `--no-verify` (비상용).

## 커버리지 목표 · 현황 (2026-04)
| 영역 | 목표 | 현재 |
|------|------|------|
| 유틸리티 (`src/lib/*`) | 90%+ | **100%** |
| Hooks (`src/hooks/*`) | 80%+ | **100%** |
| Stores (`src/stores/*`) | 90%+ | **100%** |
| API 레이어 (`src/apis/*`) | 80%+ | 93–100% |
| UI 프리미티브 (`src/components/ui/*`) | 80%+ | **100%** |
| Feature 컴포넌트 (feed/comment/status/layout) | 70%+ | 98–100% |
| 페이지 (`src/pages/*`) | 60%+ | **98.9%** |
| **전체** | — | **99.18% / 94.52% branch / 98.86% fn** |

## 현재 테스트 공백 (2026-04 감사, v8 기반)

모든 고·중 우선순위 공백은 해소됨. 잔여는 소규모 branch 또는 defensive path:
- `src/apis/queries/usePosts.ts` 87.5% — `usePostsPolling` 캐시 머지 effect(라인 66-74). 통합 테스트로만 자연스럽게 증명 가능
- `src/components/feed/FeedList.tsx` 96.7% — IntersectionObserver 콜백 에러 경로(라인 98-100)
- `src/lib/i18n.ts` / `src/lib/constants.ts` — `??` / `?.startsWith` nullish 짧은 가지 (분기 0%로 집계되지만 실제 런타임 양쪽 다 도달)

### 향후 확장 (별도 트랙)
- **Playwright E2E**: 여전히 도입 예정. qa.md E2E 섹션 8개 플로우가 타깃
- **시각 회귀** (Chromatic / Percy): 아직 미도입
- **Lint 게이트**: pre-push 에 eslint 단계 추가 고려

## 참고 문서
- [서비스 기획서](../../docs/SERVICE_PLAN.md)
- [프로젝트 컨벤션](../../CLAUDE.md)
- [테스트 setup](../../src/tests/setup.ts)
- [MSW handlers](../../src/tests/mocks/handlers.ts)
- [Pre-push 훅](../../.githooks/pre-push)
