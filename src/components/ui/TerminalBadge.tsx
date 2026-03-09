interface TerminalBadgeProps {
  variant: 'success' | 'error' | 'warning' | 'info';
  children: string;
}

function TerminalBadge({ variant, children }: TerminalBadgeProps) {
  const variantStyles = {
    success: 'text-[var(--color-success)]',
    error: 'text-[var(--color-error)]',
    warning: 'text-[var(--color-warning)]',
    info: 'text-[var(--color-info)]',
  };

  return (
    <span className={`font-bold ${variantStyles[variant]}`}>
      [{children}]
    </span>
  );
}

export default TerminalBadge;
