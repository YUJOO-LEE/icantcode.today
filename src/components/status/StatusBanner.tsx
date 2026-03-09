import { useTranslation } from 'react-i18next';
import type { ApiStatus } from '@/types/api';
import TerminalBadge from '@/components/ui/TerminalBadge';

interface StatusBannerProps {
  status: ApiStatus;
}

function StatusBanner({ status }: StatusBannerProps) {
  const { t } = useTranslation('status');

  if (status === 'normal' || status === 'checking') return null;

  const config = {
    down: { badge: 'DOWN' as const, variant: 'error' as const, message: t('apiDown') },
    degraded: { badge: 'WARN' as const, variant: 'warning' as const, message: t('apiDegraded') },
  };

  const { badge, variant, message } = config[status];

  return (
    <div
      role="status"
      aria-live="polite"
      className="mb-4 px-4 py-3 border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center gap-3"
    >
      <TerminalBadge variant={variant}>{badge}</TerminalBadge>
      <span className="text-sm text-[var(--color-text-primary)]">{message}</span>
    </div>
  );
}

export default StatusBanner;
