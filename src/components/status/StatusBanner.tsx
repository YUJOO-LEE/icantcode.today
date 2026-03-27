import { useTranslation } from 'react-i18next';
import type { ApiStatus } from '@/types/api';
import ModelStatusLine from './ModelStatusLine';

interface StatusBannerProps {
  status: ApiStatus;
}

function StatusBanner({ status }: StatusBannerProps) {
  const { t } = useTranslation('status');

  if (status === 'normal' || status === 'checking') return null;

  const { label, message, borderClass } = {
    down: { label: 'ERR', message: t('apiDown'), borderClass: 'border-destructive' },
  }[status];

  return (
    <div
      role="status"
      aria-live="polite"
      className={`mb-4 pl-3 border-l-2 ${borderClass} text-xs`}
    >
      <div className="flex items-center gap-2">
        <span>
          <span className="text-foreground">[{label}]</span>{' '}
          <span className="text-muted-foreground">{message}</span>
        </span>
      </div>
      <div className="mt-1">
        <ModelStatusLine />
      </div>
    </div>
  );
}

export default StatusBanner;
