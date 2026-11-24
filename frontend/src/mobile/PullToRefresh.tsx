import { useRef, useState, type ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { haptic } from '../native/feel';
import { t } from '../i18n';

const THRESHOLD = 72;

/** Pull down on a list to refresh. Moves with transform only; native overscroll glow is off so the gesture is ours. */
export function PullToRefresh({ onRefresh, children }: { onRefresh: () => Promise<unknown> | void; children: ReactNode }) {
  const [pull, setPull] = useState(0);
  const [busy, setBusy] = useState(false);
  const start = useRef<number | null>(null);

  const atTop = () => (document.scrollingElement?.scrollTop ?? 0) <= 0;
  const onStart = (e: React.TouchEvent) => { start.current = atTop() && !busy ? e.touches[0].clientY : null; };
  const onMove = (e: React.TouchEvent) => {
    if (start.current === null) return;
    const dy = e.touches[0].clientY - start.current;
    if (dy > 0) setPull(Math.min(110, dy * 0.5)); else { start.current = null; setPull(0); }
  };
  const onEnd = async () => {
    if (start.current === null) return; start.current = null;
    if (pull >= THRESHOLD) { setBusy(true); setPull(THRESHOLD); haptic('tap'); try { await onRefresh(); } finally { setBusy(false); setPull(0); } } else setPull(0);
  };

  return (
    <div onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd} onTouchCancel={onEnd} style={{ overscrollBehaviorY: 'contain' }}>
      <div className="flex h-0 items-end justify-center overflow-visible" aria-live="polite">
        <div className="mb-1 flex items-center gap-2 text-xs font-bold text-navy/70" style={{ transform: `translate3d(0,${pull - 36}px,0)`, opacity: Math.min(1, pull / 40) }}>
          <RefreshCw size={16} className={busy ? 'animate-spin' : ''} style={{ transform: busy ? undefined : `rotate(${pull * 3}deg)` }} />
          {busy ? t('refreshing') : pull >= THRESHOLD ? t('releaseToRefresh') : t('pullToRefresh')}
        </div>
      </div>
      <div style={{ transform: `translate3d(0,${pull}px,0)`, transition: start.current === null ? 'transform .2s ease' : undefined }}>{children}</div>
    </div>
  );
}
