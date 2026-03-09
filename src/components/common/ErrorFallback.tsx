import { useTranslation } from 'react-i18next';
import TerminalCard from '@/components/ui/TerminalCard';
import TerminalBadge from '@/components/ui/TerminalBadge';
import TerminalButton from '@/components/ui/TerminalButton';

interface ErrorFallbackProps {
  error?: Error;
  onRetry?: () => void;
}

function ErrorFallback({ error, onRetry }: ErrorFallbackProps) {
  const { t } = useTranslation('common');

  return (
    <div className="flex items-center justify-center min-h-[40vh]" role="alert">
      <TerminalCard className="w-full max-w-lg">
        <TerminalCard.Body className="space-y-4 py-6 px-6">
          <p className="text-lg">
            <TerminalBadge variant="error">ERR</TerminalBadge>{' '}
            <span className="text-[var(--color-text-primary)]">{t('error')}</span>
          </p>
          {error && (
            <p className="text-sm text-[var(--color-text-muted)]">
              &gt; {error.message}
            </p>
          )}
          {onRetry && (
            <TerminalButton onClick={onRetry}>
              {t('retry')}
            </TerminalButton>
          )}
        </TerminalCard.Body>
      </TerminalCard>
    </div>
  );
}

export default ErrorFallback;
