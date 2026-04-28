import { useTranslation } from 'react-i18next';
import { useStatusStore } from '@/stores/statusStore';
import type { ApiStatus, StatusPageIndicator } from '@/types/api';
import ModelStatusLine from './ModelStatusLine';
import StatusPageLine from './StatusPageLine';

interface StatusBannerProps {
  status: ApiStatus;
}

const INDICATOR_BORDER: Record<StatusPageIndicator, string> = {
  none: 'border-destructive',
  minor: 'border-warning',
  major: 'border-alert',
  critical: 'border-destructive',
  maintenance: 'border-info',
};

function StatusBanner({ status }: StatusBannerProps) {
  const { t } = useTranslation('status');
  const statusPage = useStatusStore((s) => s.statusPage);
  const models = useStatusStore((s) => s.models);

  if (status === 'normal' || status === 'checking') return null;

  const label = 'ERR';
  const message = t('apiDown');
  const hasModelFail = models.some((m) => m.status !== 'HEALTHY');
  const borderClass = hasModelFail
    ? 'border-destructive'
    : statusPage
      ? INDICATOR_BORDER[statusPage.indicator]
      : 'border-destructive';

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
      <div className="mt-1">
        <StatusPageLine />
      </div>
    </div>
  );
}

export default StatusBanner;
