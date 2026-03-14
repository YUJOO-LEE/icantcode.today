import { useTranslation } from 'react-i18next';
import TerminalButton from '@/components/ui/TerminalButton';

interface ErrorFallbackProps {
  error?: Error;
  onRetry?: () => void;
}

function ErrorFallback({ error, onRetry }: ErrorFallbackProps) {
  const { t } = useTranslation('common');

  return (
    <div className="flex items-center justify-center min-h-[40vh]" role="alert">
      <div className="flex flex-col items-center gap-4">
        <div className="text-xs space-y-2">
          <p>
            <span className="text-foreground">[ERR]</span>{' '}
            <span className="text-muted-foreground">{t('error')}</span>
          </p>
          {error && import.meta.env.DEV && (
            <p className="text-muted-foreground/50">
              &gt; {error.message}
            </p>
          )}
          {onRetry && (
            <TerminalButton onClick={onRetry}>
              {t('retry')}
            </TerminalButton>
          )}
        </div>
      </div>
    </div>
  );
}

export default ErrorFallback;
