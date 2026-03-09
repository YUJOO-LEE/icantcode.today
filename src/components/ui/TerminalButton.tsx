import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface TerminalButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'ghost';
  children: ReactNode;
}

function TerminalButton({ variant = 'primary', children, className = '', disabled, ...props }: TerminalButtonProps) {
  const variantStyles = {
    primary: 'text-[var(--color-primary)] border-[var(--color-border)] hover:bg-[var(--color-primary)] hover:text-[var(--color-bg)]',
    danger: 'text-[var(--color-error)] border-[var(--color-border)] hover:bg-[var(--color-error)] hover:text-[var(--color-bg)]',
    ghost: 'text-[var(--color-text-secondary)] border-transparent hover:text-[var(--color-text-primary)]',
  };

  return (
    <button
      className={`btn-terminal ${variantStyles[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      [ &gt; {children} ]
    </button>
  );
}

export default TerminalButton;
