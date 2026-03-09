# Designer Agent — icantcode.today

## 역할
CLI 미학 디자인 시스템의 심미성, 일관성, 레이아웃을 통합 관리합니다.

## 1. 핵심 원칙

> "비개발자가 보면 코딩하는 것처럼 보여야 한다"

1. **터미널 우선**: "터미널 안의 텍스트"를 표현 — 윈도우 크롬(신호등 도트, 타이틀바) 없음
2. **Function over Form**: 장식보다 기능성. 불필요한 그래픽 요소 배제
3. **Monospace Everything**: MulmaruMono (물마루 Mono) 단일 사용
4. **Text as UI**: 아이콘보다 텍스트 심볼 우선 (`>`, `$`, `#`, `[OK]`, `[ERR]`)

---

## 2. 심미성 (Aesthetics)

### CRT 효과 (다크모드 전용)
- `repeating-linear-gradient`를 통한 섬세한 스캔라인 (`terminal.css`)
- 최대 opacity 0.04 — 분위기 형성용, 절대 눈에 거슬리지 않게
- `prefers-reduced-motion` 시 비활성화

### 형광체 발광 (Phosphor Glow)
- 다크모드 호버 시 box-shadow로 발광 효과:
  ```css
  box-shadow: 0 0 0 1px rgba(171,201,91,0.15), 0 0 30px rgba(171,201,91,0.06);
  ```

### 시각적 계층 (다크모드)
- 배경 → 서피스(카드) → 보더 → 텍스트 순 밝기 증가
- oklch 색상공간 사용 (theme.css 참조)

### 애니메이션 원칙
- 슬라이드보다 **opacity 전환** 선호 (타이핑 느낌)
- 스태거: 피드 아이템 간 0.08초
- 마이크로 인터랙션: 0.15-0.2초
- 액티브 피드백: 버튼 누를 때 `translateY(1px)`
- 금지: bounce, 3D transform, 배경 파티클, hover scale 확대

---

## 3. 일관성 (Consistency)

### 컬러 토큰 규칙
- **모든 색상은 CSS 변수를 통해 사용** — 하드코딩 금지
- theme.css의 oklch() 기반 변수: `--background`, `--foreground`, `--card`, `--border`, `--primary`, `--muted`, `--muted-foreground`, `--destructive` 등
- 3가지 테마 지원: mono (기본), amber (Retro CRT), cyan (Cyberpunk)

### 간격 시스템
- 카드 간: `mb-4`
- 카드 내부 패딩: `p-4`
- 헤더/푸터: `py-2`
- Tailwind 스케일만 사용 (정당한 이유 없는 임의 값 금지)

### 타이포그래피 계층
- 피드 본문: `text-base`
- 댓글/보조: `text-sm`
- 메타 정보/타임스탬프: `text-xs`
- 아이콘/텍스트 심볼: 이모지 대신 `▸`, `▾`, `●`, `○` 사용

### 리뷰 체크리스트
- [ ] 모든 간격이 Tailwind 스케일 사용
- [ ] 타이포그래피가 디자인 시스템 계층 준수
- [ ] 컴포넌트 파일에 하드코딩된 색상 없음
- [ ] 뱃지 스타일 통일 (text-xs, 대괄호 표기 `[TEXT]`)
- [ ] 프롬프트 심볼 일관적

---

## 4. 레이아웃 (Layout)

### 페이지 구조
```
<Layout>                      <!-- min-h-screen bg-background font-mono -->
  <Header />                  <!-- border-b, py-2, max-w-3xl -->
  <main>                      <!-- max-w-3xl mx-auto px-4 py-6 -->
    {children}
  </main>
  <Footer />                  <!-- border-t -->
</Layout>
```

### 반응형 브레이크포인트
- `< 640px` (모바일): 단일 컬럼, 컴팩트 간격
- `>= 640px` (태블릿): 표준 간격
- `>= 1024px` (데스크탑): 편안한 읽기 너비
- 현재 구현: `max-w-3xl` (768px) 고정

### 접근성 체크리스트 (WCAG 2.1 AA)
- [ ] 모든 인터랙티브 요소에 `aria-label` 또는 시각적 텍스트
- [ ] `<time>` 요소에 `dateTime` 속성
- [ ] 동적 콘텐츠 변경 시 포커스 관리
- [ ] 상태 업데이트에 `role="status"` 및 `aria-live`
- [ ] 색상 대비 최소 4.5:1

---

## 5. 현재 컴포넌트 구현 현황

| 컴포넌트 | 현재 구현 | 문서 목표 (Phase 2) |
|---------|----------|-------------------|
| TerminalCard | CSS `border border-border` | Box-drawing 문자 테두리 |
| TerminalBadge | `variant` prop 존재, 단색 렌더링 `[TEXT]` | variant별 색상 배경 |
| TerminalButton | 테두리 없는 텍스트 `[TEXT]`, hover시 색상 변경 | border + padding 스타일 |
| TerminalPrompt | `-rw-r--r-- user time #id` (ls -l 형식) | `> @user ~/feed $` 프롬프트 형식 |
| Header | `username@icantcode.today:~$` SSH 형식 | 동일 |

---

## 참조 파일
- `src/styles/theme.css` — oklch 컬러 토큰 (mono/amber/cyan 테마)
- `src/styles/terminal.css` — CRT 스캔라인, 커서 애니메이션, 스크롤바
- `src/components/ui/` — TerminalCard, TerminalPrompt, TerminalButton, TerminalBadge, TerminalInput
- `docs/DESIGN_SYSTEM.md` — 전체 디자인 시스템 문서