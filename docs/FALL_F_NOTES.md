# fall -f — Implementation Decision Notes

> 구현 중 발생한 모호한 부분에 대해 작성자가 채택한 결정과 근거.
> 본 문서는 사용자 검토용. 필요 시 PR 코멘트나 후속 작업으로 조정.
>
> 기준 문서:
>
> - 스펙: [`./FALL_F.md`](./FALL_F.md) §A
> - 플랜: [`./FALL_F_PLAN.md`](./FALL_F_PLAN.md)

## 1. 라우팅 — Hash Routing 채택 (no new dependency)

**플랜 §3.1** 에서 `react-router` 도입 vs 커스텀 해시 라우팅 두 옵션 제시.

**채택**: 커스텀 해시 라우팅 (`useHashRoute` 훅 + 가벼운 `<Link>` 컴포넌트).

**근거**:

- CLAUDE.md 의 "라이브러리 추가 전 반드시 사용자에게 물어보기" 원칙. 사용자
  부재 상황에서 새 의존성을 임의로 추가하지 않음.
- SPA + Cloudflare Pages 환경. 해시 라우팅은 서버 라우팅 설정이 필요 없어
  배포 부담이 0. 새로고침/공유 링크가 깨지지 않음.
- 게임은 외부 SEO 대상이 아님(스펙 §A.10 — 별도 SEO 처리 없음, 카탈로그도
  내부 도구 성격). 해시 URL의 SEO 단점은 본 페이지 영향 없음.
- 기존 `/` 경로(피드/랜딩)에는 영향 없음. `index.html` 은 그대로.

**구현 위치**:

- `src/hooks/useHashRoute.ts` — 현재 해시 + 훅으로 변경 추적.
- `src/components/common/Link.tsx` — `<a href="#/...">` 래퍼.
- `App.tsx` — 해시 기반 라우팅 분기.

향후 `react-router` 가 필요해지면 (예: 게임 외 페이지 다수 추가) 마이그레
이션 가능. 현재 의존성 표면이 작아 비용은 낮음.

## 2. 폰트 — DejaVu Sans Mono 서브셋 미도입

**플랜 §3.2 + 스펙 §A.11** 에서 DejaVu Sans Mono 서브셋(woff2) 추가 권장.

**채택**: 추가하지 않음. 기존 `MulmaruMono Fallback` (`local('Menlo')`,
`local('Consolas')`, `local('Courier New')`) 체인이 U+2500–U+259F (Box
Drawing + Block Elements) 를 모두 커버함.

**근거**:

- 스펙은 "MulmaruMono 가 박스 드로잉을 깔끔히 지원하지 않으면 보완용 서브셋"
  관점. macOS Menlo / Windows Consolas / Linux DejaVu 모두 해당 영역을
  표준 지원.
- 새 정적 자산을 추가하지 않아 빌드/캐시/라이선스 처리 부담 0.
- 사용자가 한 번 검수 후 차이가 보이면 후속 작업으로 서브셋 woff2 만 떨궈
  넣고 `@font-face` 한 줄 추가하면 됨 (롤백 가능한 결정).

향후 운영 중 글리프 폭/베이스라인 어긋남 발견 시 재검토.

## 3. SOLVABILITY — `[TUNING]` 시작값 그대로 채택

| 키 | 값 | 출처 |
|---|---|---|
| `shortLineRatio` | 0.30 | `[TUNING]` |
| `shortLineRunCap` | 3 | `[TUNING]` |
| `adjacencyMaxGapCells` | 5 | 스펙 §1.3b 예시 + `[TUNING]` |

플레이테스트 후 조정 가능. 본 MVP 단계에서는 플랜이 권장한 값 그대로 사용.

## 4. 라인 풀 크기 — 작게 시작

플랜 §6 "modest pool, grow as needed". 정적 그룹 ~20 개, 동적 그룹 2 종
(shrink-right, fill-right). R-1/R-2 보장에 충분. 단조롭다고 느껴지면
후속 작업으로 추가.

## 5. 게임 캐릭터 출생 위치

스펙 §A.5 "t=0: 빈 화면 + 캐릭터 자유낙하 시작". 출생 X 좌표는 미명시.
**채택**: 화면 중앙 (`Math.floor(cols / 2)`).

## 6. 폰트 cell width 측정 — 단순 hidden span

`grid.ts` 의 `measureCellWidth` 는 매번 새 hidden span 을 생성하지 않고
모듈 스코프에 캐싱. `window.resize` 에서 무효화. (font-family 변경은
런타임에 일어나지 않으므로 저비용으로 충분.)

## 7. e2e 결정성

`?seed=<n>` 쿼리 파라미터로 RNG seed 주입. 게임 페이지 마운트 시
파라미터를 읽어 `mulberry32(seed)` 를 사용. 프로덕션 일반 진입은 `Math.random`.

## 8. 미해결 / 후속 검토

- [ ] 모바일에서 `←/→ move` 라벨 표시 여부 — 스펙은 데스크탑 전용 텍스트로
      해석. `start.mobile` 처럼 분기 없이 데스크탑 그대로 보여도 어색하지
      않다고 판단해 분기하지 않음. 디자인 검수 필요.
- [ ] 카탈로그 페이지의 부제목 `follow the fall` 위치/스타일은 스펙 ASCII
      그대로 옮김. 디자인 시스템 (`docs/DESIGN_SYSTEM.md`) 갱신은 MVP 범위
      밖 — 별도 PR 예정.
- [ ] e2e visual baseline 캡처는 로컬 스냅샷 환경 차이로 CI 첫 통과 후
      안정화 권장. (CLAUDE.md TDD 섹션 권고대로 함께 커밋.)
- [ ] mid-game 시각 스냅샷은 보류. 시드 주입은 가능하나 rAF 타이밍 차이로
      픽셀 단위 결정성을 보장하기 어려움. 현재는 카탈로그 + Initial 화면
      4 개 (desktop/mobile × 2) 만 baseline. 사용자 검수 후 mid-game 스냅샷
      도입 여부 결정.
- [ ] 결과 화면의 `at line N` 값으로 `state.recentGroups.length` 를 사용 중
      (현재 활성 그룹 + 직전 K 그룹 윈도우). 스펙 §A.6 의 `at line 142` 는
      "라인 수" 를 함의하지만 본 구현은 score(=그룹 수) 와 별도 카운터로
      재정의 필요할 수 있음. 디자인 합의 후 확정.

## 9. 구현 요약

| Phase (PLAN.md) | 상태 | 메모 |
|---|---|---|
| 1. Foundation | ✅ | 폰트 서브셋은 §2 결정으로 미도입. i18n `game` 네임스페이스 등록. |
| 2. Routing & header | ✅ | 해시 라우팅 (§1). `[ play ]` ↔ `[ home ]` 토글, `│` 세퍼레이터. |
| 3. Catalog | ✅ | `$ ls -la /game/` + `fall-f` 링크 + `(more coming...)`. |
| 4. Initial / Result | ✅ | `[Enter]` / 모바일 버튼 진입. retry 자동 포커스. |
| 5. Grid | ✅ | 순수 `colsForWidth` / `rowsForHeight` + DOM 측정 분리. |
| 6. Line pool + solvability | ✅ | static 22 개 + dynamic 3 개. R-1/R-2 + pressure 0.15. |
| 7. Physics | ✅ | 중력·수평·자동 슬라이드·죽음 판정 순수 함수. |
| 8. Game loop | ✅ | rAF + functional setState. visibility 일시정지. |
| 9. Player rendering | ✅ | `█/▌/▐` + 사망 1 프레임 `*` / `x`. |
| 10. Dynamic platforms | ✅ | shrink-right + fill-right 두 종. |
| 11. i18n | ✅ | ko/en 모두. 시스템 토큰 영어 고정. |
| 12. Tests | ✅ | 단위 65 개 (game 모듈) + e2e visual 4 + interactive 1. |

## 10. 검증 명령어 결과

| 명령 | 결과 |
|---|---|
| `npm run typecheck` | pass |
| `npm run lint` | pass |
| `npm run test:run` | 281 → 통과 (game 모듈 65개 추가) |
| `npm run e2e` | 24 통과 (fall-f 관련 5 추가) |
| `npm run build` | dist 생성 성공 (gzip 152.7 KB) |
