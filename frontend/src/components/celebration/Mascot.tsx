import { motion } from 'framer-motion';

export type Mood = 'wave' | 'thumbs' | 'cheer' | 'hug' | 'idle';

/** Little Krishna mascot (matches the logo): blue face, peacock feather, flute. */
export function Mascot({ mood = 'idle', size = 120, className = '' }: { mood?: Mood; size?: number; className?: string }) {
  const arm = { wave: -35, thumbs: -10, cheer: -70, hug: 20, idle: 15 }[mood];
  return (
    <motion.svg
      viewBox="0 0 120 130" width={size} height={size * 1.08} className={className} aria-hidden
      animate={mood === 'cheer' ? { y: [0, -10, 0] } : mood === 'wave' ? { rotate: [-2, 2, -2] } : { y: [0, -4, 0] }}
      transition={{ repeat: Infinity, duration: mood === 'cheer' ? 0.6 : 2.4, ease: 'easeInOut' }}
    >
      {/* feather */}
      <path d="M60 14 C48 0 36 8 40 22 C44 34 56 30 60 22Z" fill="#2BB88F" /><circle cx="46" cy="16" r="5" fill="#2F8EE0" /><circle cx="46" cy="16" r="2" fill="#FFA723" />
      {/* body */}
      <path d="M30 128 C28 96 40 86 60 86 C80 86 92 96 90 128Z" fill="#2F8EE0" />
      <path d="M52 86 L60 100 L68 86Z" fill="#FFA723" />
      {/* arms */}
      <g style={{ transformOrigin: '34px 96px', transform: `rotate(${arm}deg)` }}><rect x="14" y="94" width="24" height="10" rx="5" fill="#2F8EE0" /><circle cx="14" cy="99" r="6" fill="#7DB8EE" /></g>
      <g style={{ transformOrigin: '86px 96px', transform: `rotate(${-arm}deg)` }}><rect x="82" y="94" width="24" height="10" rx="5" fill="#2F8EE0" /><circle cx="106" cy="99" r="6" fill="#7DB8EE" /></g>
      {mood === 'thumbs' && <rect x="104" y="84" width="5" height="12" rx="2.5" fill="#7DB8EE" />}
      {/* head */}
      <circle cx="60" cy="56" r="30" fill="#7DB8EE" />
      <path d="M30 52 C30 26 90 26 90 52 C80 38 40 38 30 52Z" fill="#14233A" />
      <rect x="34" y="44" width="52" height="7" rx="3.5" fill="#FFA723" />
      {/* face */}
      <circle cx="49" cy="60" r="3.2" fill="#14233A" /><circle cx="71" cy="60" r="3.2" fill="#14233A" />
      {mood === 'hug' ? <path d="M52 72 Q60 70 68 72" stroke="#14233A" strokeWidth="2.5" fill="none" strokeLinecap="round" /> : <path d="M50 70 Q60 80 70 70" stroke="#14233A" strokeWidth="2.5" fill="none" strokeLinecap="round" />}
      <circle cx="42" cy="68" r="4" fill="#FFB3A0" opacity=".7" /><circle cx="78" cy="68" r="4" fill="#FFB3A0" opacity=".7" />
    </motion.svg>
  );
}
