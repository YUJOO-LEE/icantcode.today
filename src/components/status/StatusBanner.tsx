import { useTranslation } from 'react-i18next';
import type { ApiStatus } from '@/types/api';

interface StatusBannerProps {
  status: ApiStatus;
}

function StatusBanner({ status }: StatusBannerProps) {
  const { t } = useTranslation('status');

  if (status === 'normal' || status === 'checking') return null;

  const config = {
    down: { label: 'ERR', message: t('apiDown'), borderClass: 'border-destructive' },
    degraded: { label: 'WARN', message: t('apiDegraded'), borderClass: 'border-muted-foreground' },
  };

  const { label, message, borderClass } = config[status];

  return (
    <div
      role="status"
      aria-live="polite"
      className={`mb-4 pl-3 border-l-2 ${borderClass} text-xs flex items-center gap-2`}
    >
      <span>
        <span className="text-foreground">[{label}]</span>{' '}
        <span className="text-muted-foreground">{message}</span>
      </span>
    </div>
  );
}

export default StatusBanner;
