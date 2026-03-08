# 피드 기능 추가 스킬

## 트리거
피드 관련 새로운 기능을 추가할 때 이 워크플로우를 따릅니다.

## 워크플로우

### Step 1: TypeScript 타입 정의
`src/types/`에 필요한 타입을 정의합니다:
```typescript
// src/types/feed.ts
interface Post {
  id: string
  content: string
  nickname: string
  sessionId: string  // UUID - 작성자 세션 식별
  createdAt: string
  reactions: Reaction[]
  commentCount: number
}

interface Comment {
  id: string
  postId: string
  content: string
  nickname: string
  sessionId: string
  createdAt: string
}
```

규칙:
- 서버 응답과 클라이언트 타입 분리 (`ApiResponse<T>` wrapper)
- sessionId로 본인 게시글 여부 판별

### Step 2: TanStack Query Hook 생성
`src/apis/queries/`에 hook을 생성합니다:
```typescript
// src/apis/queries/usePosts.ts
export function usePosts(options?) {
  return useQuery({
    queryKey: ['posts'],
    queryFn: () => apiFetch<PostsResponse>('/api/posts'),
    staleTime: 30_000,  // 30초
    // ...options
  })
}

export function useCreatePost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreatePostInput) =>
      apiFetch<Post>('/api/posts', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}
```

규칙:
- `useQuery`: 적절한 staleTime, gcTime 설정
- `useMutation`: optimistic updates 또는 invalidation 적용
- 에러 핸들링: onError 콜백에서 토스트/알림
- 무한 스크롤: `useInfiniteQuery` 사용

### Step 3: 컴포넌트 구현
`src/components/feed/`에 컴포넌트를 구현합니다:

필수 상태 처리:
- **로딩**: 터미널 스타일 스켈레톤 (`Loading...` 깜빡이는 커서)
- **에러**: 터미널 에러 메시지 (`[ERROR] Failed to fetch posts`)
- **빈 상태**: `> No posts yet. Be the first to share!`
- **데이터**: CLI 미학 카드 리스트

세션 기반 권한:
- 현재 세션의 UUID와 게시글의 sessionId 비교
- 본인 게시글에만 수정/삭제 버튼 표시

### Step 4: 페이지 통합
`src/pages/`의 해당 페이지에 컴포넌트를 통합합니다:
- React.lazy로 코드 스플리팅 고려
- 라우트 파라미터 연결
- 레이아웃 컴포넌트 내 배치

### Step 5: i18n 키 추가
한국어/영어 번역 키를 등록합니다:
```json
// feed namespace
{
  "createPost": "게시글 작성",
  "noPostsYet": "아직 게시글이 없습니다",
  "loadMore": "더 보기",
  "deleteConfirm": "삭제하시겠습니까?"
}
```

### Step 6: 테스트 작성

#### Hook 테스트 (MSW)
```typescript
// src/apis/queries/usePosts.test.ts
- 성공 응답 시 데이터 반환 확인
- 에러 응답 시 에러 상태 확인
- mutation 후 캐시 무효화 확인
```

#### 컴포넌트 테스트
```typescript
// src/components/feed/FeedList.test.tsx
- 로딩 상태 렌더링
- 데이터 렌더링 (CLI 미학 요소 포함)
- 빈 상태 렌더링
- 사용자 인터랙션 (작성, 삭제)
- 세션 기반 권한 확인
```

### Step 7: 접근성 검증
- [ ] 키보드 내비게이션 (Tab, Enter, Escape)
- [ ] ARIA 속성 (aria-live for feed updates)
- [ ] 색상 대비 4.5:1
- [ ] 스크린 리더 호환

## 체크리스트
- [ ] 타입 정의 완료
- [ ] TanStack Query hook 생성
- [ ] 컴포넌트 구현 (4가지 상태 모두)
- [ ] 페이지 통합
- [ ] i18n 키 등록 (ko + en)
- [ ] 테스트 작성 (hook + component)
- [ ] 접근성 검증
- [ ] 다크/라이트 모드 확인
