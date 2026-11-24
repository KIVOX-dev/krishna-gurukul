import { useEffect, useState } from 'react';

/** Small phone <375, phone <600, large phone/foldable <840, tablet <1200, desktop 1200+. */
export type SizeClass = 'small' | 'phone' | 'large' | 'tablet' | 'desktop';
const classify = (w: number): SizeClass => (w < 375 ? 'small' : w < 600 ? 'phone' : w < 840 ? 'large' : w < 1200 ? 'tablet' : 'desktop');

export function useBreakpoint() {
  const [w, setW] = useState(() => (typeof window === 'undefined' ? 390 : window.innerWidth));
  const [landscape, setLandscape] = useState(() => typeof window !== 'undefined' && window.innerWidth > window.innerHeight);
  useEffect(() => {
    let raf = 0;
    const f = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { setW(window.innerWidth); setLandscape(window.innerWidth > window.innerHeight); }); };
    window.addEventListener('resize', f); window.addEventListener('orientationchange', f);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', f); window.removeEventListener('orientationchange', f); };
  }, []);
  const size = classify(w);
  return {
    width: w, size, landscape,
    bottomTabs: size === 'small' || size === 'phone' || size === 'large', // bottom tab bar
    rail: size === 'tablet',                                              // navigation rail on the left
    sidebar: size === 'desktop',                                          // full sidebar
    twoCol: w >= 600, threeCol: w >= 840,
  };
}
