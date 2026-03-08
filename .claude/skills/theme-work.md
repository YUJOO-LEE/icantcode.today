# 테마/다크모드 작업 스킬

## 트리거
테마 관련 작업, 다크/라이트 모드 수정, 색상 변경 시 이 워크플로우를 따릅니다.

## 워크플로우

### Step 1: CSS 변수 확인/수정
`src/styles/theme.css`에서 테마 변수를 관리합니다:

```css
:root {
  /* Light Mode (기본) + Brand/Semantic */
  --color-bg: #F5F5F0;
  --color-text: #2D2D2D;
  --color-primary: #ABC95B;
  --color-error: #FF6B6B;
  --color-success: #ABC95B;
  --color-warning: #FFD93D;
  --color-border: #D1D1D1;
  --color-card-bg: #FFFFFF;
  --color-terminal-prompt: #2D2D2D;
}

/* Dark mode: <html class="dark"> + Tailwind dark: variant */
.dark {
  --color-bg: #121519;
  --color-text: #E8E8E8;
  --color-primary: #ABC95B;
  --color-error: #FF6B6B;
  --color-success: #ABC95B;
  --color-warning: #FFD93D;
  --color-border: #2A2D35;
  --color-card-bg: #1A1D24;
  --color-terminal-prompt: #ABC95B;
}
```

규칙:
- 테마 전환: `<html>` 태그의 `class="dark"` 토글로 제어 (Tailwind v4 `dark:` variant)
- 새 색상 추가 시 반드시 light/dark 양쪽 정의
- 의미 기반 이름 사용 (color-bg, color-error 등)
- 로고 기반 팔레트 유지

### Step 2: Tailwind 설정 동기화
CSS 변수를 Tailwind 테마에 연결합니다:

```javascript
// tailwind.config.js
theme: {
  extend: {
    colors: {
      bg: 'var(--color-bg)',
      text: 'var(--color-text)',
      primary: 'var(--color-primary)',
      error: 'var(--color-error)',
      // ...
    }
  }
}
```

규칙:
- Tailwind 클래스에서 `bg-bg`, `text-text`, `text-primary` 등으로 사용
- Tailwind `dark:` variant + CSS 변수 조합으로 테마 전환
- 하드코딩 색상값 절대 금지

### Step 3: 컴포넌트 스타일 확인
영향받는 모든 컴포넌트를 확인합니다:

체크 항목:
- [ ] 모든 색상이 CSS 변수/Tailwind 토큰 사용하는지
- [ ] 하드코딩된 색상값이 없는지
- [ ] Box-drawing 문자 (┌─┐│└─┘)가 양쪽 모드에서 보이는지
- [ ] 프롬프트 기호 (>, $, #)가 적절한 색상인지
- [ ] 커서 깜빡임 애니메이션이 양쪽에서 동작하는지
- [ ] 호버/포커스 상태가 양쪽 모드에서 구분 가능한지
- [ ] 스크롤바 스타일이 테마와 일치하는지

### Step 4: 접근성 (색상 대비) 검증
WCAG 2.1 AA 기준 충족 확인:

| 항목 | 다크 모드 | 라이트 모드 | 기준 |
|------|-----------|-------------|------|
| 본문 텍스트 | #E8E8E8 on #121519 | #2D2D2D on #F5F5F0 | 4.5:1+ |
| Primary 액센트 | #ABC95B on #121519 | #ABC95B on #F5F5F0 | 4.5:1+ |
| 에러 텍스트 | #FF6B6B on #121519 | #FF6B6B on #F5F5F0 | 4.5:1+ |
| 경고 텍스트 | #FFD93D on #121519 | #FFD93D on #F5F5F0 | 4.5:1+ |

대비 부족 시:
- 다크 모드에서 밝기 조정
- 라이트 모드에서 어둡기 조정
- 필요시 대체 색상 제안

### Step 5: 테마 전환 테스트

#### Zustand Store
```typescript
// src/stores/themeStore.ts
- toggle() 함수 동작 확인
- localStorage 저장/불러오기
- 시스템 설정 (prefers-color-scheme) 감지
```

#### 동작 테스트
- [ ] 토글 버튼 클릭 시 즉시 전환
- [ ] localStorage에 테마 설정 저장
- [ ] 페이지 새로고침 후 저장된 테마 복원
- [ ] 첫 방문 시 시스템 설정 따름
- [ ] 테마 전환 시 깜빡임(flash) 없음
- [ ] 부드러운 전환 애니메이션 (150ms)

#### Vitest 테스트
```typescript
describe('Theme', () => {
  it('toggles between dark and light mode')
  it('persists theme preference in localStorage')
  it('applies system preference on first visit')
  it('maintains CLI aesthetic in both modes')
})
```

## 체크리스트
- [ ] CSS 변수 light/dark 양쪽 정의
- [ ] Tailwind 테마 연결 확인
- [ ] 모든 컴포넌트 테마 토큰 사용 확인
- [ ] 색상 대비 4.5:1 이상 (AA 기준)
- [ ] CLI 미학 양쪽 모드 유지
- [ ] 테마 전환 깜빡임 없음
- [ ] localStorage 저장/복원 동작
- [ ] 테스트 통과
