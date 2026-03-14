import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import MultilineTypewriterText from '@/components/ui/MultilineTypewriterText';

function LandingView() {
  const { t } = useTranslation('status');

  return (
    <motion.div
      className="flex-1 flex items-center justify-center"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      aria-label={t('apiOnline')}
    >
      <div className="w-full text-xs leading-relaxed">
        <div className="text-muted-foreground">
          <span className="text-foreground">$</span> cat /etc/motd
        </div>
        <div className="mt-2 pl-2 border-l-2 border-border text-muted-foreground space-y-1">
          <p className="text-xs text-muted-foreground">$ status --check</p>
          <p>
            <span className="text-foreground">[OK]</span>{' '}
            <span className="text-foreground">{t('apiOnline')}</span>
          </p>
          <MultilineTypewriterText
            lines={t('goWork').split('\n')}
            speed={40}
            linePrefix="&gt;"
            showCursorOnLast={true}
          />
          <div className="mt-2 pt-2 border-t border-border/50">
            <p className="text-muted-foreground/50"># {t('feedOnlyOnOutage')}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default LandingView;
