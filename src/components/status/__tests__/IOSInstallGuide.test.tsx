import { render, screen, fireEvent } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import type { ReactNode } from 'react';
import i18n from '@/lib/i18n';
import IOSInstallGuide from '../IOSInstallGuide';

function Wrapper({ children }: { children: ReactNode }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

describe('IOSInstallGuide', () => {
  let onClose: Mock<() => void>;

  beforeEach(() => {
    onClose = vi.fn<() => void>();
  });

  it('renders the install steps in a dialog', () => {
    render(<IOSInstallGuide onClose={onClose} />, { wrapper: Wrapper });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/홈 화면에 추가하면/)).toBeInTheDocument();
    expect(screen.getByText(/공유 버튼/)).toBeInTheDocument();
  });

  it('closes on Escape', () => {
    render(<IOSInstallGuide onClose={onClose} />, { wrapper: Wrapper });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('ignores other keys', () => {
    render(<IOSInstallGuide onClose={onClose} />, { wrapper: Wrapper });
    fireEvent.keyDown(document, { key: 'a' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes when the close button is clicked', () => {
    render(<IOSInstallGuide onClose={onClose} />, { wrapper: Wrapper });
    // TerminalButton wraps its label in brackets → accessible name "[확인]".
    fireEvent.click(screen.getByRole('button', { name: '[확인]' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes when the backdrop is clicked', () => {
    render(<IOSInstallGuide onClose={onClose} />, { wrapper: Wrapper });
    // The backdrop button is labelled exactly "확인" (no brackets).
    fireEvent.click(screen.getByRole('button', { name: '확인' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
