import type { ApiStatus } from '@/types/api';

interface StatusIndicatorProps {
  status: ApiStatus;
  showLabel?: boolean;
}

function StatusIndicator({ status, showLabel = true }: StatusIndicatorProps) {
  const config = {
    normal: { dot: '●', color: 'text-[var(--color-success)]', label: 'NORMAL', dotClass: '' },
    down: { dot: '●', color: 'text-[var(--color-error)]', label: 'DOWN', dotClass: 'status-dot-down' },
    degraded: { dot: '●', color: 'text-[var(--color-warning)]', label: 'DEGRADED', dotClass: '' },
    checking: { dot: '○', color: 'text-[var(--color-text-muted)]', label: 'CHECKING', dotClass: '' },
  };

  const { dot, color, label, dotClass } = config[status];

  return (
    <span className={`inline-flex items-center gap-1.5 text-sm ${color}`}>
      <span className={dotClass} aria-hidden="true">{dot}</span>
      {showLabel && <span>{label}</span>}
      <span className="sr-only">API status: {label}</span>
    </span>
  );
}

export default StatusIndicator;
