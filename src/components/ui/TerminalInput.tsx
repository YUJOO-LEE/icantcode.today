import { forwardRef, type InputHTMLAttributes } from 'react';

interface TerminalInputProps extends InputHTMLAttributes<HTMLInputElement> {
  prompt?: string;
}

const TerminalInput = forwardRef<HTMLInputElement, TerminalInputProps>(
  ({ prompt = '>', className = '', ...props }, ref) => {
    return (
      <div className="terminal-input-wrapper">
        <span className="text-[var(--color-primary)] shrink-0" aria-hidden="true">
          {prompt}
        </span>
        <input
          ref={ref}
          className={`terminal-input ${className}`}
          {...props}
        />
      </div>
    );
  },
);

TerminalInput.displayName = 'TerminalInput';

export default TerminalInput;
