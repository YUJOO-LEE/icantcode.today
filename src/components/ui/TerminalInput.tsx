import { forwardRef, type InputHTMLAttributes } from 'react';

interface TerminalInputProps extends InputHTMLAttributes<HTMLInputElement> {
  prompt?: string;
}

const TerminalInput = forwardRef<HTMLInputElement, TerminalInputProps>(
  ({ prompt = '>', className = '', ...props }, ref) => {
    return (
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground shrink-0" aria-hidden="true">
          {prompt}
        </span>
        <input
          ref={ref}
          className={`flex-1 bg-transparent border-b border-border px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:shadow-[0_1px_0_0_var(--primary)] transition-colors ${className}`}
          {...props}
        />
      </div>
    );
  },
);

TerminalInput.displayName = 'TerminalInput';

export default TerminalInput;
