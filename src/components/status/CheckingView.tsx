import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import Cursor from '@/components/ui/Cursor';

function CheckingView() {
  const { t } = useTranslation('status');

  return (
    <motion.div
      className="flex items-center justify-center min-h-[60vh]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="text-center space-y-4">
        <p className="text-[var(--color-text-muted)] text-sm">$ status --check</p>
        <p className="text-[var(--color-text-primary)]">
          {t('checking')} <Cursor />
        </p>
      </div>
    </motion.div>
  );
}

export default CheckingView;
