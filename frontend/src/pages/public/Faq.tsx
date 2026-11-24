import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronDown, Pause, Play } from 'lucide-react';
import { gsap, reduced } from '../../utils/motion';

/** FAQ accordion: one answer open at a time, advances every 5 s with a progress bar.
 *  Pauses on hover/focus, while off-screen, or via the pause button. Clicking a question jumps to it. */
export function FaqAccordion({ items, interval = 5000 }: { items: readonly (readonly [string, string])[]; interval?: number }) {
  const [active, setActive] = useState(0);
  const [hover, setHover] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const panels = useRef<(HTMLDivElement | null)[]>([]);
  const bars = useRef<(HTMLDivElement | null)[]>([]);
  const tween = useRef<gsap.core.Tween | null>(null);
  const paused = userPaused || hover || !inView;

  useEffect(() => {
    const el = wrap.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.25 });
    io.observe(el); return () => io.disconnect();
  }, []);

  // open the active answer, close the rest
  useLayoutEffect(() => {
    panels.current.forEach((el, i) => { if (el) gsap.to(el, { height: i === active ? 'auto' : 0, opacity: i === active ? 1 : 0, duration: reduced() ? 0 : 0.5, ease: 'power3.inOut', overwrite: 'auto' }); });
  }, [active]);

  // 5 second timer drawn as a progress bar; when it ends, open the next question
  useEffect(() => {
    const bar = bars.current[active]; if (!bar) return;
    gsap.set(bars.current.filter(Boolean), { scaleX: 0 });
    tween.current?.kill();
    tween.current = gsap.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: interval / 1000, ease: 'none', transformOrigin: '0 50%', onComplete: () => setActive((a) => (a + 1) % items.length) });
    if (paused) tween.current.pause();
    return () => { tween.current?.kill(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, interval, items.length]);
  useEffect(() => { if (paused) tween.current?.pause(); else tween.current?.resume(); }, [paused]);

  return (
    <div ref={wrap} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onFocus={() => setHover(true)} onBlur={() => setHover(false)}>
      <div className="space-y-3">
        {items.map(([q, a], i) => {
          const open = i === active;
          return (
            <div key={q} className={`relative overflow-hidden rounded-3xl border bg-white transition-shadow duration-300 ${open ? 'border-peacock/30 shadow-lg' : 'border-peacock/10 shadow-sm'}`}>
              <button type="button" aria-expanded={open} aria-controls={`faq-${i}`} id={`faq-q-${i}`} onClick={() => setActive(i)} className="flex min-h-16 w-full items-center gap-4 px-5 py-4 text-left">
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full font-display text-sm font-extrabold transition-colors ${open ? 'bg-rose text-white' : 'bg-peacock-soft text-peacock-deep'}`}>{i + 1}</span>
                <span className="flex-1 font-display text-lg font-extrabold leading-snug text-plum sm:text-xl">{q}</span>
                <ChevronDown className={`shrink-0 text-rose transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
              </button>
              <div id={`faq-${i}`} role="region" aria-labelledby={`faq-q-${i}`} ref={(el) => { panels.current[i] = el; }} style={{ height: i === 0 ? 'auto' : 0, opacity: i === 0 ? 1 : 0, overflow: 'hidden' }}>
                <p className="px-5 pb-6 pl-[4.25rem] pr-6 text-lg leading-relaxed text-plum/75">{a}</p>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-1 bg-peacock-soft/0" aria-hidden>
                <div ref={(el) => { bars.current[i] = el; }} className="h-full origin-left rounded-full bg-gradient-to-r from-peacock to-rose" style={{ transform: 'scaleX(0)' }} />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-5 flex items-center justify-center gap-3 text-sm font-bold text-plum/60">
        <span aria-live="off">{active + 1} / {items.length}</span>
        <button type="button" onClick={() => setUserPaused((p) => !p)} className="inline-flex min-h-12 items-center gap-1.5 rounded-full border border-peacock/20 bg-white px-4 font-extrabold text-peacock-deep" aria-label={userPaused ? 'Resume automatic questions' : 'Pause automatic questions'}>
          {userPaused ? <><Play size={16} />Auto play</> : <><Pause size={16} />Pause</>}
        </button>
      </div>
    </div>
  );
}
