import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import type { ReactNode } from 'react';
import i18n from '@/lib/i18n';
import IOSInstallGuide from '../IOSInstallGuide';

// Guide content branches on the current iOS browser; default to Safari so the
// existing share-sheet tests keep exercising that path.
vi.mock('@/lib/push', () => ({
  isIOSNonSafari: vi.fn(() => false),
}));

import { isIOSNonSafari } from '@/lib/push';

function Wrapper({ children }: { children: ReactNode }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

describe('IOSInstallGuide', () => {
  let onClose: Mock<() => void>;

  beforeEach(() => {
    onClose = vi.fn<() => void>();
    vi.mocked(isIOSNonSafari).mockReturnValue(false);
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

  describe('on a non-Safari iOS browser (Chrome/Firefox/Edge)', () => {
    beforeEach(() => {
      vi.mocked(isIOSNonSafari).mockReturnValue(true);
    });

    it('shows the "open in Safari" guidance instead of the share-sheet steps', () => {
      render(<IOSInstallGuide onClose={onClose} />, { wrapper: Wrapper });
      expect(screen.getByText('먼저 Safari에서 열어 주세요')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '[주소 복사]' })).toBeInTheDocument();
      // The Safari-only share-sheet step must not appear here.
      expect(screen.queryByText(/공유 버튼/)).not.toBeInTheDocument();
    });

    it('copies the page URL to the clipboard and confirms', async () => {
      const writeText = vi.fn(async () => {});
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText },
      });

      render(<IOSInstallGuide onClose={onClose} />, { wrapper: Wrapper });
      fireEvent.click(screen.getByRole('button', { name: '[주소 복사]' }));

      expect(writeText).toHaveBeenCalledWith(window.location.href);
      await waitFor(() =>
        expect(screen.getByRole('status')).toHaveTextContent('복사됨'),
      );

      delete (navigator as unknown as Record<string, unknown>).clipboard;
    });
  });
});
