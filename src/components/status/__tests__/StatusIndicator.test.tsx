import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import StatusIndicator from '../StatusIndicator';

describe('StatusIndicator', () => {
  it('renders normal status', () => {
    render(<StatusIndicator status="normal" />);
    expect(screen.getByText('NORMAL')).toBeInTheDocument();
  });

  it('renders down status with pulse animation class', () => {
    const { container } = render(<StatusIndicator status="down" />);
    expect(screen.getByText('DOWN')).toBeInTheDocument();
    expect(container.querySelector('.status-dot-down')).toBeInTheDocument();
  });

  it('renders checking status with empty dot', () => {
    render(<StatusIndicator status="checking" />);
    expect(screen.getByText('CHECKING')).toBeInTheDocument();
  });

  it('has sr-only text for accessibility', () => {
    render(<StatusIndicator status="down" />);
    expect(screen.getByText('API status: DOWN')).toHaveClass('sr-only');
  });

  it('hides label when showLabel is false', () => {
    render(<StatusIndicator status="normal" showLabel={false} />);
    expect(screen.queryByText('NORMAL')).not.toBeInTheDocument();
  });
});
