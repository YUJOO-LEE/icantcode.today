import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import TerminalCard from '@/components/ui/TerminalCard';
import TerminalBadge from '@/components/ui/TerminalBadge';
import TypewriterText from '@/components/ui/TypewriterText';

function LandingView() {
  const { t } = useTranslation('status');

  return (
    <motion.div
      className="flex items-center justify-center min-h-[60vh]"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <TerminalCard className="w-full max-w-lg">
        <TerminalCard.Body className="space-y-4 py-8 px-6">
          <p className="text-[var(--color-text-muted)] text-sm">{t('statusCheck')}</p>
          <p className="text-lg">
            <TerminalBadge variant="success">OK</TerminalBadge>{' '}
            <span className="text-[var(--color-text-primary)]">{t('apiOnline')}</span>
          </p>
          <div className="text-[var(--color-primary)]">
            <p>&gt; <TypewriterText text={t('goWork').split('\n')[0] ?? ''} speed={40} /></p>
            <p>&gt; <TypewriterText text={t('goWork').split('\n')[1] ?? ''} speed={40} showCursor={true} /></p>
          </div>
          <div className="border-t border-[var(--color-border)] pt-4 mt-4">
            <p className="text-[var(--color-text-muted)] text-xs">
              # {t('feedOnlyOnOutage')}
            </p>
          </div>
        </TerminalCard.Body>
      </TerminalCard>
    </motion.div>
  );
}

export default LandingView;
