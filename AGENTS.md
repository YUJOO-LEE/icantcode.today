# icantcode.today - 에이전트 운영 문서

## 프로젝트 개요
Claude Code API 장애 시 활성화되는 개발자 커뮤니티. CLI 터미널 미학 디자인.
로그인 없이 접속 시 UUID 자동 생성. 닉네임은 지연 입력 — 피드 읽기는 자유, 작성 시에만 요청.

## 개발 방법론: TDD (테스트 주도 개발)
모든 코드는 TDD 방식으로 작성합니다:
1. **RED**: 실패하는 테스트를 먼저 작성
2. **GREEN**: 테스트를 통과하는 최소 코드 구현
3. **REFACTOR**: 코드 정리 (테스트는 계속 통과해야 함)

## 에이전트 역할 분담

### 🏗️ Architect Agent
- **파일**: `.claude/agents/architect.md`
- **역할**: 아키텍처 결정 감독, 코드 구조 리뷰, 성능 최적화
- **핵심 원칙**: TanStack Query = 서버 상태, Zustand = 클라이언트 상태 분리 강제
- **도구**: LSP, AST grep
- **개입 시점**: 새로운 기능 설계, 구조 변경 PR 리뷰, 성능 이슈

### 💻 Developer - Feature Agent
- **파일**: `.claude/agents/developer-feature.md`
- **역할**: 비즈니스 로직, 기능 구현, 세션 관리, API 통합
- **핵심 원칙**: TDD, TypeScript strict, TanStack Query hooks로 API 호출
- **담당**: 피드 CRUD, 댓글, 리액션, UUID 세션 관리

### 🎨 Developer - UI Agent
- **파일**: `.claude/agents/developer-ui.md`
- **역할**: CLI 미학 UI 컴포넌트 개발, 디자인 시스템 구현
- **핵심 원칙**: TDD, "비개발자가 보면 코딩하는 것처럼", Tailwind 우선
- **담당**: TerminalCard, TerminalPrompt, 레이아웃, 테마 토글, 상태 표시

### ⚙️ Developer - Infra Agent
- **파일**: `.claude/agents/developer-infra.md`
- **역할**: API 클라이언트, 공통 유틸, 설정, 테스트 인프라
- **핵심 원칙**: TDD, 안정적 기반 코드, 타입 안전성
- **담당**: fetch 래퍼 설정, 커스텀 hooks, Zustand stores, i18n, MSW 설정

### ♿ Accessibility Agent
- **파일**: `.claude/agents/accessibility.md`
- **역할**: WCAG 2.1 AA 준수, 키보드 내비게이션, 스크린 리더 호환
- **핵심 원칙**: 색상 대비 4.5:1, prefers-reduced-motion 대응
- **개입 시점**: UI 컴포넌트 리뷰, 테마 변경, 애니메이션 추가

### 🎨 Designer Agent
- **파일**: `.claude/agents/designer.md`
- **역할**: CLI 미학 디자인, 비주얼 일관성, 반응형
- **핵심 원칙**: "비개발자가 보면 코딩하는 것처럼" - 모든 픽셀이 터미널처럼
- **개입 시점**: 새 컴포넌트 디자인, 테마 작업, 레이아웃 변경

### 📋 Planner Agent
- **파일**: `.claude/agents/planner.md`
- **역할**: 기능 우선순위 관리, 사용자 스토리, 스프린트 계획
- **핵심 원칙**: P0→P1→P2 순서 엄격 관리
- **개입 시점**: 새 기능 요청, 로드맵 조정, 스프린트 계획

### 🔒 Security Agent
- **파일**: `.claude/agents/security.md`
- **역할**: 보안 취약점 탐지, 코드 보안 리뷰, 민감 정보 노출 방지
- **핵심 원칙**: OWASP Top 10, 시크릿 노출 방지, 입력 검증, 최소 권한
- **개입 시점**: PR 리뷰, API 연동, 의존성 변경, 환경변수 변경, 배포 전

### 🧪 QA Agent
- **파일**: `.claude/agents/qa.md`
- **역할**: 테스트 전략, 품질 보증, E2E 테스트
- **핵심 원칙**: Vitest + RTL + MSW, 상태 전환 테스트 필수 (Playwright 도입 예정)
- **개입 시점**: 기능 완료 후 테스트, PR 리뷰, 릴리스 전 QA

## 개발자 에이전트 협업 프로토콜

### 3인 토론 기반 개발
개발자 에이전트 3명(Feature, UI, Infra)은 기능 구현 전 설계 토론을 진행합니다:
1. **Infra**: "이 기능에 필요한 API, 타입, 유틸은 이것이다"
2. **Feature**: "비즈니스 로직과 데이터 흐름은 이렇게 구성한다"
3. **UI**: "컴포넌트 구조와 CLI 미학은 이렇게 적용한다"
4. 합의 후 각자 TDD로 담당 영역 구현

### 새 기능 개발 플로우
1. **Planner** → 요구사항 정의, 우선순위 확인
2. **Architect** → 기술 설계, 컴포넌트 구조 결정
3. **Designer** → CLI 미학 디자인 가이드
4. **Developer 3인** → TDD 토론 후 병렬 구현
   - Infra: 타입, API hook, 유틸 (테스트 먼저)
   - Feature: 비즈니스 로직 (테스트 먼저)
   - UI: 컴포넌트 (테스트 먼저)
5. **Accessibility** → 접근성 검증
6. **QA** → 통합/E2E 테스트 검증

### 버그 수정 플로우
1. **QA** → 재현 및 원인 분석
2. **Developer (해당 담당)** → 테스트 추가 후 수정 (TDD)
3. **QA** → 회귀 테스트

### 디자인 변경 플로우
1. **Designer** → 디자인 가이드
2. **Accessibility** → 접근성 사전 검토
3. **Developer - UI** → 구현 (테스트 먼저)
4. **Designer** → 비주얼 리뷰

## 스킬 (자동화 워크플로우)

| 스킬 | 파일 | 트리거 |
|------|------|--------|
| 컴포넌트 생성 | `.claude/skills/create-component.md` | 새 컴포넌트 필요 시 |
| 피드 기능 추가 | `.claude/skills/add-feed-feature.md` | 피드 관련 기능 추가 시 |
| 테마 작업 | `.claude/skills/theme-work.md` | 테마/다크모드 작업 시 |

## 개발 우선순위 로드맵

### Phase 1 (MVP)
- [ ] 프로젝트 셋업 (Vite + React + TypeScript)
- [ ] 익명 세션 (UUID 자동 생성 + 닉네임 지연 입력)
- [ ] API 상태 모니터링 (30초 폴링)
- [ ] 상태 기반 화면 전환 (단일 루트, 라우트 분리 없음 — 정상→랜딩, 장애→피드)
- [ ] 기본 SNS 피드 (게시글 작성/조회, 닉네임 없이 읽기 가능)
- [ ] 닉네임 지연 입력 (작성 시 인라인 프롬프트, 세션 내 1회)
- [ ] 댓글 시스템

### Phase 2
- [ ] 피드 무한 스크롤

### Phase 3
- [ ] 다크/라이트 모드
- [ ] i18n (한국어/영어)

### Phase 4
- [ ] 사용자 프로필
- [ ] 알림 시스템
- [ ] 게시글 수정/삭제 (현재 세션에서만)
- [ ] 좋아요/리액션

## 핵심 아키텍처 결정 기록

| 결정 | 선택 | 근거 |
|------|------|------|
| SPA vs SSR | SPA (React + Vite) | 백엔드 별도, SEO 불필요, 터미널 느낌 유지 |
| 서버 상태 | TanStack Query v5 | API 폴링, 캐싱, 무한 스크롤 |
| 클라이언트 상태 | Zustand v5 | 경량, 보일러플레이트 최소 |
| 스타일링 | Tailwind CSS v4 | CLI 테마 커스터마이징, 다크모드 |
| 폰트 | MulmaruMono (물마루 Mono) | CLI 미학의 핵심 |
| 인증 | UUID 익명 세션 | 개인정보 불필요, 새로고침 = 새 세션 |
| 개발 방법론 | TDD | 테스트 먼저, 품질 보장, 3인 토론 기반 |

## Phase 1 API 상태

**Phase 1 백엔드 API 완성됨** (2026-03-08 확인)

- Swagger UI 참조: `.env`의 `API_DOCS_URL`
- 타입은 `openapi-typescript`로 자동 생성 (`npm run generate:api`)
