import type {
  AlternatingLine,
  FillRightLine,
  GrowRightLine,
  LineGroup,
  ShiftingLine,
  StaticLine,
} from './types';

function s(text: string): StaticLine {
  return { kind: 'static', text };
}

function group(id: string, lines: LineGroup['lines'], gap: 1 | 2 = 1): LineGroup {
  return { id, lines, gap };
}

// Shifting platform: ASCII bar drifting one cell per `periodSec`, ping-ponging
// between the viewport edges. Players riding it are carried along.
const shift = (
  pattern: string,
  initialDirection: -1 | 1 = 1,
  periodSec = 0.08,
): ShiftingLine => ({
  kind: 'shifting',
  pattern,
  periodSec,
  initialDirection,
});

export const STATIC_GROUPS: LineGroup[] = [
  // npm / vite / tsc
  group('build', [s('$ npm run build')], 2),
  group('vite-start', [
    s('▸ vite v6.0.7 building for production...'),
    s('  ✓ 142 modules transformed.'),
  ]),
  group('tsc', [s('$ tsc -b --watch')]),
  group('tsc-error', [
    s('  TS2322: Type \'string\' is not assignable to type \'number\'.'),
    s('    at src/utils.ts:42:11'),
  ], 2),
  group('npm-i', [s('$ npm i')]),
  group('npm-i-out', [
    s('added 142 packages in 3.2s'),
    s('  18 packages are looking for funding'),
  ]),
  group('eslint', [s('$ npm run lint -- --fix')]),
  group('eslint-out', [
    s('  /src/App.tsx'),
    s('  21:5  warning  Unused import "Foo"'),
  ], 2),
  group('test-run', [s('$ npm run test:run')]),
  group('test-out', [
    s('Test Files  39 passed (39)'),
    s('     Tests  232 passed (232)'),
  ], 2),

  // shell / fs
  group('ls-1', [s('$ ls -la')]),
  group('ls-2', [
    s('drwxr-xr-x  src'),
    s('drwxr-xr-x  public'),
    s('-rw-r--r--  package.json'),
  ], 2),
  group('cd', [s('$ cd ~/projects/icantcode')]),
  group('pwd', [s('$ pwd')]),
  group('pwd-out', [s('/Users/yujoo/projects/icantcode')]),
  group('cat', [s('$ cat README.md | head -3')]),
  group('cat-out', [
    s('# icantcode.today'),
    s(''),
    s('A shelter for idle terminals.'),
  ], 2),
  group('rm', [s('$ rm -rf node_modules')]),
  group('echo', [s('$ echo $PATH')]),
  group('echo-out', [s('/usr/local/bin:/usr/bin:/bin:/opt/homebrew/bin')]),
  group('df', [s('$ df -h /')]),
  group('df-out', [
    s('Filesystem      Size   Used  Avail  Capacity'),
    s('/dev/disk3s1   460Gi  311Gi  146Gi      69%'),
  ], 2),

  // git
  group('git-status', [s('$ git status')]),
  group('git-staged', [
    s('On branch master'),
    s('Changes to be committed:'),
    s('  modified:   src/App.tsx'),
  ]),
  group('git-log', [s('$ git log --oneline -3')]),
  group('git-log-out', [
    s('a91aae0 fix(fall-f): retry returns to initial'),
    s('cde1bb8 feat: per-line score HUD'),
    s('1907a95 feat: game logic core'),
  ], 2),
  group('git-commit', [s('$ git commit -m "fix typo"')]),
  group('git-commit-out', [
    s('[master 4d2e3a1] fix typo'),
    s(' 1 file changed, 1 insertion(+), 1 deletion(-)'),
  ]),
  group('git-push', [s('$ git push origin master')]),
  group('git-push-out', [
    s('Enumerating objects: 5, done.'),
    s('To github.com:YUJOO-LEE/icantcode.today.git'),
  ], 2),

  // process / network
  group('ps', [s('$ ps -ef | grep node')]),
  group('ps-out', [
    s('  yujoo 41822  41801  0 10:00 ttys001  node vite'),
  ]),
  group('curl', [s('$ curl -sI https://api.example.com')], 2),
  group('curl-out', [
    s('HTTP/2 200'),
    s('content-type: application/json'),
    s('cache-control: max-age=300'),
  ]),
  group('ping', [s('$ ping -c 2 1.1.1.1')]),
  group('ping-out', [
    s('64 bytes from 1.1.1.1: icmp_seq=0 time=8.21 ms'),
    s('64 bytes from 1.1.1.1: icmp_seq=1 time=7.94 ms'),
  ], 2),

  // docker / k8s
  group('docker-ps', [s('$ docker ps')]),
  group('docker-ps-out', [
    s('CONTAINER ID  IMAGE       STATUS'),
    s('a3f912ee2c1b  redis:7     Up 2h'),
    s('ed44b0c3a7d2  postgres    Up 2h'),
  ], 2),
  group('docker-up', [s('$ docker compose up -d')]),
  group('docker-up-out', [
    s('[+] Running 2/2'),
    s(' ✔ Container db-1   Started'),
    s(' ✔ Container app-1  Started'),
  ]),
  group('kubectl', [s('$ kubectl get pods')]),
  group('kubectl-out', [
    s('NAME          READY  STATUS    RESTARTS  AGE'),
    s('app-7b9d-12   1/1    Running   0         3d'),
  ], 2),

  // python / cargo
  group('pytest', [s('$ pytest -q')]),
  group('pytest-out', [
    s('........                       [100%]'),
    s('8 passed in 0.42s'),
  ], 2),
  group('cargo', [s('$ cargo build --release')]),
  group('cargo-out', [
    s('   Compiling icantcode v0.1.0'),
    s('    Finished release [optimized] in 12.3s'),
  ], 2),

  // misc
  group('rg', [s('$ rg --hidden TODO src/')]),
  group('rg-out', [
    s('src/utils.ts:12:// TODO: refactor'),
    s('src/main.ts:45:// TODO: validate input'),
  ], 2),
  group('uname', [s('$ uname -a')]),
  group('uname-out', [
    s('Darwin yujoo 25.4.0 arm64'),
  ]),
  group('ssh', [s('$ ssh ubuntu@10.0.0.5')]),
  group('ssh-out', [
    s('Last login: Mon May  8 09:15:42 2026'),
  ], 2),

  // backend ops — these riff on the team's backend lead.
  group('git-cfg-name-park', [
    s('$ git config --get user.name'),
    s('Park Hyungjun'),
  ], 2),
  group('git-cfg-email-park', [
    s('$ git config --get user.email'),
    s('kong8715@gmail.com'),
  ], 2),
  group('mail-deploy', [s('$ mail kong8715@gmail.com -s "deploy ok"')]),
  group('mail-sent', [s('Mail sent.')]),
  group('ssh-bastion', [s('$ ssh park@bastion.icantcode.today')]),
  group('ssh-bastion-out', [
    s('Welcome to bastion (Ubuntu 22.04 LTS)'),
    s('Last login: Wed Apr 15 04:15:42 2026 from 10.0.0.1'),
  ], 2),

  // databases / cache
  group('psql-connect', [s('$ psql -U park -h db.internal -d icantcode_prod')]),
  group('psql-prompt', [
    s('psql (15.4)'),
    s('Type "help" for help.'),
    s('icantcode_prod=#'),
  ], 2),
  group('psql-query', [s('icantcode_prod=# SELECT count(*) FROM users;')]),
  group('psql-count', [
    s(' count '),
    s('-------'),
    s('  4218'),
  ], 2),
  group('redis-get', [s('$ redis-cli -h cache.internal get session:park')]),
  group('redis-out', [s('"online"')]),
  group('mongo-find', [s('$ mongosh --eval "db.runs.findOne({user: \'park\'})"')]),
  group('mongo-out', [
    s('{ _id: ObjectId("66..."), user: "park", score: 871 }'),
  ], 2),

  // k8s / cloud
  group('kubectl-logs', [s('$ kubectl logs -f api-server -c park-handler')]),
  group('kubectl-logs-out', [
    s('[INFO] handler ready on :8080'),
    s('[INFO] 200 GET /healthz 4ms'),
  ], 2),
  group('aws-whoami', [s('$ aws sts get-caller-identity')]),
  group('aws-whoami-out', [
    s('{'),
    s('  "Arn": "arn:aws:iam::123456789012:user/park"'),
    s('}'),
  ], 2),

  // build / package
  group('node-v', [s('$ node -v && pnpm -v')]),
  group('node-v-out', [s('v20.11.0'), s('9.15.0')], 2),
  group('pnpm-i', [s('$ pnpm install --frozen-lockfile')]),
  group('pnpm-i-out', [
    s('Lockfile is up to date, resolution step is skipped'),
    s('Done in 2.4s'),
  ], 2),

  // misc ops
  group('systemctl-status', [s('$ systemctl status api.service')]),
  group('systemctl-status-out', [
    s('● api.service — icantcode api'),
    s('   Active: active (running) since Wed 2026-05-21 23:00:11 UTC'),
  ], 2),
  group('journalctl-tail', [s('$ journalctl -u api.service -n 2 --no-pager')]),
  group('journalctl-out', [
    s('May 21 23:14:08 api[1812]: served 5219 requests in 60s'),
    s('May 21 23:15:09 api[1812]: p99 latency 41ms'),
  ], 2),
  group('curl-health', [s('$ curl -sI https://api.icantcode.today/healthz')]),
  group('curl-health-out', [
    s('HTTP/2 200'),
    s('x-served-by: api-park-7c9f'),
  ], 2),

  // frontend dev
  group('git-cfg-name-yujoo', [
    s('$ git config --get user.name'),
    s('Lee Yujoo'),
  ], 2),
  group('git-cfg-email-yujoo', [
    s('$ git config --get user.email'),
    s('mail@leeyujoo.com'),
  ], 2),
  group('vite-dev', [s('$ pnpm vite dev')]),
  group('vite-dev-out', [
    s('  VITE v6.0.7  ready in 412 ms'),
    s('  ➜  Local:   http://localhost:7150/'),
  ], 2),
  group('hmr-update', [
    s('[vite] page reload src/pages/HomePage.tsx'),
    s('[vite] hmr update /src/components/feed/PostCard.tsx'),
  ], 2),
  group('tsc-watch', [s('[23:14:00] File change detected. Starting incremental compilation...')]),
  group('tsc-clean', [s('[23:14:01] Found 0 errors. Watching for file changes.')]),
  group('playwright', [s('$ npx playwright test --project=chromium')]),
  group('playwright-out', [
    s('Running 28 tests using 4 workers'),
    s('  28 passed (24.2s)'),
  ], 2),
  group('pr-review', [s('$ gh pr review 42 --approve --body "lgtm"')]),
  group('pr-review-out', [s('Approved pull request #42 (reviewer: Lee Yujoo)')]),

  // language versions
  group('go-version', [s('$ go version && rustc --version')]),
  group('go-version-out', [
    s('go version go1.22.3 darwin/arm64'),
    s('rustc 1.78.0 (9b00956e5 2026-04-29)'),
  ], 2),
  group('python-bun', [s('$ python3 --version && bun --version')]),
  group('python-bun-out', [s('Python 3.12.1'), s('1.1.0')], 2),

  // error stacks
  group('err-econn', [s('Error: connect ECONNREFUSED 127.0.0.1:5432')]),
  group('err-econn-stack', [
    s('    at TCPConnectWrap.afterConnect [as oncomplete]'),
    s('  code: \'ECONNREFUSED\', port: 5432'),
  ], 2),
  group('err-traceback', [
    s('Traceback (most recent call last):'),
    s('  File "etl.py", line 41, in run'),
    s('    record = db.get(user_id)'),
  ], 2),
  group('err-panic', [s('panic: runtime error: index out of range [3] with length 3')]),
  group('err-oom', [s('Killed (OOM: process used 4.1GiB, limit 4.0GiB)')]),

  // log formats
  group('nginx-access', [
    s('10.0.0.4 - yujoo [21/May/2026:23:14:08 +0000] "GET /api/runs HTTP/2.0" 200 1284'),
  ]),
  group('json-log', [
    s('{"level":"info","ts":"2026-05-21T23:14:08Z","msg":"deploy ok","by":"yujoo.lee"}'),
  ]),

  // banners
  group('redis-banner', [s('Welcome to Redis 7.2.0 (00000000/0) 64 bit')]),
  group('postgres-banner', [
    s('PostgreSQL 15.4 (Ubuntu 15.4-1.pgdg22.04+1) on aarch64-unknown-linux-gnu'),
    s('ready to accept connections'),
  ], 2),

  // easter egg variants — both leads together
  group('passwd-grep', [s('$ cat /etc/passwd | grep -E \'park|yujoo\'')]),
  group('passwd-out', [
    s('park:x:501:20:Park Hyungjun:/home/park:/bin/zsh'),
    s('yujoo:x:502:20:Lee Yujoo:/home/yujoo:/bin/zsh'),
  ], 2),
  group('last-login', [s('$ last | head -3')]),
  group('last-out', [
    s('yujoo   ttys001  10.0.0.4  Wed May 21 22:50  still logged in'),
    s('park    ttys002  10.0.0.7  Wed May 21 22:48 - 23:14  (00:26)'),
  ], 2),
  group('ping-pair', [s('$ ssh yujoo@studio.icantcode.today -t \'tail -f /tmp/park.log\'')]),
  group('ping-pair-out', [s('[INFO] park: pushed feat/fall-f-projectile-hazard')]),

  // system monitoring
  group('uptime', [s('$ uptime')]),
  group('uptime-out', [s(' 23:14:08 up 17 days,  4:21,  2 users,  load average: 0.42, 0.51, 0.49')]),
  group('free-m', [s('$ free -m')]),
  group('free-m-out', [
    s('              total        used        free      shared  buff/cache   available'),
    s('Mem:          15890        9120        1284         404        5486        6182'),
  ], 2),
  group('htop-header', [
    s('  1  [|||||||||||                                       17.2%]   Tasks: 248'),
    s('  2  [||||||||||||||||||||                              33.4%]   Load average: 0.42 0.51 0.49'),
  ], 2),
  group('lsof-port', [s('$ lsof -i :8080')]),
  group('lsof-port-out', [
    s('COMMAND   PID    USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME'),
    s('node    18211 yujoo   23u  IPv6 0xabc1234567890123      0t0  TCP *:http-alt (LISTEN)'),
  ], 2),
  group('ps-park', [s('$ ps aux | grep park')]),
  group('ps-park-out', [
    s('park    41822  0.4  0.2  421124  34280   ??  S    22:48PM   0:01.92 node /srv/api/dist/server.js'),
  ], 2),

  // tests / CI
  group('vitest-run', [s('$ pnpm test:run')]),
  group('vitest-run-out', [
    s(' Test Files  62 passed (62)'),
    s('      Tests  529 passed (529)'),
  ], 2),
  group('coverage', [
    s('Statements   : 87.4% ( 1842/2107 )'),
    s('Branches     : 79.1% (  287/362  )'),
  ], 2),
  group('gh-run-list', [s('$ gh run list -L 3')]),
  group('gh-run-list-out', [
    s('completed  success  feat/fall-f-projectile-hazard  CI  3m12s  Lee Yujoo'),
    s('completed  success  fix/api-rate-limit              CI  2m48s  Park Hyungjun'),
  ], 2),
  group('lighthouse', [
    s('Performance: 96   Accessibility: 100   Best Practices: 100   SEO: 100'),
  ]),

  // extra CLI banners
  group('mongo-banner', [
    s('Using MongoDB:          6.0.5'),
    s('Using Mongosh:          2.0.1'),
  ], 2),
  group('kubectl-version', [s('$ kubectl version --short')]),
  group('kubectl-version-out', [
    s('Client Version: v1.28.4'),
    s('Server Version: v1.28.2-eks-2d98532'),
  ], 2),
  group('docker-version', [s('$ docker --version && docker compose version')]),
  group('docker-version-out', [
    s('Docker version 25.0.3, build 4debf41'),
    s('Docker Compose version v2.24.5'),
  ], 2),

  // extra easter eggs — both leads' workflow
  group('crontab-park', [s('$ crontab -l')]),
  group('crontab-park-out', [
    s('# m h  dom mon dow   command'),
    s('0 4   *   *   *      /home/park/scripts/db-snapshot.sh'),
    s('*/5 * *   *   *      /home/park/scripts/health-check.sh'),
  ], 2),
  group('gh-pr-list', [s('$ gh pr list --author "@me"')]),
  group('gh-pr-list-out', [
    s('#62  feat(fall-f): shifting platform   yujoo-lee  feat/fall-f-shift'),
    s('#61  fix(api): rate limit retry        park       fix/api-rate-limit'),
  ], 2),
  group('git-stash', [s('$ git stash list')]),
  group('git-stash-out', [
    s('stash@{0}: WIP on master: experiment with ShiftingLine'),
    s('stash@{1}: WIP on feat/api: psql query tuning'),
  ], 2),
  group('dig-domain', [s('$ dig +short api.icantcode.today')]),
  group('dig-out', [
    s('api.icantcode.today.    300     IN      A       10.0.42.7'),
  ]),
  group('mail-thanks', [s('$ mail mail@leeyujoo.com -s "thanks for the review"')]),
  group('mail-thanks-out', [s('Mail sent.')]),

  // extra error stacks
  group('err-java', [
    s('Exception in thread "main" java.lang.NullPointerException'),
    s('        at com.icantcode.api.RunService.scoreOf(RunService.java:42)'),
  ], 2),
  group('err-npm', [s('npm ERR! code ERESOLVE')]),
  group('err-npm-out', [s('npm ERR! ERESOLVE could not resolve  while resolving: @icantcode/ui@1.4.2')]),
  group('err-rust', [
    s('thread \'main\' panicked at src/main.rs:18:9:'),
    s('called `Result::unwrap()` on an `Err` value: NotFound'),
  ], 2),
  group('err-gradle', [
    s('FAILURE: Build failed with an exception.'),
    s('* What went wrong: Could not resolve all files for configuration \':app:runtimeClasspath\'.'),
  ], 2),
  group('err-sigsegv', [s('Segmentation fault (core dumped)')]),

  // extra log formats
  group('logrus', [
    s('time="2026-05-21T23:14:08Z" level=info msg="deploy ok" service=api by=yujoo.lee'),
  ]),
  group('zap-log', [
    // Tab characters would render visually wider than their JS-string length
    // under `whitespace-pre`, so we spell out the separators as literal
    // spaces — see GameField's `tabSize: 1` for the matching CSS guard.
    s('2026-05-21T23:14:08.421Z  INFO  api/run.go:124  run submitted  {"user":"park","score":871}'),
  ]),
  group('syslog', [
    s('<14>May 21 23:14:08 api-park-7c9f kernel: [4621211.812] TCP: out of memory -- consider tuning tcp_mem'),
  ]),
  group('pino-log', [
    s('[1747871648421] INFO  (icantcode/18211): request completed'),
    s('    req: { "id": "abc123", "method": "GET", "url": "/api/runs" }'),
  ], 2),

  // shifting platforms — kept in the static pool (not dynamic) so they pick at
  // the regular frequency instead of being gated behind PRESSURE_GROUP_RATIO.
  group('shift-plank-r', [shift('=======', 1)], 2),
  group('shift-plank-l', [shift('=======', -1)], 2),
];

const grow = (initial: string, growChar = '.', growPerSec = 4): GrowRightLine => ({
  kind: 'grow-right',
  initial,
  growChar,
  growPerSec,
});

const oscillate = (
  template: string,
  periodSec = 3.5,
  filled = '█',
  empty = '░',
): FillRightLine => ({
  kind: 'fill-right',
  initial: template,
  periodSec,
  filled,
  empty,
});

// Flickering platform: alternating single cells — plank / gap / plank / gap
// across the row, toggling every FLICKER_PERIOD_SEC. Equal 1-cell widths
// keep the two phases exact inverses of each other (every plank in A is a
// gap in B). The 1-cell shift means the player only has to nudge one cell
// over when the phase flips, but the 1.5s window still demands attention —
// stand still and you fall through on the next toggle.
//
// patternA spawns first (renderAlternating phase 0 = A) and solvability
// grades reachability against patternA, so a freshly arrived row is always
// landable on its A cells.
const FLICKER_PATTERN_TOTAL_LEN = 80;
const FLICKER_PERIOD_SEC = 1.5;

function repeatTo(unit: string, totalLen: number): string {
  let out = '';
  while (out.length < totalLen) out += unit;
  return out.slice(0, totalLen);
}

const flicker = (unitA: string, unitB: string): AlternatingLine => ({
  kind: 'alternating',
  patternA: repeatTo(unitA, FLICKER_PATTERN_TOTAL_LEN),
  patternB: repeatTo(unitB, FLICKER_PATTERN_TOTAL_LEN),
  periodSec: FLICKER_PERIOD_SEC,
});

export const DYNAMIC_GROUPS: LineGroup[] = [
  group('loading-dots', [grow('loading...', '.', 4)]),
  group('compiling-dots', [grow('compiling...', '.', 4)]),
  group('fetching-dots', [grow('fetching deps...', '.', 5)]),
  group('progress-bar', [oscillate('[████████████]', 3.5)], 2),
  group('progress-long', [oscillate('[████████████████]', 4.5)]),
  group('flicker-bar', [flicker('- ', ' -')], 2),
];

export const ALL_GROUPS: LineGroup[] = [...STATIC_GROUPS, ...DYNAMIC_GROUPS];
