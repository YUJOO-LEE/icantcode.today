import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import CommentItem from '../CommentItem';
import type { CommentResponse } from '@/types/api';

const baseComment: CommentResponse = {
  id: 42,
  postId: 1,
  content: 'looks good to me',
  author: 'dev_alpha',
  createdAt: new Date().toISOString(),
};

describe('CommentItem', () => {
  it('renders author and content', () => {
    render(<CommentItem comment={baseComment} />);
    expect(screen.getByText('dev_alpha')).toBeInTheDocument();
    expect(screen.getByText('looks good to me')).toBeInTheDocument();
  });

  it('renders the tree branch prefix', () => {
    render(<CommentItem comment={baseComment} />);
    expect(screen.getByText('└──')).toBeInTheDocument();
  });

  it('exposes createdAt via <time datetime>', () => {
    render(<CommentItem comment={baseComment} />);
    const time = document.querySelector('time');
    expect(time).not.toBeNull();
    expect(time?.getAttribute('datetime')).toBe(baseComment.createdAt);
  });

  it('uses role="listitem" so CommentList role="list" wraps it correctly', () => {
    render(<CommentItem comment={baseComment} />);
    expect(screen.getByRole('listitem')).toBeInTheDocument();
  });

  it('preserves newlines in content via <pre>', () => {
    const multiline: CommentResponse = {
      ...baseComment,
      content: 'line1\nline2',
    };
    render(<CommentItem comment={multiline} />);
    const pre = screen.getByText(/line1/);
    expect(pre.tagName.toLowerCase()).toBe('pre');
    expect(pre.textContent).toContain('\n');
  });
});
