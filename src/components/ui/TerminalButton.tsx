import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface TerminalButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

const TerminalButton = forwardRef<HTMLButtonElement, TerminalButtonProps>(
  ({ children, className = '', disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/50 active:scale-[0.97] transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-primary/60 focus-visible:text-foreground disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:active:scale-100 motion-reduce:active:scale-100 ${className}`}
        disabled={disabled}
        {...props}
      >
        [{children}]
      </button>
    );
  },
);

TerminalButton.displayName = 'TerminalButton';

export default TerminalButton;
