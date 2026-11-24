import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement> & { size?: number };
const base = (size: number, p: P) => ({ width: size, height: size, viewBox: '0 0 48 48', 'aria-hidden': true, ...p, size: undefined } as any);

/* ------------------------------- mascot avatars ------------------------------- */
const A: ((p: any) => JSX.Element)[] = [
  // 0 lion
  (p) => (<svg {...p}><circle cx="24" cy="24" r="21" fill="#E8943A" /><circle cx="24" cy="25" r="14" fill="#FFC46B" /><circle cx="12" cy="14" r="5" fill="#C77A25" /><circle cx="36" cy="14" r="5" fill="#C77A25" /><circle cx="19" cy="23" r="2" fill="#3a2209" /><circle cx="29" cy="23" r="2" fill="#3a2209" /><ellipse cx="24" cy="29" rx="6" ry="4.5" fill="#fff0d2" /><path d="M21.5 27h5l-2.5 3z" fill="#3a2209" /></svg>),
  // 1 elephant
  (p) => (<svg {...p}><ellipse cx="9" cy="24" rx="8" ry="11" fill="#8E9BAA" /><ellipse cx="39" cy="24" rx="8" ry="11" fill="#8E9BAA" /><circle cx="24" cy="22" r="14" fill="#AEB9C6" /><path d="M20 28h8v10a4 4 0 0 1-8 0z" fill="#9AA7B5" /><circle cx="18.5" cy="19" r="2" fill="#1f2a36" /><circle cx="29.5" cy="19" r="2" fill="#1f2a36" /><path d="M13 28q-3 6 0 8" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" fill="none" /></svg>),
  // 2 peacock
  (p) => (<svg {...p}><g transform="translate(24 28)">{[-70, -40, -10, 20, 50, 80].map((r, i) => <ellipse key={i} cx="0" cy="-16" rx="5" ry="14" transform={`rotate(${r - 5})`} fill={i % 2 ? '#1FA39A' : '#2A7DE1'} />)}</g>{[-70, -40, -10, 20, 50, 80].map((r, i) => { const a = ((r - 5 - 90) * Math.PI) / 180; return <circle key={i} cx={24 + Math.cos(a) * 17} cy={28 + Math.sin(a) * 17} r="2.6" fill="#FFC857" stroke="#0f4f7d" strokeWidth=".8" />; })}<ellipse cx="24" cy="34" rx="7" ry="9" fill="#1565C0" /><circle cx="24" cy="23" r="5.5" fill="#2A7DE1" /><circle cx="22.5" cy="22" r="1.1" fill="#fff" /><path d="M24 17v-4M22 14l2-3 2 3" stroke="#1565C0" strokeWidth="1.6" fill="none" strokeLinecap="round" /><path d="M24 25l-2 3h4z" fill="#FFB020" /></svg>),
  // 3 tiger
  (p) => (<svg {...p}><circle cx="10" cy="12" r="5" fill="#F08A24" /><circle cx="38" cy="12" r="5" fill="#F08A24" /><circle cx="24" cy="25" r="19" fill="#F89A2B" /><path d="M8 22l7 2M8 29l7-1M40 22l-7 2M40 29l-7-1M24 7v7" stroke="#3a2209" strokeWidth="2.6" strokeLinecap="round" /><ellipse cx="24" cy="31" rx="9" ry="7" fill="#fff6e6" /><circle cx="17.5" cy="23" r="2.2" fill="#3a2209" /><circle cx="30.5" cy="23" r="2.2" fill="#3a2209" /><path d="M21.5 28h5l-2.5 3z" fill="#3a2209" /></svg>),
  // 4 owl
  (p) => (<svg {...p}><path d="M8 8l8 5M40 8l-8 5" stroke="#7B4A22" strokeWidth="4" strokeLinecap="round" /><ellipse cx="24" cy="26" rx="18" ry="19" fill="#9A6330" /><ellipse cx="24" cy="32" rx="10" ry="10" fill="#E8C79A" /><circle cx="16.5" cy="21" r="8" fill="#fff" /><circle cx="31.5" cy="21" r="8" fill="#fff" /><circle cx="16.5" cy="21" r="4" fill="#2a1608" /><circle cx="31.5" cy="21" r="4" fill="#2a1608" /><circle cx="15" cy="19.5" r="1.2" fill="#fff" /><circle cx="30" cy="19.5" r="1.2" fill="#fff" /><path d="M21.5 27h5l-2.5 5z" fill="#FFA723" /></svg>),
  // 5 panda
  (p) => (<svg {...p}><circle cx="9" cy="10" r="6" fill="#222" /><circle cx="39" cy="10" r="6" fill="#222" /><circle cx="24" cy="26" r="19" fill="#fff" stroke="#d9dee5" /><ellipse cx="16" cy="23" rx="5" ry="6.5" fill="#222" transform="rotate(-18 16 23)" /><ellipse cx="32" cy="23" rx="5" ry="6.5" fill="#222" transform="rotate(18 32 23)" /><circle cx="16.5" cy="23" r="1.8" fill="#fff" /><circle cx="31.5" cy="23" r="1.8" fill="#fff" /><ellipse cx="24" cy="31" rx="3.4" ry="2.4" fill="#222" /></svg>),
  // 6 fox
  (p) => (<svg {...p}><path d="M5 5l11 8-6 12zM43 5L32 13l6 12z" fill="#E8590C" /><path d="M24 44L5 25q0-14 19-14t19 14z" fill="#F4791F" /><path d="M24 44L9 29q15-4 15 4 0-8 15-4z" fill="#fff" /><circle cx="17" cy="24" r="2.2" fill="#2a1608" /><circle cx="31" cy="24" r="2.2" fill="#2a1608" /><circle cx="24" cy="37" r="2.4" fill="#2a1608" /></svg>),
  // 7 dolphin
  (p) => (<svg {...p}><circle cx="24" cy="24" r="21" fill="#CFE8FA" /><path d="M6 32q4-18 22-18 6 0 10 4-6 0-9 5 5 1 8 6-8-3-14 0-9 5-17 3z" fill="#2F8EE0" /><path d="M18 14q2-8 8-8-1 5-3 8z" fill="#1565C0" /><path d="M8 33q10 4 22-4" stroke="#fff" strokeOpacity=".6" strokeWidth="2.4" fill="none" strokeLinecap="round" /><circle cx="33" cy="21" r="1.7" fill="#0a2540" /></svg>),
];
export const Animal = ({ i = 0, size = 40 }: { i?: number; size?: number }) => A[((i % 8) + 8) % 8](base(size, {}));

/* --------------------------------- symbols --------------------------------- */
export const Trophy = ({ size = 40, ...p }: P) => (
  <svg {...base(size, p)}><path d="M12 6h24v10a12 12 0 0 1-24 0z" fill="#FFB020" /><path d="M12 9H5v3a8 8 0 0 0 8 8M36 9h7v3a8 8 0 0 1-8 8" stroke="#E08A00" strokeWidth="3" fill="none" strokeLinecap="round" /><path d="M16 8h6v16a12 12 0 0 1-6-8z" fill="#fff" opacity=".35" /><rect x="21" y="27" width="6" height="8" fill="#E08A00" /><rect x="14" y="35" width="20" height="6" rx="2" fill="#7a4a22" /><rect x="18" y="37" width="12" height="2" rx="1" fill="#FFD27A" /></svg>
);
export const Medal = ({ place = 1, size = 28, ...p }: P & { place?: number }) => {
  const c = ['#FFB020', '#C0C7CF', '#CD7F32'][(place - 1) % 3]; const d = ['#C97F00', '#8E97A3', '#8F5420'][(place - 1) % 3];
  return (<svg {...base(size, p)}><path d="M14 3h8l4 14h-8zM34 3h-8l-4 14h8z" fill="#2F8EE0" /><circle cx="24" cy="30" r="13" fill={c} stroke={d} strokeWidth="2" /><circle cx="24" cy="30" r="8.5" fill="none" stroke={d} strokeOpacity=".5" strokeWidth="1.5" /><text x="24" y="35" textAnchor="middle" fontSize="14" fontWeight="800" fill={d} fontFamily="system-ui">{place}</text></svg>);
};
export const Badge = ({ size = 22, ...p }: P) => (<svg {...base(size, p)}><path d="M24 3l5 4 6-.5 2 6 5 3-2 6 2 6-5 3-2 6-6-.5-5 4-5-4-6 .5-2-6-5-3 2-6-2-6 5-3 2-6 6 .5z" fill="#FFB020" stroke="#C97F00" strokeWidth="1.5" /><path d="M16 24l6 6 11-12" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>);
export const StarIcon = ({ on = true, size = 18, ...p }: P & { on?: boolean }) => (<svg {...base(size, p)}><path d="M24 3l6.2 14 15.3 1.4-11.6 10.2 3.4 15L24 35.3 10.7 43.6l3.4-15L2.5 18.4 17.8 17z" fill={on ? '#FFB020' : '#D9E2EC'} stroke={on ? '#E8590C' : '#C5D4E2'} strokeWidth="1.5" strokeLinejoin="round" /></svg>);
export const Stars = ({ n = 0, size = 16 }: { n?: number; size?: number }) => (<span className="inline-flex items-center gap-0.5 align-middle" aria-label={`${n} stars`}>{[1, 2, 3].map((k) => <StarIcon key={k} on={k <= n} size={size} />)}</span>);
export const Flame = ({ size = 20, ...p }: P) => (<svg {...base(size, p)}><path d="M24 3c2 8 12 12 12 24a12 12 0 0 1-24 0c0-6 3-9 5-12 1 3 3 4 4 4 0-6-1-10 3-16z" fill="#F4791F" /><path d="M24 22c1 5 6 7 6 13a6 6 0 0 1-12 0c0-4 4-6 6-13z" fill="#FFD27A" /></svg>);
export const Sparkle = ({ size = 18, ...p }: P) => (<svg {...base(size, p)}><path d="M20 4l4 12 12 4-12 4-4 12-4-12-12-4 12-4z" fill="#FFB020" /><path d="M37 26l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill="#F4791F" /></svg>);
export const Party = ({ size = 22, ...p }: P) => (<svg {...base(size, p)}><path d="M6 42l10-26 16 16z" fill="#FFB020" /><path d="M6 42l5-13 8 8z" fill="#E8590C" /><path d="M22 14c0-5 6-5 6-10M30 22c5 0 6-6 12-6M32 12l2-4M40 24l4 2" stroke="#2F8EE0" strokeWidth="2.6" strokeLinecap="round" fill="none" /><circle cx="34" cy="6" r="2" fill="#E8590C" /><circle cx="44" cy="18" r="2" fill="#2BB88F" /></svg>);
export const Teacher = ({ size = 20, ...p }: P) => (<svg {...base(size, p)}><circle cx="24" cy="16" r="9" fill="#FFC8A2" /><path d="M6 44c0-12 8-16 18-16s18 4 18 16z" fill="#2F8EE0" /><path d="M10 14l14-8 14 8-14 7z" fill="#0A2540" /><rect x="35" y="14" width="2.5" height="10" fill="#FFB020" /></svg>);
export const Seedling = ({ size = 40, ...p }: P) => (<svg {...base(size, p)}><path d="M24 44V22" stroke="#2BB88F" strokeWidth="3" strokeLinecap="round" /><path d="M24 24c-10 0-14-7-14-13 10 0 14 6 14 13zM24 28c8 0 12-6 12-11-9 0-12 5-12 11z" fill="#2BB88F" /></svg>);
