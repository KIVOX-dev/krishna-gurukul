import { useEffect, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
export { gsap, ScrollTrigger };

export const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Scope a GSAP context to a ref and clean up. */
export function useGsap(fn: (self: gsap.Context) => void, deps: any[] = []) {
  const root = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (reduced()) return;
    const ctx = gsap.context((self) => fn(self), root);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return root;
}

/** Elements with [data-reveal] fade + rise on scroll. Elements with [data-stagger] children stagger in. */
export function useScrollReveal(deps: any[] = []) {
  return useGsap(() => {
    gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
      gsap.from(el, { y: 50, opacity: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
    });
    gsap.utils.toArray<HTMLElement>('[data-stagger]').forEach((el) => {
      gsap.from(el.children, { y: 60, opacity: 0, rotateX: -12, duration: 0.8, stagger: 0.12, ease: 'back.out(1.4)', scrollTrigger: { trigger: el, start: 'top 85%' } });
    });
    gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((el) => {
      gsap.to(el, { yPercent: Number(el.dataset.parallax) || -20, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    gsap.utils.toArray<HTMLElement>('[data-count]').forEach((el) => {
      const target = Number(el.dataset.count); const o = { v: 0 };
      gsap.to(o, { v: target, duration: 2, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 90%' }, onUpdate: () => { el.textContent = String(Math.round(o.v)); } });
    });
  }, deps);
}

/** 3D tilt that follows the pointer. Attach to any element. */
export function useTilt<T extends HTMLElement>(max = 12) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current; if (!el || reduced() || !window.matchMedia('(hover:hover)').matches) return;
    const rx = gsap.quickTo(el, 'rotationX', { duration: 0.4, ease: 'power3' });
    const ry = gsap.quickTo(el, 'rotationY', { duration: 0.4, ease: 'power3' });
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      ry(((e.clientX - r.left) / r.width - 0.5) * max * 2); rx(-((e.clientY - r.top) / r.height - 0.5) * max * 2);
    };
    const leave = () => { rx(0); ry(0); };
    gsap.set(el, { transformPerspective: 900 });
    el.addEventListener('pointermove', move); el.addEventListener('pointerleave', leave);
    return () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); };
  }, [max]);
  return ref;
}

/** Magnetic hover for CTAs. */
export function useMagnetic<T extends HTMLElement>(strength = 0.35) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current; if (!el || reduced() || !window.matchMedia('(hover:hover)').matches) return;
    const x = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'elastic.out(1,0.4)' });
    const y = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'elastic.out(1,0.4)' });
    const move = (e: PointerEvent) => { const r = el.getBoundingClientRect(); x((e.clientX - (r.left + r.width / 2)) * strength); y((e.clientY - (r.top + r.height / 2)) * strength); };
    const leave = () => { x(0); y(0); };
    el.addEventListener('pointermove', move); el.addEventListener('pointerleave', leave);
    return () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); };
  }, [strength]);
  return ref;
}
