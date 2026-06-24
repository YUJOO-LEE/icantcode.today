# Release Policy & Workflow — icantcode.today

> 태그가 곧 릴리스. master push는 자동 배포되지 않으며, `v*.*.*` semver 태그
> push만이 production 배포를 트리거합니다.

---

## 1. 버전 규칙 (semver)

| Bump | 시점 |
|---|---|
| **major** | 사용자가 명시적으로 지시한 경우에만. |
| **minor** | 신규 기능, 신규 페이지/섹션, 신규 외부 연동 등 사용자에게 의미있는 큰 변경. |
| **patch** | 버그 픽스, 스타일 미세 조정, 카피 수정, 동작 변화 없는 리팩터, 의존성 bump, CI/설정 변경. 모호하면 기본값. |

### 누적 변경 → 최대 bump 적용

bump 결정 단위는 **"마지막 태그 이후 master에 누적된 모든 변경"** 입니다 — 이번
release commit의 *직접 사유* 가 아님. patch성 변경 5개 + minor성 변경 1개가
섞여 있다면 그 release는 **minor** 입니다 (semver 관행). 즉:

- 마지막 태그가 v1.0.0이고, 그 이후 master에 신규 페이지(minor) + 의존성 bump
  3건(patch)이 들어가 있는 상태에서 alert fix(patch)를 사유로 release하면
  → **v1.1.0** (누적 안에 minor 변경이 있으므로).
- 누적 변경이 모두 patch성이면 → patch (`v1.0.1`).

`CHANGELOG.md`는 운영하지 않음 — git 태그와 커밋 히스토리가 정식 출처.
누적 변경 검토는 `git log $(git describe --tags --abbrev=0)..HEAD --oneline`
한 줄로 충분.

---

## 2. 릴리스 플로우

PR들은 `package.json`을 건드리지 않습니다 (동시 머지 시 충돌 방지). 버전
bump는 master 위에서 deploy 직전에 별도 release 커밋으로 처리합니다. master
는 owner-bypass로 직접 push 허용된 상태여야 합니다 (Settings → Rules →
ruleset → Bypass list).

```bash
# 1. master 정렬 후, 마지막 태그 이후 커밋 검토
git checkout master
git pull origin master --ff-only
git fetch --tags
git log $(git describe --tags --abbrev=0)..HEAD --oneline

# 2. bump 레벨 결정 (위 표 참고)

# 3. package.json 버전 수정 → release 커밋 → 태그
npm version <patch|minor|major> --no-git-tag-version
git add package.json package-lock.json
git commit -m "chore(release): vX.Y.Z"
git tag -a vX.Y.Z -m "vX.Y.Z - <한 줄 요약>"

# 4. 커밋과 태그를 한 번에 push
#    --follow-tags: release 커밋과 그 커밋이 가리키는 annotated 태그를 함께 전송 →
#    브랜치만 가거나 태그만 가는 부분 push를 원천 차단.
git push origin master --follow-tags
```

태그 push가 `.github/workflows/release-deploy.yml`을 트리거하면 다음이 자동
실행됩니다:

1. 태그 commit checkout
2. Node 22 + npm cache setup
3. `npm ci`
4. `npm run build` (env: `VITE_API_BASE_URL`, `VITE_CF_BEACON_TOKEN`,
   `VITE_GTM_ID`를 GitHub Actions secrets에서 주입)
5. SEO smoke check
6. `actions/upload-pages-artifact` → `actions/deploy-pages`

평균 약 2-3분. 실패 시 production은 직전 배포 상태 그대로.

---

## 3. CI vs Release 워크플로우

| 워크플로우 | 트리거 | 책임 |
|---|---|---|
| `.github/workflows/ci.yml` | PR(→master), push(master), workflow_dispatch | audit / typecheck / lint / test / build / e2e — 머지 안전성 |
| `.github/workflows/release-deploy.yml` | push tags `v*.*.*`, workflow_dispatch | build → GitHub Pages 배포 |
| CodeQL (default setup) | scheduled + PR | 코드 스캔 |

- master push의 build artifact는 1일 retention으로 보관 (e2e가 다운로드해 사용).
- 태그 시점에 e2e는 다시 돌리지 않음 — master에 들어가는 모든 commit은
  ci.yml의 e2e를 통과한 상태이므로 이를 게이트로 신뢰.
- master ruleset의 required check은 `audit / typecheck / lint / test / build /
  e2e` + CodeQL Analyze. deploy job은 더 이상 ruleset에 포함되지 않음
  (워크플로우 자체에서 분리됨).

---

## 4. 핫픽스

```bash
# 1. fix PR 머지 (정상 PR 흐름)
# 2. master에서 즉시 patch release
git checkout master && git pull origin master --ff-only
npm version patch --no-git-tag-version
git add package.json package-lock.json
git commit -m "chore(release): vX.Y.(Z+1)"
git tag -a vX.Y.(Z+1) -m "vX.Y.(Z+1) - hotfix: <요약>"
git push origin master --follow-tags
```

---

## 5. 롤백

이전 안정 태그를 다시 배포:

```bash
gh workflow run release-deploy.yml --ref vX.Y.Z
```

또는 forward-rollback (이전 release commit을 revert하여 새 patch 발행):

```bash
git revert <bad-release-commit-sha>
npm version patch --no-git-tag-version
git add package.json package-lock.json
git commit -m "chore(release): vX.Y.(Z+1)"
git tag -a vX.Y.(Z+1) -m "vX.Y.(Z+1) - revert"
git push origin master --follow-tags
```

---

## 6. 첫 도입 시 점검

- [ ] master ruleset의 Bypass list에 owner 본인 등록 (release commit 직접 push용)
- [ ] master ruleset required checks에 `audit / typecheck / lint / test / build /
      e2e` + `Analyze (actions)` + `Analyze (javascript-typescript)` + `CodeQL`
      유지 (deploy 항목이 있다면 제거)
- [ ] GitHub Actions secrets에 `VITE_API_BASE_URL`, `VITE_CF_BEACON_TOKEN`,
      `VITE_GTM_ID` 등록 확인
- [ ] Settings → Pages → Source: GitHub Actions
- [ ] **`github-pages` environment의 deployment branch policy에 `v*.*.*` tag
      정책 추가** (Settings → Environments → github-pages → Deployment branch
      policy → "Add deployment branch or tag rule" → name: `v*.*.*`, type: `tag`).
      environment 보호는 *워크플로우 트리거 ref* 를 보기 때문에, 태그가
      master HEAD를 가리키더라도 tag 정책이 따로 없으면 release-deploy가
      step 0에서 차단됨.
