import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';
import { gsap, ScrollTrigger, reduced } from './motion';

const fine = () => typeof window !== 'undefined' && window.matchMedia('(hover:hover)').matches;
const fmt = (n: number) => Math.round(n).toLocaleString('en-IN');

/**
 * Page-wide GSAP effects driven by data attributes (all respect reduced motion):
 *  data-reveal           fade + rise on scroll          data-stagger   children cascade in
 *  data-grow             children grow up from the base data-count    number counts up
 *  data-parallax="-20"   drifts while scrolling         data-marquee="30" endless ticker (needs doubled content)
 *  data-tilt             3D tilt toward the pointer
 * Pass deps that change when async content arrives so the new nodes get animated too.
 */
export function useSiteFx(deps: unknown[] = []) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const root = ref.current; if (!root || reduced()) return;
    const cleanups: (() => void)[] = [];
    const ctx = gsap.context(() => {
      const all = <T extends HTMLElement>(s: string) => gsap.utils.toArray<T>(s);
      const once = (el: Element, start = 'top 90%') => ({ trigger: el, start, once: true });

      all('[data-reveal]').forEach((el) => gsap.from(el, { opacity: 0, y: Number(el.dataset.y) || 36, duration: 0.9, delay: Number(el.dataset.delay) || 0, ease: 'power3.out', clearProps: 'transform,opacity', scrollTrigger: once(el) }));

      all('[data-stagger]').forEach((g) => gsap.from(Array.from(g.children), { opacity: 0, y: 48, scale: 0.96, duration: 0.8, stagger: 0.09, ease: 'power3.out', clearProps: 'transform,opacity', scrollTrigger: once(g, 'top 88%') }));

      all('[data-grow]').forEach((g) => gsap.from(Array.from(g.children), { scaleY: 0, opacity: 0, transformOrigin: '50% 100%', duration: 0.9, stagger: 0.08, ease: 'back.out(1.25)', clearProps: 'transform,opacity', scrollTrigger: once(g, 'top 85%') }));

      all('[data-count]').forEach((el) => {
        const target = Number(el.dataset.count) || 0; const o = { v: 0 };
        el.textContent = '0';
        gsap.to(o, { v: target, duration: 2, ease: 'power2.out', scrollTrigger: once(el, 'top 92%'), onUpdate: () => { el.textContent = fmt(o.v); }, onComplete: () => { el.textContent = fmt(target); } });
      });

      all('[data-parallax]').forEach((el) => gsap.to(el, { yPercent: Number(el.dataset.parallax) || -15, ease: 'none', scrollTrigger: { trigger: el.parentElement ?? el, start: 'top bottom', end: 'bottom top', scrub: 0.6 } }));

      all('[data-marquee]').forEach((el) => { gsap.to(el, { xPercent: -50, duration: Number(el.dataset.marquee) || 30, ease: 'none', repeat: -1 }); });

      if (fine()) all('[data-tilt]').forEach((el) => {
        const rx = gsap.quickTo(el, 'rotationX', { duration: 0.5, ease: 'power3' }); const ry = gsap.quickTo(el, 'rotationY', { duration: 0.5, ease: 'power3' });
        gsap.set(el, { transformPerspective: 900 });
        const move = (e: PointerEvent) => { const r = el.getBoundingClientRect(); ry(((e.clientX - r.left) / r.width - 0.5) * 10); rx(-((e.clientY - r.top) / r.height - 0.5) * 10); };
        const leave = () => { rx(0); ry(0); };
        el.addEventListener('pointermove', move); el.addEventListener('pointerleave', leave);
        cleanups.push(() => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); });
      });
    }, root);
    const t = window.setTimeout(() => ScrollTrigger.refresh(), 500);
    return () => { window.clearTimeout(t); cleanups.forEach((f) => f()); ctx.revert(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
}

/** Home hero: staged entrance, falling beads, floating card, pointer parallax and scroll drift. */
export function useHeroIntro(root: RefObject<HTMLElement>) {
  useLayoutEffect(() => {
    const el = root.current; if (!el || reduced()) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
      tl.from('.hero-pill', { y: 18, opacity: 0, duration: 0.6 })
        .from('.hero-word', { yPercent: 118, rotate: 5, duration: 1, stagger: 0.08 }, '-=0.3')
        .from('.hero-sub', { y: 24, opacity: 0, duration: 0.7 }, '-=0.6')
        .from('.hero-cta > *', { y: 26, opacity: 0, duration: 0.6, stagger: 0.1 }, '-=0.5')
        .from('.hero-trust > *', { y: 12, opacity: 0, duration: 0.5, stagger: 0.08 }, '-=0.3')
        .from('.hero-card', { scale: 0.86, rotate: -5, opacity: 0, duration: 1.1, ease: 'back.out(1.5)' }, 0.2)
        .from('.kg-rod', { y: -80, opacity: 0, duration: 0.9, stagger: 0.07, ease: 'bounce.out' }, 0.75)
        .from('.hero-chip', { scale: 0, opacity: 0, duration: 0.6, stagger: 0.16, ease: 'back.out(2.2)' }, 1.15);

      gsap.to('.hero-art', { y: -12, duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1 });
      gsap.to('.hero-chip-a', { y: -9, duration: 2.4, ease: 'sine.inOut', yoyo: true, repeat: -1 });
      gsap.to('.hero-chip-b', { y: 9, duration: 2.9, ease: 'sine.inOut', yoyo: true, repeat: -1 });
      gsap.to('.hero-frame', { rotate: 363, duration: 60, ease: 'none', repeat: -1 });

      gsap.to('.hero-copy', { yPercent: -10, opacity: 0.35, ease: 'none', scrollTrigger: { trigger: el, start: 'center top', end: 'bottom top', scrub: true } });
      gsap.to('.hero-blob-a', { yPercent: 40, ease: 'none', scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: true } });
      gsap.to('.hero-blob-b', { yPercent: -30, ease: 'none', scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: true } });

      if (fine()) {
        const card = el.querySelector<HTMLElement>('.hero-card');
        if (card) {
          gsap.set(card, { transformPerspective: 1000 });
          const rx = gsap.quickTo(card, 'rotationX', { duration: 0.7, ease: 'power3' }); const ry = gsap.quickTo(card, 'rotationY', { duration: 0.7, ease: 'power3' });
          const move = (e: PointerEvent) => { const r = el.getBoundingClientRect(); ry(((e.clientX - r.left) / r.width - 0.5) * 14); rx(-((e.clientY - r.top) / r.height - 0.5) * 10); };
          el.addEventListener('pointermove', move);
          return () => el.removeEventListener('pointermove', move);
        }
      }
    }, el);
    return () => ctx.revert();
  }, [root]);
}

/** Layout-level motion: scroll progress bar, nav that hides on scroll down, refresh on layout change. */
export function useLayoutFx(headerRef: RefObject<HTMLElement>, barRef: RefObject<HTMLElement>, mainRef: RefObject<HTMLElement>) {
  useEffect(() => {
    if (reduced()) return;
    const triggers: ScrollTrigger[] = [];
    if (barRef.current) gsap.set(barRef.current, { scaleX: 0, transformOrigin: '0 50%' });
    const bar = barRef.current ? gsap.to(barRef.current, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: document.documentElement, start: 'top top', end: 'max', scrub: 0.2 } }) : null;
    const st = ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: (self) => {
        const h = headerRef.current; if (!h) return;
        const hide = self.direction === 1 && self.scroll() > 240;
        gsap.to(h, { yPercent: hide ? -130 : 0, duration: 0.35, ease: 'power2.out', overwrite: 'auto' });
      },
    });
    triggers.push(st);
    let t = 0; const ro = new ResizeObserver(() => { window.clearTimeout(t); t = window.setTimeout(() => ScrollTrigger.refresh(), 200); });
    if (mainRef.current) ro.observe(mainRef.current);
    return () => { ro.disconnect(); window.clearTimeout(t); triggers.forEach((x) => x.kill()); bar?.scrollTrigger?.kill(); bar?.kill(); };
  }, [headerRef, barRef, mainRef]);
}
