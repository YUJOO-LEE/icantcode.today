import type { ReactNode } from 'react';

interface TerminalCardProps {
  children: ReactNode;
  className?: string;
}

function TerminalCard({ children, className = '' }: TerminalCardProps) {
  return (
    <div className={`border border-border bg-card p-4 ${className}`}>
      {children}
    </div>
  );
}

export default TerminalCard;
