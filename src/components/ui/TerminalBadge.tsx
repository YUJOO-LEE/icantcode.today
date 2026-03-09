interface TerminalBadgeProps {
  variant: 'success' | 'error' | 'warning' | 'info';
  children: string;
}

function TerminalBadge({ children }: TerminalBadgeProps) {
  return <span className="text-xs text-foreground">[{children}]</span>;
}

export default TerminalBadge;
