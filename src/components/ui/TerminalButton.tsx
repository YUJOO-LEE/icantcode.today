import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface TerminalButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

function TerminalButton({ children, className = '', disabled, ...props }: TerminalButtonProps) {
  return (
    <button
      className={`text-xs text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:text-foreground disabled:opacity-30 disabled:cursor-not-allowed ${className}`}
      disabled={disabled}
      {...props}
    >
      [{children}]
    </button>
  );
}

export default TerminalButton;
