import { useTranslation } from 'react-i18next';

interface ErrorFallbackProps {
  error?: Error;
  onRetry?: () => void;
}

function ErrorFallback({ error, onRetry }: ErrorFallbackProps) {
  const { t } = useTranslation('common');

  return (
    <div className="flex items-center justify-center min-h-[40vh]" role="alert">
      <div className="text-xs space-y-2">
        <p>
          <span className="text-foreground">[ERR]</span>{' '}
          <span className="text-muted-foreground">{t('error')}</span>
        </p>
        {error && (
          <p className="text-muted-foreground/50">
            &gt; {error.message}
          </p>
        )}
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
          >
            [{t('retry')}]
          </button>
        )}
      </div>
    </div>
  );
}

export default ErrorFallback;
