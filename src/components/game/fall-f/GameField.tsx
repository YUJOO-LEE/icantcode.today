import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FIELD_GUTTER_LEFT_PX,
  FIELD_GUTTER_RIGHT_PX,
  ROW_HEIGHT_PX,
} from './constants';
import Player from './Player';
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
  const dead =
    state.status === 'dead-segfault'
      ? 'segfault'
      : state.status === 'dead-timeout'
        ? 'timeout'
        : null;
  const atLeftEdge = state.player.x <= 0;

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
        className={`pointer-events-none absolute inset-y-0 left-0 w-px transition-colors ${atLeftEdge ? 'bg-destructive' : 'bg-border'}`}
      />

      <div
        aria-live="polite"
        className="absolute right-1 top-0 px-1 text-[10px] text-muted-foreground bg-background/70"
        style={{ height: `${ROW_HEIGHT_PX}px`, lineHeight: `${ROW_HEIGHT_PX}px` }}
      >
        {t('hud.score')} {state.score}
      </div>

      {state.rows.map((row) => (
        <div key={row.id}>
          {row.lineNumber > 0 && (
            <div
              aria-hidden="true"
              className="absolute text-[10px] text-muted-foreground/70 text-right pr-2"
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
            className={row.groupId === '__gap' ? '' : 'whitespace-pre text-foreground/90'}
            style={{
              position: 'absolute',
              top: `${row.topRow * ROW_HEIGHT_PX}px`,
              left: `${FIELD_GUTTER_LEFT_PX}px`,
              right: `${FIELD_GUTTER_RIGHT_PX}px`,
              height: `${ROW_HEIGHT_PX}px`,
            }}
          >
            {row.text}
          </div>
        </div>
      ))}
      <Player x={state.player.x} y={state.player.y} input={state.player.input} dead={dead} />
    </div>
  );
});

export default GameField;
