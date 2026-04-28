import { useTranslation } from 'react-i18next';
import { useStatusStore } from '@/stores/statusStore';
import type { StatusPageIndicator } from '@/types/api';

const STATUS_PAGE_URL = 'https://status.claude.com';

const INDICATOR_COLOR: Record<Exclude<StatusPageIndicator, 'none'>, string> = {
  minor: 'text-warning',
  major: 'text-alert',
  critical: 'text-destructive',
  maintenance: 'text-info',
};

function StatusPageLine() {
  const { t } = useTranslation('status');
  const statusPage = useStatusStore((s) => s.statusPage);
  const models = useStatusStore((s) => s.models);

  if (!statusPage || statusPage.indicator === 'none') return null;

  const indicatorLabel = t(`statusPage.indicator.${statusPage.indicator}`);
  const description = statusPage.description ?? '';
  const hasModelFail = models.some((m) => m.status !== 'HEALTHY');
  const colorClass = hasModelFail
    ? 'text-muted-foreground'
    : INDICATOR_COLOR[statusPage.indicator];

  return (
    <div className="text-xs text-muted-foreground">
      <span className="inline-flex flex-wrap items-baseline gap-x-2">
        <span>
          <span className="text-foreground">$</span> status --page
        </span>
        <span className={colorClass}>
          [{indicatorLabel}]{description ? ` ${description}` : ''}
        </span>
        <a
          href={STATUS_PAGE_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t('statusPage.openLink')}
          className="hover:text-foreground hover:underline focus-visible:text-foreground focus-visible:underline focus-visible:outline-none active:translate-y-px transition-colors"
        >
          ↗ status.claude.com
        </a>
      </span>
    </div>
  );
}

export default StatusPageLine;
