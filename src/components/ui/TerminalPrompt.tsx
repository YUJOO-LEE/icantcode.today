import { formatRelativeTime } from '@/lib/utils';

interface TerminalPromptProps {
  user: string;
  time?: string;
  id?: number;
}

function TerminalPrompt({ user, time, id }: TerminalPromptProps) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span>-rw-r--r--</span>
      <span className="text-foreground">{user}</span>
      {time && (
        <time dateTime={time}>{formatRelativeTime(time)}</time>
      )}
      {id !== undefined && (
        <span className="text-muted-foreground/50">#{id}</span>
      )}
    </div>
  );
}

export default TerminalPrompt;
