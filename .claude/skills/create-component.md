# 컴포넌트 생성 스킬

## 트리거
새로운 React 컴포넌트를 생성할 때 이 워크플로우를 따릅니다.

## 워크플로우

### Step 1: 컴포넌트 타입 판별 및 폴더 배치
컴포넌트의 성격에 따라 올바른 디렉토리에 배치합니다:

| 타입 | 경로 | 예시 |
|------|------|------|
| UI 프리미티브 | `src/components/ui/` | TerminalPrompt, TerminalCard, TerminalButton |
| 피드 관련 | `src/components/feed/` | FeedList, FeedItem, FeedComposer |
| 댓글 관련 | `src/components/comment/` | CommentList, CommentItem |
| 상태 표시 | `src/components/status/` | StatusIndicator, StatusBanner |
| 레이아웃 | `src/components/layout/` | Header, Footer, Layout |
| 공통/유틸 | `src/components/common/` | ThemeToggle, LanguageSwitch |

### Step 2: .tsx 파일 생성
```typescript
// src/components/{category}/{ComponentName}.tsx

interface ComponentNameProps {
  // props 정의
}

export function ComponentName({ ...props }: ComponentNameProps) {
  return (
    // CLI 미학 스타일 기본 적용
  )
}
```

규칙:
- PascalCase 파일명
- Props 인터페이스는 파일 상단에 정의 (I 접두사 없음)
- 함수형 컴포넌트만 사용
- default export 대신 named export 사용

### Step 3: CLI 미학 기본 스타일 적용
- `font-family: 'MulmaruMono (물마루 Mono)', monospace` (Tailwind: `font-mono`)
- 카드/컨테이너: Box-drawing 문자 (┌─┐│└─┘) 또는 `border` 스타일
- 인터랙티브 요소: 프롬프트 기호 (>, $, #) 접두사
- 다크/라이트 모드 대응: `dark:` variant 사용
- 색상: CSS 변수 또는 Tailwind 테마 토큰만 사용 (하드코딩 금지)

### Step 4: 테스트 파일 생성
```typescript
// src/components/{category}/{ComponentName}.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ComponentName } from './ComponentName'

describe('ComponentName', () => {
  it('renders correctly', () => {
    render(<ComponentName />)
    // 기본 렌더링 검증
  })
})
```

### Step 5: i18n 키 등록
- 해당 네임스페이스에 한국어/영어 키 추가
- 네임스페이스: common, feed, auth, status
- 키 네이밍: camelCase (예: `feed.createPost`)

### Step 6: barrel export (해당 시)
해당 카테고리의 index.ts에 export 추가:
```typescript
export { ComponentName } from './ComponentName'
```

## 체크리스트
- [ ] 올바른 폴더에 배치되었는가
- [ ] Props 인터페이스가 정의되었는가
- [ ] CLI 미학 스타일이 적용되었는가
- [ ] 다크/라이트 모드가 대응되었는가
- [ ] 테스트 파일이 생성되었는가
- [ ] i18n 키가 등록되었는가
- [ ] 접근성 (ARIA, 키보드) 고려되었는가
