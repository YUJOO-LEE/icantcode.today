import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FIELD_GUTTER_LEFT_PX,
  FIELD_GUTTER_RIGHT_PX,
  LEVEL_UP_FX_DURATION_MS,
  ROW_HEIGHT_PX,
} from './constants';
import Explosion from './Explosion';
import Player from './Player';
import Projectile from './Projectile';
import Telegraph from './Telegraph';
import { GAP_GROUP_ID } from './gameState';
import type { GameState } from './types';

interface GameFieldProps {
  state: GameState;
  ariaLabel?: string;
}

const GameField = forwardRef<HTMLDivElement, GameFieldProps>(function GameField(
  { state, ariaLabel },
  ref,
) {
  const { t } = useTranslation('game');
  const heightPx = state.viewport.rows * ROW_HEIGHT_PX;
  const atLeftEdge = state.player.x <= 0;

  // Brief level-up FX window. `levelUpAtMs === 0` means we're still on level 0.
  const sinceLevelUpMs = state.elapsedMs - state.levelUpAtMs;
  const isLevelUp =
    state.levelUpAtMs > 0 && sinceLevelUpMs >= 0 && sinceLevelUpMs <= LEVEL_UP_FX_DURATION_MS;

  return (
    <div
      ref={ref}
      role="application"
      aria-label={ariaLabel}
      className="relative w-full font-mono text-xs select-none touch-none border-l border-border bg-foreground/[0.04]"
      style={{
        height: `${heightPx}px`,
        overflow: 'clip',
        lineHeight: `${ROW_HEIGHT_PX}px`,
      }}
    >
      <div
        aria-hidden="true"
        data-testid="ff-left-edge"
        className={`pointer-events-none absolute inset-y-0 left-0 w-px transition-colors ${
          atLeftEdge ? 'bg-destructive' : 'bg-border'
        }`}
      />

      <div
        aria-hidden="true"
        data-testid="ff-hud-score"
        className={`absolute right-1 top-0 px-1 text-[10px] bg-background/70 transition-colors ${
          isLevelUp ? 'text-primary' : 'text-muted-foreground'
        }`}
        style={{ height: `${ROW_HEIGHT_PX}px`, lineHeight: `${ROW_HEIGHT_PX}px` }}
      >
        {t('hud.score')} {state.score}
      </div>

      {state.rows.map((row) => (
        <div key={row.id}>
          {row.lineNumber > 0 && (
            <div
              aria-hidden="true"
              data-testid="ff-line-number"
              className={`absolute text-[10px] text-right pr-2 transition-colors duration-700 ${
                isLevelUp ? 'text-primary' : 'text-muted-foreground/70'
              }`}
              style={{
                top: `${row.topRow * ROW_HEIGHT_PX}px`,
                left: 0,
                width: `${FIELD_GUTTER_LEFT_PX}px`,
                height: `${ROW_HEIGHT_PX}px`,
                lineHeight: `${ROW_HEIGHT_PX}px`,
              }}
            >
              {row.lineNumber}
            </div>
          )}
          <div
            className={row.groupId === GAP_GROUP_ID ? '' : 'whitespace-pre text-foreground/90'}
            style={{
              position: 'absolute',
              top: `${row.topRow * ROW_HEIGHT_PX}px`,
              left: `${FIELD_GUTTER_LEFT_PX}px`,
              right: `${FIELD_GUTTER_RIGHT_PX}px`,
              height: `${ROW_HEIGHT_PX}px`,
              // Keep `\t` rendering 1ch wide so visual columns match the JS
              // character index that `getSegments` and `player.x` use. With
              // the default tab-size, a tab expands to the next tab stop
              // (typically 8ch), making the player visually float on the
              // expanded whitespace while logically standing on a later
              // segment (e.g. 'INFO' in a Go-style log line).
              tabSize: 1,
            }}
          >
            {row.text}
          </div>
        </div>
      ))}
      {state.explosions.map((e) => (
        <Explosion key={e.id} x={e.x} y={e.y} remainingMs={e.remainingMs} />
      ))}
      {state.telegraphs.map((t) => (
        <Telegraph key={t.id} x={state.viewport.cols - 1} y={t.y} />
      ))}
      <Player
        x={state.player.x}
        y={state.player.y}
        input={state.player.input}
        velocityY={state.player.velocityY}
        dashDirection={state.player.dashDirection}
      />
      {state.projectiles.map((p) => (
        <Projectile key={p.id} x={p.x} y={p.y} glyph={p.glyph} />
      ))}
    </div>
  );
});

export default GameField;
