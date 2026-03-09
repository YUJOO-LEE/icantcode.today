import { formatRelativeTime } from '@/lib/utils';

interface TerminalPromptProps {
  user: string;
  path?: string;
  time?: string;
  symbol?: '>' | '$' | '#';
}

function TerminalPrompt({ user, path = '~/feed', time, symbol = '>' }: TerminalPromptProps) {
  return (
    <span className="text-sm">
      <span className="text-[var(--color-text-muted)]">{symbol}</span>{' '}
      <span className="text-[var(--color-primary)]">@{user}</span>{' '}
      <span className="text-[var(--color-text-muted)]">{path}</span>
      {time && (
        <>
          {' '}
          <span className="text-[var(--color-text-muted)]">$</span>{' '}
          <time className="text-[var(--color-text-muted)]" title={time}>
            {formatRelativeTime(time)}
          </time>
        </>
      )}
    </span>
  );
}

export default TerminalPrompt;
