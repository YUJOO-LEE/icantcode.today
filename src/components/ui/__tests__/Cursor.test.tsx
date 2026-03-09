import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Cursor from '../Cursor';

describe('Cursor', () => {
  it('renders with aria-hidden', () => {
    const { container } = render(<Cursor />);
    const cursor = container.querySelector('.cursor');
    expect(cursor).toBeInTheDocument();
    expect(cursor).toHaveAttribute('aria-hidden', 'true');
  });
});
