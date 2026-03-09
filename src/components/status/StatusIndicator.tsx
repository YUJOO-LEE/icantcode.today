import { useTranslation } from 'react-i18next';
import type { ApiStatus } from '@/types/api';

interface StatusIndicatorProps {
  status: ApiStatus;
  showLabel?: boolean;
}

function StatusIndicator({ status, showLabel = true }: StatusIndicatorProps) {
  const { t } = useTranslation('status');
  const config = {
    normal: { label: 'OK', dotClass: '' },
    down: { label: 'DOWN', dotClass: 'status-dot-down' },
    degraded: { label: 'WARN', dotClass: '' },
    checking: { label: '...', dotClass: '' },
  };

  const { label, dotClass } = config[status];

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs text-muted-foreground ${dotClass}`}>
      [{label}]
      {showLabel && <span className="sr-only">{t('apiStatusLabel')} {label}</span>}
    </span>
  );
}

export default StatusIndicator;
