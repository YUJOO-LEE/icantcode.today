interface TerminalBadgeProps {
  variant: 'success' | 'error' | 'warning' | 'info';
  children: string;
}

const variantStyles: Record<TerminalBadgeProps['variant'], string> = {
  success: 'text-primary',
  error: 'text-destructive',
  warning: 'text-amber-500',
  info: 'text-foreground',
};

function TerminalBadge({ variant, children }: TerminalBadgeProps) {
  return <span className={`text-xs ${variantStyles[variant]}`}>[{children}]</span>;
}

export default TerminalBadge;
