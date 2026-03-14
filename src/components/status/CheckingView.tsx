import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import Cursor from '@/components/ui/Cursor';

function CheckingView() {
  const { t } = useTranslation('status');

  return (
    <motion.div
      className="flex-1 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      role="status"
      aria-label={t('checking')}
    >
      <div className="text-xs space-y-2">
        <p className="text-muted-foreground">
          <span className="text-foreground">$</span> status --check
        </p>
        <p className="text-foreground">
          {t('checking')} <Cursor />
        </p>
      </div>
    </motion.div>
  );
}

export default CheckingView;
