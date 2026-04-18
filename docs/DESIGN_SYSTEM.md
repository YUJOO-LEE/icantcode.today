# DESIGN_SYSTEM.md — icantcode.today 디자인 시스템

---

## 1. 디자인 철학

### "비개발자가 보면 코딩하고 있는 것처럼 보여야 한다"

icantcode.today의 모든 UI는 CLI(Command Line Interface) 감성을 기반으로 한다.
터미널을 모르는 사람이 화면을 보면 개발자가 전문적인 작업을 하고 있다고 느껴야 한다.

### 핵심 원칙

| 원칙 | 설명 |
|------|------|
| **Terminal First** | 모든 컴포넌트는 CLI 도구처럼 보여야 한다 |
| **Function over Form** | 장식보다 기능성. 불필요한 그래픽 요소 배제 |
| **Monospace Everything** | MulmaruMono (물마루 Mono) 폰트 단일 사용 |
| **Text as UI** | 아이콘보다 텍스트 심볼 우선 (`>`, `$`, `#`, `[OK]`, `[ERR]`) |
| **Purposeful Animation** | 타이핑 효과, 커서 깜빡임만 — 과도한 애니메이션 금지 |

---

## 2. 컬러 팔레트

### 2.1 브랜드 컬러 (로고 기반)

```
Primary Accent  #ABC95B   ████  연두-올리브 그린 (icantcode 로고 컬러)
```

### 2.2 다크 모드 (기본)

```
Background      #121519   ████  딥 다크 (터미널 배경)
Surface         #1E2329   ████  카드/패널 배경
Border          #2D3440   ████  구분선, box-drawing 문자 색상
Text Primary    #E8E8E8   ████  주요 텍스트
Text Secondary  #8B9299   ████  보조 텍스트, 타임스탬프
Text Muted      #4A5568   ████  비활성 텍스트
```

### 2.3 라이트 모드

```
Background      #F5F5F0   ████  오프화이트 (종이 느낌)
Surface         #EAEAE4   ████  카드/패널 배경
Border          #C8C8C0   ████  구분선
Text Primary    #2D2D2D   ████  주요 텍스트
Text Secondary  #6B7280   ████  보조 텍스트
Text Muted      #9CA3AF   ████  비활성 텍스트
```

### 2.4 시맨틱 컬러

```
Success / Normal   #ABC95B   ████  API 정상 상태 (Primary와 동일)
Error / Down       #FF6B6B   ████  API 장애 상태
Warning / Degraded #FFD93D   ████  API 저하 상태
Info               #6BB5FF   ████  일반 정보
```

### 2.5 CSS 커스텀 프로퍼티 (theme.css)

**oklch() 색상공간 사용.** 3가지 테마 지원: `mono` (기본), `amber` (Retro CRT), `cyan` (Cyberpunk).
테마 전환은 `<html data-terminal="theme-name">` 속성으로 제어.

```css
/* Mono 테마 (기본) — 라이트 모드 */
:root {
  --background: oklch(0.98 0 0);
  --foreground: oklch(0.20 0 0);
  --card: oklch(0.96 0 0);
  --card-foreground: oklch(0.20 0 0);
  --primary: oklch(0.25 0 0);
  --primary-foreground: oklch(0.98 0 0);
  --secondary: oklch(0.94 0 0);
  --muted: oklch(0.92 0 0);
  --muted-foreground: oklch(0.50 0 0);
  --border: oklch(0.85 0 0);
  --destructive: oklch(0.50 0.18 25);
  --ring: oklch(0.40 0 0);
  --radius: 0;
}

/* Mono 테마 — 다크 모드 */
.dark {
  --background: oklch(0.10 0 0);
  --foreground: oklch(0.85 0 0);
  --card: oklch(0.14 0 0);
  --primary: oklch(0.90 0 0);
  --secondary: oklch(0.20 0 0);
  --muted: oklch(0.18 0 0);
  --muted-foreground: oklch(0.55 0 0);
  --border: oklch(0.28 0 0);
}
```

> **참고**: §2.1~2.4의 hex 값은 디자인 의도를 설명하기 위한 참조용입니다.
> 실제 구현은 oklch() 색상공간을 사용하며, 정확한 값은 `src/styles/theme.css`를 참조하세요.
> 추가 테마(amber, cyan)의 변수도 같은 네이밍 규칙을 따릅니다.

---

## 3. 타이포그래피

### 3.1 폰트 패밀리

**MulmaruMono (물마루 Mono) 단일 사용.** 모든 텍스트에 적용.

픽셀 도트 스타일의 모노스페이스 폰트. SIL 오픈 폰트 라이선스(OFL 1.1).

```css
/* 웹폰트 로딩 — self-host (LCP 최적화, 2026-04-19) */
@font-face {
    font-family: 'MulmaruMono';
    src: url('/fonts/MulmaruMono.woff2') format('woff2');
    font-weight: normal;
    font-display: swap;
}

/* 메트릭 조정 fallback — swap 시 CLS 최소화 */
@font-face {
    font-family: 'MulmaruMono Fallback';
    src: local('Menlo'), local('Consolas'), local('Courier New');
    font-display: swap;
    size-adjust: 100%;
    ascent-override: 90%;
    descent-override: 25%;
    line-gap-override: 0%;
}

font-family: 'MulmaruMono', 'MulmaruMono Fallback', monospace;
```

`index.html` 에 preload 필수:
```html
<link rel="preload" href="/fonts/MulmaruMono.woff2" as="font" type="font/woff2" crossorigin="anonymous" />
```

- 폰트 출처: https://noonnu.cc/font_page/1764
- 원 저장소: https://github.com/mushsooni/mulmaru
- 제작: Mushsooni
- 라이선스: SIL Open Font License 1.1 (`public/fonts/LICENSE_OFL.txt`)
- 일반 sans-serif 폰트는 사용하지 않는다. 서비스 전체가 터미널처럼 보여야 한다.

### 3.2 타입 스케일

| 이름 | 크기 | 용도 |
|------|------|------|
| `text-xs` | 11px | 타임스탬프, 메타 정보 |
| `text-sm` | 13px | 보조 텍스트, 라벨 |
| `text-base` | 15px | 본문, 피드 내용 |
| `text-lg` | 18px | 소제목 |
| `text-xl` | 22px | 제목 |
| `text-2xl` | 28px | 페이지 헤더 |
| `text-3xl` | 36px | 랜딩 히어로 텍스트 |

### 3.3 폰트 웨이트

```
Regular  (400)  →  본문, 피드 내용
Medium   (500)  →  사용자명, 라벨
Bold     (700)  →  헤더, 강조 텍스트
```

### 3.4 라인 하이트

```
Terminal 텍스트: line-height: 1.5   (가독성과 터미널 느낌 균형)
코드 블록:       line-height: 1.6
```

> **현재 구현**: Tailwind의 `leading-relaxed` (1.625) 클래스를 피드 본문 등에 사용.

---

## 4. CLI 컴포넌트 패턴

### 4.1 Box Drawing Characters

터미널 UI의 핵심 디자인 요소.

**현재 구현 (Phase 1):** TerminalCard는 CSS `border border-border`로 구현. 시각적으로 깔끔한 직선 테두리를 제공하며, 모든 화면 크기에서 안정적.

**Phase 2 계획:** 유니코드 Box-drawing 문자로 전환하여 더 강한 터미널 감성 부여.

```
┌─────────────────────────┐   상단 테두리
│ 내용                     │   사이드 테두리
├─────────────────────────┤   수평 구분선
│ 다른 내용                │
└─────────────────────────┘   하단 테두리
```

**문자 참조 (Phase 2용):**

| 문자 | 유니코드 | 용도 |
|------|----------|------|
| `┌` | U+250C | 좌상단 모서리 |
| `┐` | U+2510 | 우상단 모서리 |
| `└` | U+2514 | 좌하단 모서리 |
| `┘` | U+2518 | 우하단 모서리 |
| `─` | U+2500 | 수평선 |
| `│` | U+2502 | 수직선 |
| `├` | U+251C | 좌측 T분기 |
| `┤` | U+2524 | 우측 T분기 |
| `┼` | U+253C | 교차 |

### 4.2 프롬프트 심볼 및 포맷

**현재 구현:** TerminalPrompt는 `ls -l` 출력 형식을 사용:

```
-rw-r--r--  username  5m ago  #42
```

- `-rw-r--r--`: 파일 퍼미션 심볼 (장식용)
- `username`: 작성자 (`text-foreground`으로 강조)
- `5m ago`: 상대 타임스탬프
- `#42`: 게시물/댓글 ID

**Header:** SSH 접속 형식 사용:

```
username@icantcode.today:~$_
```

**프롬프트 심볼 (입력 필드용):**

| 심볼 | 의미 | 사용처 |
|------|------|--------|
| `>` | 일반 입력 프롬프트 | 게시물 작성, 댓글 입력 (TerminalInput 기본값) |
| `$` | 사용자 명령 | Header의 세션 표시 |

### 4.3 커서 애니메이션

```css
/* terminal.css */
@keyframes cursor-blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}

.cursor {
  display: inline-block;
  width: 0.6em;
  height: 1em;
  background-color: var(--primary);
  animation: cursor-blink 1s step-end infinite;
  vertical-align: text-bottom;
}

@media (prefers-reduced-motion: reduce) {
  .cursor {
    animation: none;
    opacity: 1;
  }
}
```

### 4.4 타임스탬프 형식

터미널 감성의 상대 시간 표시.

```
방금          →  "just now"  /  "방금"
1분 미만      →  "< 1m ago"  /  "방금 전"
1-59분        →  "5m ago"    /  "5분 전"
1-23시간      →  "3h ago"    /  "3시간 전"
1일 이상      →  "2d ago"    /  "2일 전"
7일 이상      →  "2026-03-01" (절대 날짜)
```

---

## 5. API 상태별 UI 정책

### 5.0 핵심 원칙: 장애 없으면 피드는 존재하지 않는다

API가 정상일 때 커뮤니티 피드는 **일절 노출하지 않는다**. 리스트, 작성 폼, 게시글 카운트 등 피드 관련 UI 요소가 화면에 전혀 보이지 않아야 한다.

| API 상태 | 화면 구성 | 피드 노출 |
|----------|-----------|-----------|
| **정상 (Normal)** | "지금은 코딩할 수 있어요. 일하러 가세요!" 메시지만 표시 | **완전 숨김** (컴포넌트 미렌더링) |
| **저하 (Degraded)** | 경고 배너 + 커뮤니티 피드 오픈 | 전체 노출 |
| **장애 (Down)** | 장애 배너 + 커뮤니티 피드 오픈 | 전체 노출 |
| **확인 중 (Checking)** | 상태 확인 애니메이션 | 숨김 |

### 정상 상태 랜딩 화면

```
┌──────────────────────────────────────┐
│                                      │
│    $ status --check                  │
│                                      │
│    [OK] Claude Code API is online    │
│                                      │
│    > 지금은 코딩할 수 있어요.         │
│    > 일하러 가세요!_                  │
│                                      │
│    ──────────────────────────────── │
│    # 피드는 장애 시에만 열립니다.     │
│                                      │
└──────────────────────────────────────┘
```

### 구현 규칙
- 피드 컴포넌트는 `display: none`이 아닌 **조건부 렌더링** (React에서 아예 마운트하지 않음)
- 정상 상태에서 피드 데이터 prefetch 하지 않음 (불필요한 API 호출 방지)
- 별도 라우트 없음: 단일 루트(`/`)에서 상태 기반 조건부 렌더링
- 장애 시 피드는 닉네임 없이도 즉시 읽기 가능

### 닉네임 지연 입력 UI

**핵심 원칙: 닉네임이 피드 읽기를 막아서는 안 된다.**

장애 시 피드는 닉네임 없이 즉시 표시된다. 닉네임은 게시글/댓글 **작성 시에만** 요청한다.

#### 닉네임 미설정 상태 — 작성 폼

작성 폼 클릭 시 닉네임 입력 프롬프트가 인라인으로 표시:

```
┌──────────────────────────────────────┐
│ $ set-nickname                       │
│ ──────────────────────────────────── │
│ # 게시글을 작성하려면 닉네임이        │
│ # 필요합니다.                        │
│                                      │
│ > Enter nickname: _                  │
│                                      │
│ [  > confirm  ]  [  > cancel  ]      │
└──────────────────────────────────────┘
```

#### 닉네임 설정 완료 — 작성 폼

```
┌──────────────────────────────────────┐
│ $ @my_nickname ~/compose             │
│ ──────────────────────────────────── │
│ > 무슨 일이 있나요?_                  │
│                                      │
│ [  > post  ]                         │
└──────────────────────────────────────┘
```

#### 헤더 닉네임 표시

헤더에 SSH 접속 형식으로 현재 세션 정보 표시:

```
닉네임 설정됨:    nickname@icantcode.today:~$_
닉네임 미설정:    guest@icantcode.today:~$_
```

#### 구현 규칙
- 닉네임 입력은 모달이 아닌 **인라인 프롬프트** (화면 전환 없음)
- 작성 폼 focus 시 닉네임 체크 → 미설정이면 프롬프트로 교체
- 닉네임 설정 후 원래 작성 폼으로 자동 복귀
- 헤더에 현재 닉네임 표시 (미설정 시 설정 유도 링크)

---

## 6. 피드 카드 스펙

### 6.1 기본 피드 카드 레이아웃

```
┌──────────────────────────────────────┐
│ > @username ~/feed $ 5m ago          │
│ ──────────────────────────────────── │
│ Claude API가 또 죽었네요...           │
│ 코드 짜다가 갑자기 멈춰버렸는데       │
│ 이럴 때마다 여기 오는 게 루틴됨       │
│ ──────────────────────────────────── │
│ ♥ 12  💬 3  > share                 │
└──────────────────────────────────────┘
```

### 6.2 피드 카드 상태별 변형

**내 게시물:**
```
┌──────────────────────────────────────┐
│ $ @me ~/feed $ just now          [x] │
│ ──────────────────────────────────── │
│ 내용...                              │
└──────────────────────────────────────┘
```

**시스템 메시지 (API 복구 알림):**
```
┌──────────────────────────────────────┐
│ # system ~/status $ now       [INFO] │
│ ──────────────────────────────────── │
│ [OK] Claude Code API 복구됨          │
│ [→] 이제 코딩하러 가세요!             │
└──────────────────────────────────────┘
```

---

## 7. 컴포넌트 카탈로그

### 7.1 Button (TerminalButton)

**현재 구현:** 테두리 없는 미니멀 텍스트 버튼. 대괄호로 감싸서 CLI 느낌 부여.

```
[run command]       기본 (text-muted-foreground)
[run command]       호버 시 text-foreground으로 밝아짐
[disabled]          비활성 (opacity 0.3)
```

**Tailwind 클래스:**

```
text-xs text-muted-foreground hover:text-foreground transition-colors
disabled:opacity-30 disabled:cursor-not-allowed
```

- border/padding 없음 — 텍스트 색상 전환만으로 인터랙션 표현
- 대괄호 `[텍스트]` 형식으로 CLI 명령어 감싸기
- `focus-visible:text-foreground`로 키보드 접근성 확보

### 7.2 Input

프롬프트 prefix가 붙는 터미널 스타일 입력창.

```
> █                              (빈 상태, 커서 표시)
> Claude API가 또...             (입력 중)
$ 닉네임 입력: hacker_dev       (닉네임)
```

**구조:**
```tsx
<div className="terminal-input-wrapper">
  <span className="prompt-symbol" aria-hidden="true">&gt;</span>
  <input type="text" className="terminal-input" placeholder="내용을 입력하세요..." />
</div>
```

### 7.3 Badge / Tag (TerminalBadge)

**현재 구현:** `variant` prop (`success` | `error` | `warning` | `info`) 수용하지만, 현재는 단색 렌더링.

```
[DOWN]      text-xs text-foreground (variant별 색상 미적용)
[OK]        동일
[WARN]      동일
```

**Phase 2 계획:** variant별 색상 배경 적용 (에러=빨강, 성공=초록, 경고=노랑)

### 7.4 Status Indicator

```
● NORMAL     초록 점 + 텍스트
● DOWN       빨간 점 (깜빡임) + 텍스트
● DEGRADED   노란 점 + 텍스트
○ CHECKING   회색 빈 점 + 텍스트
```

```css
@keyframes status-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.3; }
}

.status-dot.down {
  animation: status-pulse 1.5s ease-in-out infinite;
}
```

### 7.5 TerminalCard

**현재 구현:** 단순 래퍼 컴포넌트. CSS border로 카드 테두리.

```tsx
// 현재 구현
<TerminalCard>
  {/* border border-border bg-card p-4 */}
  <TerminalPrompt user="username" time="2026-03-09T10:00:00Z" id={42} />
  <p>게시물 내용</p>
</TerminalCard>
```

**Phase 2 계획:** 컴파운드 패턴(Header/Divider/Body/Footer)으로 확장, Box-drawing 문자 테두리 적용.

### 7.6 TypewriterText

```tsx
// 랜딩 페이지 히어로, 상태 메시지 등에 사용
<TypewriterText
  text="Claude Code API가 죽었습니다."
  speed={50}          // ms per character
  cursor={true}
/>
```

---

## 8. 다크 / 라이트 모드

### 8.1 기본값

시스템 설정 (`prefers-color-scheme`) 자동 감지 후 적용.
사용자가 수동 토글 시 `localStorage`에 저장.

### 8.2 전환 방식

`<html>` 태그의 `class`로 제어. Tailwind v4 `dark:` variant와 CSS 변수를 조합.

```typescript
// stores/themeStore.ts
const setTheme = (theme: 'dark' | 'light') => {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  localStorage.setItem('theme', theme);
};
```

### 8.3 라이트 모드 특이사항

라이트 모드에서도 CLI 감성을 유지해야 한다.

- 배경: 완전 흰색 대신 오프화이트 `#F5F5F0` (종이/에디터 느낌)
- 텍스트: 완전 검정 대신 `#2D2D2D` (눈 피로 감소)
- Box-drawing 문자: 테두리 컬러 `#C8C8C0`으로 충분한 대비 유지

---

## 9. 반응형 디자인

### 9.1 브레이크포인트

```
xs:  320px   (최소 모바일)
sm:  640px   (대형 모바일, 소형 태블릿)
md:  768px   (태블릿)
lg:  1024px  (소형 데스크톱)
xl:  1280px  (대형 데스크톱)
```

### 9.2 레이아웃 전략

**Mobile First** 원칙. 모든 컴포넌트는 320px에서 시작.

**현재 구현:** `max-w-3xl` (768px) 고정 너비, `px-4` 좌우 패딩, `mx-auto` 중앙 정렬.

| 화면 크기 | 레이아웃 |
|----------|---------|
| ~768px | 단일 컬럼. 피드 카드 풀 너비 (`px-4`) |
| 768px~ | `max-w-3xl` (768px) 중앙 정렬 |

### 9.3 모바일에서의 CLI 감성 유지

- box-drawing 문자: 작은 화면에서도 유지 (font-size 줄이지 않음)
- 프롬프트 라인: 긴 경우 말줄임표 처리 (`overflow: hidden; text-overflow: ellipsis`)
- 터치 타겟: 최소 44x44px (WCAG 권장) — 버튼 패딩으로 확보

---

## 10. 애니메이션 가이드라인

### 10.1 허용되는 애니메이션

| 애니메이션 | 용도 | 지속시간 |
|-----------|------|---------|
| 커서 깜빡임 | Cursor 컴포넌트 | 1s 루프 |
| 타이핑 효과 | TypewriterText | 내용 길이에 비례 |
| 상태 점 깜빡임 | StatusBanner (DOWN) | 1.5s 루프 |
| 페이드인 | 페이지 전환, 피드 아이템 등장 | 200-300ms |
| 슬라이드업 | 새 게시물 등장 | 300ms |

### 10.2 금지되는 애니메이션

- 과도한 bounce, spring 효과
- 3D transform, perspective 회전
- 배경 파티클, 그라데이션 이동
- 불필요한 hover scale 확대

### 10.3 `prefers-reduced-motion` 대응

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

TypewriterText: `prefers-reduced-motion`이 활성화된 경우 텍스트를 즉시 표시.

### 10.5 커스텀 스크롤바

`terminal.css`에 정의된 WebKit 스크롤바 스타일:

```css
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border); }
::-webkit-scrollbar-thumb:hover { background: var(--muted-foreground); }
```

기본 스크롤바 대신 얇은 6px 폭의 미니멀 스크롤바로 터미널 감성 유지.

### 10.4 motion (구 framer-motion) 사용 패턴

```tsx
// 페이지 전환
const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -8 },
};

<motion.div
  variants={pageVariants}
  initial="initial"
  animate="animate"
  exit="exit"
  transition={{ duration: 0.2, ease: 'easeOut' }}
>

// 피드 아이템 등장
const feedItemVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};
```

---

## 11. 접근성 (Accessibility)

### 11.1 목표 기준

**WCAG 2.1 AA 준수**

### 11.2 색상 대비

| 조합 | 비율 | 통과 여부 |
|------|------|---------|
| `#E8E8E8` on `#121519` (다크 본문) | 13.7:1 | AAA |
| `#ABC95B` on `#121519` (다크 Primary) | 7.2:1 | AAA |
| `#2D2D2D` on `#F5F5F0` (라이트 본문) | 12.1:1 | AAA |
| `#FF6B6B` on `#121519` (다크 에러) | 4.8:1 | AA |
| `#8B9299` on `#121519` (다크 보조) | 4.6:1 | AA |

모든 텍스트 색상 조합은 최소 4.5:1 대비율 유지.

### 11.3 키보드 네비게이션

- 모든 인터랙티브 요소 Tab 접근 가능
- 포커스 아웃라인 명확히 표시 (`:focus-visible` 사용)
- 피드 카드: 카드 전체가 아닌 개별 버튼에 포커스
- 모달/오버레이: 열릴 때 포커스 이동, 닫힐 때 원위치 복귀

### 11.4 스크린리더 지원

```tsx
// 상태 인디케이터
<span className="status-dot" aria-hidden="true">●</span>
<span className="sr-only">API 상태: 장애 발생</span>

// box-drawing 문자는 aria-hidden 처리
<span aria-hidden="true">┌─────┐</span>

// 타임스탬프
<time dateTime="2026-03-08T10:30:00Z" title="2026년 3월 8일 10:30">
  5m ago
</time>

// 반응 버튼
<button aria-label="좋아요 12개, 좋아요 누르기">
  <span aria-hidden="true">♥ 12</span>
</button>
```

### 11.5 `aria-live` 영역

API 상태 변경, 새 게시물 등장 등 동적 변경사항을 스크린리더에 알림.

```tsx
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {statusMessage}  {/* "Claude Code API 장애가 감지되었습니다." */}
</div>
```

---

## 12. 아이콘 / 심볼 시스템

외부 아이콘 라이브러리 사용하지 않는다. 텍스트 심볼과 유니코드 문자로 대체.

| 의미 | 심볼 | 대안 |
|------|------|------|
| 좋아요 | `♥` | `[like]` |
| 댓글 | `💬` | `[reply]` |
| 공유 | `↻` | `[share]` |
| 삭제 | `[x]` | `×` |
| 성공 | `[OK]` | `✓` |
| 에러 | `[ERR]` | `✗` |
| 경고 | `[WARN]` | `!` |
| 로딩 | `...` / `▌` | 점 세 개 |
| 설정 | `[config]` | `⚙` |

---

*마지막 업데이트: 2026-03-09*
