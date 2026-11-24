import { useEffect, useId, useState } from 'react';
import { beadsToDigit, numberToRods, rodsToNumber, type BeadState } from '@kg/shared';
import { sfx } from '../../utils/sound';

// lacquer palettes: [highlight, base, shadow]
const LAC = [['#5FA8F5', '#1565C0', '#0A3A7A'], ['#FFD27A', '#FFA723', '#C77700'], ['#FF9A5A', '#E8590C', '#9A3300']];

interface Props { rods?: number; value?: number; interactive?: boolean; onChange?: (n: number) => void; highlightRod?: number; compact?: boolean }

/** Realistic soroban: mahogany frame with grain, brass rods, lacquered biconical beads. Tap a bead to move it; the value updates live. */
export function VirtualAbacus({ rods = 7, value, interactive = true, onChange, compact }: Props) {
  const uid = useId().replace(/:/g, '');
  const [state, setState] = useState<BeadState[]>(() => numberToRods(value ?? 0, rods));
  useEffect(() => { if (value !== undefined) setState(numberToRods(value, rods)); }, [value, rods]);

  const update = (next: BeadState[]) => { setState(next); sfx.bead(); onChange?.(rodsToNumber(next)); };
  const toggleHeaven = (i: number) => interactive && update(state.map((r, k) => (k === i ? { ...r, heaven: (r.heaven ? 0 : 1) as 0 | 1 } : r)));
  const tapEarth = (i: number, b: number) => interactive && update(state.map((r, k) => (k === i ? { ...r, earth: r.earth > b ? b : b + 1 } : r)));

  // geometry
  const gap = compact ? 44 : 56; const pad = 26; const W = rods * gap + pad * 2; const H = compact ? 230 : 280;
  const top = 22; const bottom = H - 22; const beadH = compact ? 24 : 28; const rx = compact ? 19 : 23;
  const beamY = top + (compact ? 62 : 74); const beamH = 14;
  const x0 = pad + gap / 2;
  const key = (e: React.KeyboardEvent, fn: () => void) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); } };

  const bead = (x: number, y: number, c: number, label: string, onClick: () => void, k: string) => {
    const d = LAC[c % 3][2]; const h = beadH / 2;
    return (
      <g key={k} role={interactive ? 'button' : undefined} tabIndex={interactive ? 0 : undefined} aria-label={label} onClick={onClick} onKeyDown={(e) => key(e, onClick)}
        style={{ transform: `translate(${x}px, ${y}px)`, transition: 'transform .26s cubic-bezier(.2,.9,.3,1.2)', cursor: interactive ? 'pointer' : 'default', outline: 'none' }}>
        <ellipse cx="2" cy={h - 1} rx={rx} ry="4.5" fill="#000" opacity=".28" filter={`url(#${uid}soft)`} />
        <path d={`M${-rx - 1} 0 Q${-rx * 0.6} ${-h - 1} 0 ${-h} Q${rx * 0.6} ${-h - 1} ${rx + 1} 0 Q${rx * 0.6} ${h + 1} 0 ${h} Q${-rx * 0.6} ${h + 1} ${-rx - 1} 0Z`} fill={`url(#${uid}b${c % 3})`} stroke={d} strokeWidth=".8" />
        <path d={`M${-rx * 0.65} ${-h * 0.35} Q0 ${-h * 0.85} ${rx * 0.5} ${-h * 0.4}`} stroke="#fff" strokeOpacity=".75" strokeWidth="2.4" strokeLinecap="round" fill="none" />
        <circle r="2.8" fill="#2a1608" opacity=".55" />
      </g>
    );
  };

  const total = state.reduce((a, r) => a * 10 + beadsToDigit(r), 0);
  return (
    <div className="inline-block max-w-full overflow-x-auto no-scrollbar">
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="block max-w-full" role="group" aria-label="Virtual abacus">
        <defs>
          <linearGradient id={`${uid}wood`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9c5624" /><stop offset=".5" stopColor="#7a3d14" /><stop offset="1" stopColor="#552809" /></linearGradient>
          <linearGradient id={`${uid}inner`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#d9a566" /><stop offset="1" stopColor="#b9803f" /></linearGradient>
          <linearGradient id={`${uid}rod`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#8a6a1f" /><stop offset=".45" stopColor="#f3dc8a" /><stop offset="1" stopColor="#7d5e18" /></linearGradient>
          <linearGradient id={`${uid}beam`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#a35a26" /><stop offset=".5" stopColor="#6b330f" /><stop offset="1" stopColor="#3f1d06" /></linearGradient>
          {LAC.map(([l, b, d], i) => <radialGradient key={i} id={`${uid}b${i}`} cx=".35" cy=".3" r=".9"><stop offset="0" stopColor={l} /><stop offset=".45" stopColor={b} /><stop offset="1" stopColor={d} /></radialGradient>)}
          <filter id={`${uid}soft`}><feGaussianBlur stdDeviation="2" /></filter>
          <filter id={`${uid}sh`} x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="8" stdDeviation="7" floodColor="#1a0d02" floodOpacity=".35" /></filter>
          <filter id={`${uid}grain`} x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".012 .55" numOctaves="3" seed="4" /><feColorMatrix values="0 0 0 0 .18  0 0 0 0 .08  0 0 0 0 .02  0 0 0 .55 -.08" /><feComposite in2="SourceGraphic" operator="in" /></filter>
          <clipPath id={`${uid}clip`}><rect x="2" y="2" width={W - 4} height={H - 8} rx="16" /></clipPath>
        </defs>
        <g filter={`url(#${uid}sh)`}>
          <rect x="2" y="2" width={W - 4} height={H - 8} rx="16" fill={`url(#${uid}wood)`} />
          <rect x="2" y="2" width={W - 4} height={H - 8} rx="16" fill="#000" filter={`url(#${uid}grain)`} clipPath={`url(#${uid}clip)`} opacity=".9" />
          <rect x="3" y="3" width={W - 6} height={H - 10} rx="15" fill="none" stroke="#e8b878" strokeOpacity=".45" strokeWidth="1.6" />
          <rect x="14" y="14" width={W - 28} height={H - 32} rx="8" fill={`url(#${uid}inner)`} />
          <rect x="14" y="14" width={W - 28} height={H - 32} rx="8" fill="none" stroke="#3a1a05" strokeOpacity=".65" strokeWidth="2.5" />
          <rect x="16" y="16" width={W - 32} height="14" rx="6" fill="#000" opacity=".16" />
        </g>
        {state.map((_, i) => { const x = x0 + i * gap; return <g key={`r${i}`}><rect x={x - 2.5} y="16" width="5" height={H - 34} rx="2.5" fill={`url(#${uid}rod)`} /><rect x={x + 0.8} y="16" width="1" height={H - 34} fill="#fff" opacity=".35" /></g>; })}
        {state.map((r, i) => {
          const x = x0 + i * gap; const out: React.ReactNode[] = [];
          const hUp = top + 4 + beadH / 2; const hDown = beamY - beadH / 2 - 2;
          out.push(bead(x, r.heaven ? hDown : hUp, i, `Rod ${i + 1} heaven bead`, () => toggleHeaven(i), `h${i}`));
          for (let b = 0; b < 4; b++) {
            const up = b < r.earth;
            const y = up ? beamY + beamH + 2 + beadH / 2 + b * beadH : bottom - 4 - beadH / 2 - (3 - b) * beadH;
            out.push(bead(x, y, i + b + 1, `Rod ${i + 1} earth bead ${b + 1}`, () => tapEarth(i, b), `e${i}${b}`));
          }
          return out;
        })}
        <rect x="14" y={beamY} width={W - 28} height={beamH} fill={`url(#${uid}beam)`} pointerEvents="none" />
        <rect x="14" y={beamY} width={W - 28} height="2" fill="#f0c58a" opacity=".6" pointerEvents="none" /><rect x="14" y={beamY + beamH - 2} width={W - 28} height="2" fill="#000" opacity=".4" pointerEvents="none" />
        {state.map((_, i) => ((rods - 1 - i) % 3 === 0 ? <circle key={`d${i}`} cx={x0 + i * gap} cy={beamY + beamH / 2} r="2.2" fill="#f3dc8a" opacity=".9" pointerEvents="none" /> : null))}
      </svg>
      <div className="mt-2 text-center font-display text-3xl font-extrabold text-navy" aria-live="polite">{total}</div>
    </div>
  );
}
