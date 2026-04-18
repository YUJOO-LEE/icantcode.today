# icantcode.today

## 프로젝트 개요
Claude Code API 장애 시에만 활성화되는 개발자 커뮤니티 SNS. CLI 미학(터미널 느낌) 디자인으로, 비개발자가 보면 코딩하는 것처럼 보이는 것이 목표.

## 기술 스택
- **프레임워크**: React + Vite (SPA)
- **언어**: TypeScript (strict mode)
- **서버 상태**: TanStack Query v5
- **클라이언트 상태**: Zustand v5
- **스타일링**: Tailwind CSS v4 + CSS 변수
- **i18n**: react-i18next (한국어/영어)
- **애니메이션**: motion (구 framer-motion)
- **폰트**: 물마루 Mono (MulmaruMono)
- **HTTP**: fetch 래퍼 (apis/client.ts)

## 코딩 컨벤션

### TypeScript
- strict 모드 필수
- any 사용 금지, unknown 사용 후 타입 가드
- 인터페이스는 I 접두사 없이 (예: `PostProps`, not `IPostProps`)
- 타입 정의는 src/types/에 집중 관리

### React 컴포넌트
- 함수형 컴포넌트 + hooks만 사용 (class 컴포넌트 금지)
- Props 인터페이스는 컴포넌트 파일 상단에 정의
- React.FC 사용 가능하나 children 명시적 타이핑 선호
- 컴포넌트 파일명: PascalCase.tsx

### 상태 관리 규칙
- 서버 데이터 (API 응답): 반드시 TanStack Query 사용
- 클라이언트 상태 (테마, 인증, UI): Zustand 사용
- 절대 서버 상태를 Zustand에 저장하지 않을 것
- TanStack Query hooks는 src/apis/queries/에 위치

### 스타일링 규칙
- Tailwind CSS 우선 사용
- 커스텀 CSS는 src/styles/terminal.css에만 작성
- 하드코딩 색상 금지, 반드시 CSS 변수 또는 Tailwind 테마 사용
- 다크/라이트 모드: Tailwind dark: variant 사용

### 파일 구조 규칙
- 컴포넌트 배치:
  - UI 프리미티브 → src/components/ui/
  - 피드 관련 → src/components/feed/
  - 댓글 관련 → src/components/comment/
  - 상태 표시 → src/components/status/
  - 레이아웃 → src/components/layout/
  - 공통 → src/components/common/
- API hooks → src/apis/queries/
- 페이지 → src/pages/
- 커스텀 hooks → src/hooks/
- Zustand stores → src/stores/
- 빌드 스크립트 → scripts/ (예: generate-sitemap.mjs)
- 크롤러/SEO 정적 파일 → public/ (robots.txt, sitemap.xml, llms.txt, og.svg)

### SEO/GEO 정책 (2026-04 추가)
- **static-first explainability**: `index.html`이 JS 없이도 서비스 주제를 설명해야 함
- SEO/GEO 관련 작업 시 `.claude/agents/seo-geo.md` 에이전트 우선 참조
- `useDocumentMeta` 훅으로 apiStatus·lang 변화에 따라 메타 동기화 (src/hooks/useDocumentMeta.ts)
- `public/llms.txt`는 LLM 크롤러 전용 Markdown 설명. 서비스 내용 변경 시 함께 업데이트 필수
- CI 빌드 시 SEO 스모크 체크 자동 실행 (.github/workflows/deploy.yml)

### CLI 미학 원칙
- 모든 텍스트: MulmaruMono (물마루 Mono)
- 카드 테두리: Box-drawing 문자 (┌─┐│└─┘)
- 프롬프트 기호: >, $, # 활용
- 커서 깜빡임: prefers-reduced-motion 대응 필수
- 타임스탬프: 상대적 표현 ("5m ago", "just now")

### i18n 규칙
- 모든 사용자 대면 텍스트는 i18n 키 사용
- 네임스페이스: common, feed, auth, status
- 키 네이밍: camelCase (예: `feed.createPost`)

### 작업 방식: Ralph 자동 활성화
복잡한 구현, 다중 파일 작업, Phase 단위 개발 시 자동으로 ralph 모드(반복 루프 + architect 검증)를 활성화한다.
사용자가 별도로 "ralph"를 언급하지 않아도 적용.

### 개발 방법론: TDD (테스트 주도 개발)
모든 코드는 TDD 방식으로 작성합니다:
1. **RED**: 실패하는 테스트를 먼저 작성
2. **GREEN**: 테스트를 통과하는 최소 코드 구현
3. **REFACTOR**: 코드 정리 (테스트는 계속 통과해야 함)

### 테스트 도구
- Vitest + React Testing Library
- 컴포넌트 테스트 필수
- API mock: MSW 사용
- E2E: Playwright (도입 완료 — `e2e/` 폴더, `npm run e2e`)

### 인증 방식 (익명 세션 + 닉네임 지연 입력)
- 로그인/회원가입 없음
- 접속 시 메모리에 UUID 자동 생성
- **닉네임 지연 입력**: 피드 읽기는 닉네임 없이 자유, 게시글/댓글 **작성 시에만** 닉네임 요청
- **세션 내 1회 입력**: 한번 설정하면 새로고침 전까지 재입력 불필요
- 새로고침 시 새 UUID + 닉네임 초기화 → 이전 게시글 수정/삭제 불가
- 개인정보 수집 없음
- 세션 ID와 닉네임 모두 localStorage에 저장하지 않음 (메모리만)

### 닉네임 정책 규칙 (필수 준수)
- **닉네임이 피드 읽기를 막아서는 절대 안 된다** — 이것이 최우선 원칙
- 닉네임 미설정 상태에서도 피드 스크롤, 읽기, 좋아요 가능
- 닉네임 체크는 작성 액션(게시글, 댓글) 시에만 수행
- 닉네임 입력 UI는 모달이 아닌 인라인 프롬프트
- 별도 피드 페이지/라우트 없음 — 루트(`/`)에서 상태 기반 조건부 렌더링

### Git 컨벤션
- 커밋 메시지: Conventional Commits (feat:, fix:, docs:, style:, refactor:, test:, chore:)
- 브랜치: feature/, fix/, docs/ 접두사

## 디자인 토큰
- Primary: #ABC95B
- Dark Background: #121519
- Light Background: #F5F5F0
- Error/Outage: #FF6B6B
- Success/Normal: #ABC95B
- Warning: #FFD93D

## 참고 문서
- [서비스 기획서](docs/SERVICE_PLAN.md)
- [아키텍처](docs/ARCHITECTURE.md)
- [디자인 시스템](docs/DESIGN_SYSTEM.md)
- [API 명세](docs/API_SPEC.md)
- [코드 컨벤션](docs/CODE_CONVENTIONS.md)
