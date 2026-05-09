import { FIELD_GUTTER_LEFT_PX, ROW_HEIGHT_PX } from './constants';
import type { InputState } from './types';

interface PlayerProps {
  x: number;
  y: number;
  input: InputState;
  dead?: 'segfault' | 'timeout' | null;
}

const GLYPH: Record<InputState, string> = {
  none: '█',
  left: '▌',
  right: '▐',
  both: '█',
};

function Player({ x, y, input, dead }: PlayerProps) {
  const glyph = dead === 'segfault' ? '*' : dead === 'timeout' ? 'x' : GLYPH[input];
  return (
    <span
      className="absolute text-primary leading-none pointer-events-none select-none"
      style={{
        top: `${y * ROW_HEIGHT_PX}px`,
        left: `calc(${FIELD_GUTTER_LEFT_PX}px + ${x}ch)`,
        height: `${ROW_HEIGHT_PX}px`,
        lineHeight: `${ROW_HEIGHT_PX}px`,
      }}
      aria-hidden="true"
    >
      {glyph}
    </span>
  );
}

export default Player;
