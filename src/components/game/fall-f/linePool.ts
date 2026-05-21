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
