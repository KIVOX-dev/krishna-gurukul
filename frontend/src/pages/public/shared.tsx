import { useLayoutEffect, useRef, useState } from 'react';
import { gsap, reduced } from '../../utils/motion';
import { useQuery } from '@tanstack/react-query';
import { get } from '../../services/api';

export const SITE = {
  phone: '+91 82706 65953', tel: '+918270665953', wa: import.meta.env.VITE_WHATSAPP_NUMBER ?? '918270665953', email: 'krishnagurukul2022@gmail.com',
  address: 'Near KN Hall, Peedampalli Main Road, Pattanam, Coimbatore 641011',
  map: 'https://www.google.com/maps?q=Krishna+Gurukul+Pattanam+Coimbatore&output=embed',
  tagline: 'Where Tradition Meets Modern Excellence in Learning!',
};

export const useCms = () => useQuery({ queryKey: ['cms'], queryFn: () => get('/public/cms') });
export const useCourses = () => useQuery({ queryKey: ['courses'], queryFn: () => get('/public/courses') });

export function CourseIcon({ type, size = 72 }: { type: string; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 64 64', 'aria-hidden': true } as const;
  if (type === 'music') return (<svg {...common}><circle cx="32" cy="32" r="30" fill="#FFA723" /><path d="M26 18v24a6 6 0 1 1-4-5.6V16l22-4v24a6 6 0 1 1-4-5.6V16z" fill="#fff" /></svg>);
  if (type === 'vedic') return (<svg {...common}><circle cx="32" cy="32" r="30" fill="#2F8EE0" /><path d="M16 32c0-8 6-12 11-12s7 8 10 12 6 12 11 12 6-4 6-12" stroke="#fff" strokeWidth="5" fill="none" strokeLinecap="round" transform="translate(-3 0)" /><text x="32" y="26" fontSize="12" fill="#FFA723" fontWeight="800" textAnchor="middle">√π</text></svg>);
  if (type === 'tuition') return (<svg {...common}><circle cx="32" cy="32" r="30" fill="#2BB88F" /><path d="M14 22l18-6 18 6v22l-18-6-18 6z" fill="#fff" /><path d="M32 16v22" stroke="#2BB88F" strokeWidth="3" /></svg>);
  return (<svg {...common}><circle cx="32" cy="32" r="30" fill="#EC6206" /><rect x="14" y="16" width="36" height="32" rx="4" fill="#fff" /><path d="M20 16v32M32 16v32M44 16v32" stroke="#EC6206" strokeWidth="2" /><circle cx="20" cy="28" r="3.5" fill="#00457F" /><circle cx="32" cy="36" r="3.5" fill="#FFA723" /><circle cx="44" cy="24" r="3.5" fill="#2F8EE0" /></svg>);
}

export const Wave = ({ flip, color = '#fff' }: { flip?: boolean; color?: string }) => (
  <svg viewBox="0 0 1440 90" preserveAspectRatio="none" className={`block h-[60px] w-full ${flip ? 'rotate-180' : ''}`} aria-hidden><path fill={color} d="M0 40c240 60 480 60 720 20s480-50 720 10v20H0z" /></svg>
);

/** GSAP scroll reveal: fades and rises once when scrolled into view. Props are cleared afterwards so hover transforms still work. */
export function Reveal({ children, delay = 0, className = '', y = 32 }: { children: React.ReactNode; delay?: number; className?: string; y?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current; if (!el || reduced()) return;
    const tw = gsap.from(el, { opacity: 0, y, duration: 0.9, delay, ease: 'power3.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
    return () => { tw.scrollTrigger?.kill(); tw.kill(); gsap.set(el, { clearProps: 'transform,opacity' }); };
  }, [delay, y]);
  return <div ref={ref} className={className}>{children}</div>;
}

export const SectionHead = ({ eyebrow, title, sub, center = true, tone = 'light' }: { eyebrow?: string; title: React.ReactNode; sub?: string; center?: boolean; tone?: 'light' | 'dark' }) => (
  <Reveal className={center ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
    {eyebrow && <p className={`mb-2 font-display text-sm font-extrabold uppercase tracking-[0.18em] ${tone === 'dark' ? 'text-marigold' : 'text-rose'}`}>{eyebrow}</p>}
    <h2 className={`text-4xl font-extrabold leading-tight sm:text-5xl ${tone === 'dark' ? 'text-white' : 'text-plum'}`}>{title}</h2>
    {sub && <p className={`mt-3 text-lg ${tone === 'dark' ? 'text-white/75' : 'text-plum/70'}`}>{sub}</p>}
  </Reveal>
);

/** Realistic soroban. Move the pointer over a rod and its beads slide to follow it (touch drag works too). */
export function AbacusArt({ className = '' }: { className?: string }) {
  const rods = 7; const x0 = 78; const gap = 54;
  const lac = [['#5FA8F5', '#1565C0', '#0A3A7A'], ['#FFD27A', '#FFA723', '#C77700'], ['#FF9A5A', '#E8590C', '#9A3300']];
  const [digits, setDigits] = useState([2, 4, 0, 7, 1, 5, 3]);
  const svg = useRef<SVGSVGElement>(null);

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const el = svg.current; const m = el?.getScreenCTM(); if (!el || !m) return;
    const pt = el.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; const { x, y } = pt.matrixTransform(m.inverse());
    const rod = Math.round((x - x0) / gap);
    if (rod < 0 || rod >= rods || Math.abs(x - (x0 + rod * gap)) > gap * 0.62 || y < 50 || y > 310) return;
    setDigits((d) => {
      const cur = d[rod]; let heaven = cur >= 5 ? 1 : 0; let earth = cur % 5;
      if (y < 143) heaven = y > 97 ? 1 : 0; // heaven bead follows the pointer
      else earth = Math.max(0, Math.min(4, Math.round((y - 144) / 26))); // earth beads rise to meet the pointer
      const next = heaven * 5 + earth; if (next === cur) return d;
      const c = [...d]; c[rod] = next; return c;
    });
  };

  const bead = (x: number, y: number, c: number, key: string) => {
    const [l, b, d] = lac[c % 3];
    return (
      <g key={key} style={{ transform: `translate(${x}px, ${y}px)`, transition: 'transform .28s cubic-bezier(.2,.9,.3,1.2)' }}>
        <ellipse cx="2" cy="12" rx="22" ry="5" fill="#000" opacity=".28" filter="url(#soft)" />
        <path d="M-23 0 Q-14 -15 0 -14 Q14 -15 23 0 Q14 15 0 14 Q-14 15 -23 0Z" fill={`url(#b${c % 3})`} stroke={d} strokeWidth=".8" />
        <path d="M-15 -5 Q0 -11 12 -6" stroke="#fff" strokeOpacity=".75" strokeWidth="2.6" strokeLinecap="round" fill="none" />
        <ellipse cx="9" cy="7" rx="8" ry="2.5" fill={l} opacity=".35" />
        <circle r="3.2" fill="#2a1608" opacity=".55" />
      </g>
    );
  };
  return (
    <svg ref={svg} onPointerMove={onMove} style={{ touchAction: 'pan-y', cursor: 'grab' }} viewBox="0 0 480 360" className={className} role="img" aria-label="Wooden abacus. Move your pointer over the rods to slide the beads.">
      <defs>
        <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9c5624" /><stop offset=".5" stopColor="#7a3d14" /><stop offset="1" stopColor="#552809" /></linearGradient>
        <linearGradient id="inner" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#d9a566" /><stop offset="1" stopColor="#b9803f" /></linearGradient>
        <linearGradient id="rod" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#8a6a1f" /><stop offset=".45" stopColor="#f3dc8a" /><stop offset="1" stopColor="#7d5e18" /></linearGradient>
        <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#a35a26" /><stop offset=".5" stopColor="#6b330f" /><stop offset="1" stopColor="#3f1d06" /></linearGradient>
        {lac.map(([l, b, d], i) => <radialGradient key={i} id={`b${i}`} cx=".35" cy=".3" r=".9"><stop offset="0" stopColor={l} /><stop offset=".45" stopColor={b} /><stop offset="1" stopColor={d} /></radialGradient>)}
        <filter id="soft"><feGaussianBlur stdDeviation="2.2" /></filter>
        <filter id="sh" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="16" stdDeviation="14" floodColor="#1a0d02" floodOpacity=".4" /></filter>
        <filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".012 .55" numOctaves="3" seed="4" /><feColorMatrix values="0 0 0 0 .18  0 0 0 0 .08  0 0 0 0 .02  0 0 0 .55 -.08" /><feComposite in2="SourceGraphic" operator="in" /></filter>
        <clipPath id="frameClip"><rect x="24" y="30" width="432" height="300" rx="22" /></clipPath>
      </defs>
      <g filter="url(#sh)">
        <rect x="24" y="30" width="432" height="300" rx="22" fill="url(#wood)" />
        <rect x="24" y="30" width="432" height="300" rx="22" fill="#000" filter="url(#grain)" clipPath="url(#frameClip)" opacity=".9" />
        <rect x="25" y="31" width="430" height="298" rx="21" fill="none" stroke="#e8b878" strokeOpacity=".45" strokeWidth="2" />
        <rect x="44" y="50" width="392" height="260" rx="10" fill="url(#inner)" />
        <rect x="44" y="50" width="392" height="260" rx="10" fill="none" stroke="#3a1a05" strokeOpacity=".65" strokeWidth="3" />
        <rect x="46" y="52" width="388" height="22" rx="8" fill="#000" opacity=".18" />
      </g>
      {Array.from({ length: rods }, (_, i) => { const x = x0 + i * gap; return <g key={`r${i}`}><rect x={x - 3} y="52" width="6" height="256" rx="3" fill="url(#rod)" /><rect x={x + 1} y="52" width="1.2" height="256" fill="#fff" opacity=".35" /></g>; })}
      {Array.from({ length: rods }, (_, i) => {
        const x = x0 + i * gap; const d = digits[i]; const heavenDown = d >= 5; const earthUp = d % 5; const out: React.ReactNode[] = [];
        out.push(bead(x, heavenDown ? 114 : 80, i, `h${i}`));
        for (let k = 0; k < 4; k++) out.push(bead(x, k < earthUp ? 158 + k * 26 : 310 - 18 - (3 - k) * 26, i + k + 1, `e${i}${k}`));
        return out;
      })}
      <rect x="44" y="127" width="392" height="17" fill="url(#beam)" pointerEvents="none" /><rect x="44" y="127" width="392" height="2" fill="#f0c58a" opacity=".6" pointerEvents="none" /><rect x="44" y="142" width="392" height="2" fill="#000" opacity=".4" pointerEvents="none" />
      {[1, 4, 7].map((n) => <circle key={n} cx={x0 + (n - 1) * gap + gap / 2 - (n === 7 ? gap / 2 : 0)} cy="135.5" r="2.2" fill="#f3dc8a" opacity=".9" pointerEvents="none" />)}
    </svg>
  );
}
