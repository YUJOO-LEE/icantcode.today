import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from 'react';
import { navigate } from '@/hooks/useHashRoute';

interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  to: string;
  children: ReactNode;
}

function Link({ to, children, onClick, ...rest }: LinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (event.button !== 0) return;
    event.preventDefault();
    navigate(to);
  };

  return (
    <a href={`#${to}`} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}

export default Link;
