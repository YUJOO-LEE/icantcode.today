import { render, screen, fireEvent } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import i18n from '@/lib/i18n';
import type { UsePushNotifications, PushStatus } from '@/hooks/usePushNotifications';
import NotificationButton from '../NotificationButton';

const enable = vi.fn();
const disable = vi.fn();
const promptInstall = vi.fn(async () => true);

vi.mock('@/hooks/usePushNotifications', () => ({
  usePushNotifications: vi.fn(),
}));

vi.mock('@/hooks/useInstallPrompt', () => ({
  useInstallPrompt: vi.fn(),
}));

import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';

function mockHook(overrides: Partial<UsePushNotifications> = {}) {
  const value: UsePushNotifications = {
    status: 'default' as PushStatus,
    isSupported: true,
    needsInstall: false,
    enable,
    disable,
    error: null,
    ...overrides,
  };
  vi.mocked(usePushNotifications).mockReturnValue(value);
}

function mockInstall(canInstall = false) {
  vi.mocked(useInstallPrompt).mockReturnValue({ canInstall, promptInstall });
}

function Wrapper({ children }: { children: ReactNode }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

describe('NotificationButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInstall(false);
  });

  it('renders nothing when push is unsupported', () => {
    mockHook({ isSupported: false, status: 'unsupported' });
    const { container } = render(<NotificationButton />, { wrapper: Wrapper });
    expect(container.firstChild).toBeNull();
  });

  it('shows the enable label and calls enable() on click when idle', () => {
    mockHook({ status: 'default' });
    render(<NotificationButton />, { wrapper: Wrapper });
    const button = screen.getByRole('button', { name: /상태 변동 알림 받기/ });
    fireEvent.click(button);
    expect(enable).toHaveBeenCalledTimes(1);
  });

  it('reflects the subscribed state and calls disable() on click', () => {
    mockHook({ status: 'subscribed' });
    render(<NotificationButton />, { wrapper: Wrapper });
    const button = screen.getByRole('button', { name: /알림 켜짐/ });
    expect(button).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(button);
    expect(disable).toHaveBeenCalledTimes(1);
  });

  it('disables the button while subscribing', () => {
    mockHook({ status: 'subscribing' });
    render(<NotificationButton />, { wrapper: Wrapper });
    expect(screen.getByRole('button', { name: /구독 중/ })).toBeDisabled();
  });

  it('shows the blocked hint (no button) when permission is denied', () => {
    mockHook({ status: 'denied' });
    render(<NotificationButton />, { wrapper: Wrapper });
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText(/알림이 차단되어/)).toBeInTheDocument();
  });

  it('opens the iOS install guide instead of subscribing when install is required', () => {
    mockHook({ status: 'needs-install', needsInstall: true });
    render(<NotificationButton />, { wrapper: Wrapper });
    fireEvent.click(screen.getByRole('button', { name: /아이폰에서 알림 받기/ }));
    expect(enable).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/홈 화면에 추가하면/)).toBeInTheDocument();
  });

  it('surfaces an error message when enabling failed', () => {
    mockHook({ status: 'default', error: 'boom' });
    render(<NotificationButton />, { wrapper: Wrapper });
    expect(screen.getByRole('alert')).toHaveTextContent(/다시 시도/);
  });

  it('offers the add-to-home nudge only after subscribing, when installable', () => {
    mockHook({ status: 'subscribed' });
    mockInstall(true);
    render(<NotificationButton />, { wrapper: Wrapper });
    const nudge = screen.getByRole('button', { name: /홈 화면에도 추가/ });
    fireEvent.click(nudge);
    expect(promptInstall).toHaveBeenCalledTimes(1);
  });

  it('does not show the add-to-home nudge before subscribing', () => {
    mockHook({ status: 'default' });
    mockInstall(true);
    render(<NotificationButton />, { wrapper: Wrapper });
    expect(screen.queryByRole('button', { name: /홈 화면에도 추가/ })).not.toBeInTheDocument();
  });
});
