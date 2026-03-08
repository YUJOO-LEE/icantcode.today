# Code Conventions

> 5명의 개발 에이전트(Architect, Dev-Feature, Dev-UI, Dev-Infra, QA)가 3라운드 토론을 거쳐 합의한 코드 작성 철학과 판단 기준.
> CLAUDE.md의 파일 구조, 네이밍, CLI 미학, i18n, git 등 형식 규칙과는 별개로, **"왜 이렇게 짜는가"** 에 집중한다.

---

## 1. 설계 철학 (Design Philosophy)

### Kent Beck의 Simple Design 4규칙 (우선순위 순)

1. **테스트를 통과한다** — 동작하지 않는 코드는 가치가 없다
2. **의도를 드러낸다** — 읽는 사람이 "왜"를 알 수 있어야 한다
3. **중복이 없다** — 단, 우연의 중복은 제외 (5장 참고)
4. **요소가 최소다** — 위 3개를 만족하면 더 줄일 것이 없는지 확인한다

### YAGNI: 지금 필요한 것만 만들어라

이 앱은 단일 페이지 SPA다. Router를 지웠고 axios를 지웠다 — 이것이 프로젝트의 정신이다.
"나중에 필요할 수도 있으니까"는 코드를 추가하는 이유가 되지 않는다.

---

## 2. 컴포넌트 & 훅 설계 (Component & Hook Design)

### 훅 분리 기준

훅을 별도 파일로 분리하는 조건은 **둘 중 하나를 충족할 때만**:

1. **2곳 이상에서 재사용**된다
2. **독립 테스트가 필요한 복잡도**를 가진다 (분기 3개 이상, 또는 비동기 흐름)

나머지는 컴포넌트 내 인라인이 기본값이다.

```tsx
// ❌ 한 곳에서만 쓰는 단순 로직을 분리
const useToggle = () => useState(false);

// ✅ 컴포넌트 안에서 인라인
const [open, setOpen] = useState(false);
```

> **왜**: 파일 분리는 탐색 비용을 만든다. 분리의 이점이 비용을 넘을 때만 분리한다.

### Context API 사용 범위

Context는 **컴포넌트 내부 composition** (예: Compound Component 패턴)에만 허용한다.
전역 상태에는 Zustand, 서버 상태에는 TanStack Query를 사용한다.

```tsx
// ❌ Context로 전역 상태 관리
const ThemeContext = createContext<Theme>(defaultTheme);

// ✅ Zustand store
const useThemeStore = create<ThemeState>((set) => ({ ... }));
```

> **왜**: Context는 Provider 트리 깊이에 따라 디버깅이 어려워지고, 불필요한 리렌더를 유발한다.

---

## 3. 타입 설계 (TypeScript Practices)

### enum 금지 → as const + Union Type

```ts
// ❌ enum — Vite/esbuild에서 tree-shaking 불가
enum Status { Active, Inactive }

// ✅ as const — 런타임 0바이트, 완전한 타입 추론
const STATUS = { Active: 'active', Inactive: 'inactive' } as const;
type Status = typeof STATUS[keyof typeof STATUS];
```

> **왜**: enum은 esbuild에서 const enum조차 제대로 처리하지 못하고, 번들 크기를 늘린다.

### Utility Type 체인 금지

```ts
// ❌ 해독 불가능한 타입 체인
type Result = Pick<Omit<Partial<Post>, 'id'>, 'title' | 'content'>;

// ✅ 명시적 interface
interface PostDraft { title: string; content: string; }
```

> **왜**: 타입이 코드보다 복잡하면 타입이 문제다. 읽는 사람이 3초 안에 이해할 수 없으면 새 interface를 만든다.

### Generic 사용 조건

Generic은 **2개 이상 타입에서 실제로 재사용될 때만** 작성한다. 단일 타입 전용 Generic은 과잉 추상화다.

### as 타입 단언 제한

`as`는 **외부 데이터 파싱 직후**에만 허용한다 (API 응답, JSON 파싱 등).
내부 코드에서 as가 필요하면 타입 설계가 잘못된 것이다.

```ts
// ❌ 내부 코드에서 타입 단언
const value = store.get('key') as string;

// ✅ 타입 가드로 안전하게
const value = store.get('key');
if (typeof value !== 'string') throw new Error('Expected string');
```

> **왜**: as는 타입 시스템의 안전장치를 우회한다. 외부 경계에서만 사용해야 런타임 에러를 줄인다.

---

## 4. 에러 처리 (Error Handling)

### 3레이어 구조

각 레이어는 **자체 완결**한다. 상위로 재전파하지 않는다.

| 레이어 | 책임 | 구현 |
|--------|------|------|
| **API 상태 감지** | 앱 전체 outage 상태 전환 | `statusStore` + polling |
| **전역 에러** | 네트워크 에러 → 토스트 알림 | `QueryClient` defaultOptions |
| **컴포넌트 에러** | 데이터 없음 → fallback UI | inline `isError` 체크 |

```tsx
// ❌ 컴포넌트에서 네트워크 에러까지 처리
if (error?.status === 503) showOutageScreen();

// ✅ 컴포넌트는 자기 레이어만 처리
if (isError) return <ErrorFallback message={t('feed.loadFailed')} />;
```

> **왜**: 에러 처리가 레이어를 넘으면 책임이 흩어지고, 같은 에러를 여러 곳에서 중복 처리하게 된다.

### try-catch 최소화

TanStack Query가 에러를 잡아주므로, 컴포넌트에서 try-catch를 직접 작성할 일은 거의 없다.
try-catch는 **Query 외부의 비동기 작업** (예: clipboard API, localStorage)에서만 사용한다.

> **왜**: 불필요한 try-catch는 에러를 삼키고 디버깅을 어렵게 만든다.

---

## 5. 추상화 원칙 (When to Abstract)

### 우연의 중복 (Accidental Duplication)

코드가 **우연히 같아도 도메인이 다르면 병합하지 않는다**.

```tsx
// ❌ 도메인이 다른 코드를 억지로 합침
function formatEntity(entity: Post | Comment) { ... }

// ✅ 각 도메인이 독립적으로 진화
function formatPost(post: Post) { ... }
function formatComment(comment: Comment) { ... }
```

> **왜**: 우연히 같은 코드를 합치면, 한쪽 요구사항이 바뀔 때 다른 쪽까지 영향을 받는다.

### 추상화 타이밍

추상화는 **"3번 반복"이 아니라 "동일한 변경 압력이 실제로 발생했을 때"** 한다.
3번 반복되더라도 변경 이유가 다르면 각각 두는 것이 낫다.

### 헬퍼 함수 / 유틸리티

일회성 연산을 위한 헬퍼를 만들지 않는다.
비슷한 코드 3줄이 premature abstraction보다 낫다.

> **왜**: 추상화는 코드를 줄이지만 의존성을 늘린다. 의존성은 변경 비용이다.

---

## 6. 테스트 원칙 (Testing Philosophy)

### Snapshot 테스트 금지

```tsx
// ❌ 깨지기 쉽고 의미 없는 스냅샷
expect(tree).toMatchSnapshot();

// ✅ 동작 검증
expect(screen.getByRole('button', { name: /submit/i })).toBeEnabled();
```

> **왜**: 스냅샷은 "무엇이 바뀌었는지"만 알려주고 "무엇이 잘못되었는지"는 알려주지 않는다.

### 테스트 필수 vs 선택

| 필수 | 선택 |
|------|------|
| 비즈니스 로직 (피드 CRUD) | 순수 시각적 렌더링 |
| 세션 UUID 생성 | 단순 레이아웃 배치 |
| 닉네임 지연 입력 플로우 | 정적 텍스트 표시 |
| API 상태 전환 (outage ↔ normal) | |

### 테스트 데이터: Factory 함수

테스트마다 인라인 객체를 만들지 않는다. Factory 함수로 기본값을 제공하고 필요한 부분만 override한다.

```ts
// ✅ factory로 일관된 테스트 데이터
const post = createPost({ title: 'test' });
```

> **왜**: 테스트 데이터 중복은 스키마 변경 시 수십 개 테스트를 깨뜨린다.

### 구현이 아닌 동작을 테스트

`getByRole`, `getByText`로 사용자가 보는 것을 테스트한다.
내부 state나 함수 호출을 직접 검증하지 않는다.

> **왜**: 구현 테스트는 리팩터링할 때마다 깨진다. 동작 테스트는 기능이 바뀔 때만 깨진다.

---

## 7. 성능 (Performance)

### 측정 먼저, 최적화 나중

성능 문제가 **측정으로 확인되기 전에는** 최적화 코드를 추가하지 않는다.
React DevTools Profiler 또는 `console.time`으로 병목을 확인한 뒤에 대응한다.

> **왜**: 추측 기반 최적화는 코드 복잡도만 올리고 실제 병목을 놓친다.

### Memoization 가이드

| Hook | 사용 조건 | 불필요한 경우 |
|------|-----------|---------------|
| `useCallback` | 자식에 함수 prop 전달 / useEffect deps 안정화 | 이벤트 핸들러 인라인 |
| `useMemo` | 계산 비용이 명백한 경우 (배열 정렬, 필터링 등) | 단순 객체 생성 |
| `React.memo` | 부모 리렌더 빈번 + 자식 렌더 비용 높음 | 가벼운 leaf 컴포넌트 |

```tsx
// ❌ 모든 함수에 useCallback
const handleClick = useCallback(() => setOpen(true), []);

// ✅ 자식 전달 시에만
<ChildComponent onToggle={useCallback(() => setOpen(v => !v), [])} />
```

> **왜**: 불필요한 memoization은 메모리를 소비하고 코드를 읽기 어렵게 만든다.

### 리스트 key 규칙

배열 index를 key로 사용하지 않는다. 서버에서 받은 고유 ID 또는 생성한 UUID를 사용한다.

> **왜**: index key는 항목 순서가 바뀔 때 잘못된 DOM 재사용을 유발한다.

---

## 8. 규제하지 않는 것 (Developer's Choice)

다음은 개발자 재량에 맡긴다. 일관성을 위한 강제 규칙을 두지 않는다.

- **화살표 함수 vs function 키워드** — 둘 다 허용, 혼용 가능
- **주석 형식** — 단, "왜"를 설명하는 주석만 가치 있음. "무엇"을 설명하는 주석은 코드가 대신한다
- **변수 분리 수준** — 가독성 판단은 작성자에게 위임
- **Tailwind 클래스 순서** — `prettier-plugin-tailwindcss`가 자동 정렬

> **왜**: 취향의 영역을 규칙으로 만들면 코드 리뷰가 본질에서 벗어난다.
