import type { ReactNode } from 'react';

interface TerminalCardProps {
  children: ReactNode;
  className?: string;
}

function TerminalCard({ children, className = '' }: TerminalCardProps) {
  return (
    <div
      className={`relative border border-[var(--color-border)] bg-[var(--color-surface)] ${className}`}
    >
      <span aria-hidden="true" className="absolute -top-px -left-px text-[var(--color-border)]">┌</span>
      <span aria-hidden="true" className="absolute -top-px -right-px text-[var(--color-border)]">┐</span>
      <span aria-hidden="true" className="absolute -bottom-px -left-px text-[var(--color-border)]">└</span>
      <span aria-hidden="true" className="absolute -bottom-px -right-px text-[var(--color-border)]">┘</span>
      {children}
    </div>
  );
}

function Header({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`px-4 py-2 text-sm text-[var(--color-text-secondary)] ${className}`}>{children}</div>;
}

function Divider() {
  return (
    <div aria-hidden="true" className="border-t border-[var(--color-border)] mx-2 opacity-60" />
  );
}

function Body({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`px-4 py-3 ${className}`}>{children}</div>;
}

function Footer({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`px-4 py-2 text-sm text-[var(--color-text-secondary)] ${className}`}>{children}</div>;
}

TerminalCard.Header = Header;
TerminalCard.Divider = Divider;
TerminalCard.Body = Body;
TerminalCard.Footer = Footer;

export default TerminalCard;
