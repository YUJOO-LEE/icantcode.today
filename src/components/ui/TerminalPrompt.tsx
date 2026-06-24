import { formatRelativeTime } from '@/lib/utils';

interface TerminalPromptProps {
  user: string;
  time?: string;
  id?: number;
}

function TerminalPrompt({ user, time, id }: TerminalPromptProps) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="shrink-0">-rw-r--r--</span>
      <span className="text-foreground min-w-0 truncate">{user}</span>
      {time && (
        <time className="shrink-0" dateTime={time}>
          {formatRelativeTime(time)}
        </time>
      )}
      {id !== undefined && (
        <span className="text-muted-foreground/50 shrink-0">#{id}</span>
      )}
    </div>
  );
}

export default TerminalPrompt;
