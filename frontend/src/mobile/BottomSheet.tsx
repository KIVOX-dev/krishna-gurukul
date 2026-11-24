import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useBackClose } from '../native/backStack';
import { useBreakpoint } from './useBreakpoint';
import { t } from '../i18n';

/** Bottom sheet on phones (drag down to close, Android back closes it); centred dialog from 600 px up. Only transform + opacity animate. */
export function BottomSheet({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode }) {
  const { twoCol } = useBreakpoint();
  useBackClose(open, onClose);
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[90] flex items-end justify-center bg-navy/45 sm:items-center sm:p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={(e) => e.target === e.currentTarget && onClose()}>
          <motion.div
            role="dialog" aria-modal aria-label={title}
            className="flex max-h-[92dvh] w-full flex-col bg-white shadow-2xl sm:max-w-lg sm:rounded-chunk rounded-t-[28px]"
            initial={twoCol ? { scale: 0.94, opacity: 0 } : { y: '100%' }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={twoCol ? { opacity: 0 } : { y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            drag={twoCol ? false : 'y'} dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, i) => { if (i.offset.y > 120 || i.velocity.y > 600) onClose(); }}
          >
            {!twoCol && <div className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-navy/20" aria-hidden />}
            <div className="flex shrink-0 items-center justify-between px-5 pb-2 pt-3">
              <h3 className="font-display text-xl font-extrabold text-navy">{title}</h3>
              <button aria-label={t('common.close')} onClick={onClose} className="grid h-12 w-12 place-items-center rounded-full active:bg-sky/10"><X /></button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4">{children}</div>
            {footer && <div className="shrink-0 border-t border-navy/10 bg-white px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
