import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface TerminalButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

function TerminalButton({ children, className = '', disabled, ...props }: TerminalButtonProps) {
  return (
    <button
      className={`text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/50 active:scale-[0.97] transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-primary/60 focus-visible:text-foreground disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:active:scale-100 motion-reduce:active:scale-100 ${className}`}
      disabled={disabled}
      {...props}
    >
      [{children}]
    </button>
  );
}

export default TerminalButton;
