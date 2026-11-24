import { useState } from 'react';
import { BookOpen, Brain, Calculator, Music, Palette, Pencil, Trophy } from 'lucide-react';
const Flute = Music;
import { AnimatePresence, motion } from 'framer-motion';
import { useScrollReveal } from '../../utils/motion';
import { useCms } from './shared';

const isVideo = (u: string) => /\.(mp4|webm|mov|m4v|ogg)$/i.test(u);
const isImage = (u: string) => /\.(webp|jpe?g|png|gif|avif|bmp|svg)$/i.test(u);
const TILES = ['#EC6206', '#2F8EE0', '#FFA723', '#2BB88F', '#00457F', '#EC6206', '#2F8EE0', '#FFA723'];
const TILE_ICONS = [Calculator, Music, BookOpen, Flute, Pencil, Palette, Trophy, Brain];

/** Images come from Admin > Website CMS > gallery. Until uploaded, illustrated tiles show. */
export default function Gallery() {
  const imgs: string[] = useCms().data?.gallery?.images?.images ?? [];
  const ref = useScrollReveal([imgs.length]); const [open, setOpen] = useState<string | null>(null);
  const items = imgs.length ? imgs : TILES.map((_, i) => `tile:${i}`);
  return (
    <div ref={ref}>
      <section className="grad-sunset px-4 pb-16 pt-32 text-center text-white"><h1 data-reveal className="text-5xl font-extrabold sm:text-6xl">Gallery</h1><p data-reveal className="mt-2 text-xl">Moments from our classes</p></section>
      <section data-stagger className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-14 md:grid-cols-3 lg:grid-cols-4">
        {items.map((s, i) => s.startsWith('tile:')
          ? <div key={s} className="grid aspect-square place-items-center rounded-chunk text-7xl shadow-soft" style={{ background: TILES[i % 8] }}>{(() => { const Ic = TILE_ICONS[i % 8]; return <Ic size={64} className="text-white/90" strokeWidth={1.6} />; })()}</div>
          : <button key={s} onClick={() => setOpen(s)} className="aspect-square overflow-hidden rounded-chunk shadow-soft">{isVideo(s) ? <video src={s} muted playsInline preload="metadata" className="h-full w-full object-cover" /> : isImage(s) ? <img src={s} alt="Krishna Gurukul" loading="lazy" className="h-full w-full object-cover transition hover:scale-110" /> : <span className="grid h-full w-full place-items-center bg-white p-3 text-center text-sm font-bold text-navy">{decodeURIComponent(s.split('/').pop() ?? 'file')}</span>}</button>)}
      </section>
      <AnimatePresence>{open && <motion.div className="fixed inset-0 z-[90] grid place-items-center bg-black/80 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(null)}>{isVideo(open) ? <video src={open} controls autoPlay className="max-h-[90vh] rounded-chunk" /> : isImage(open) ? <img src={open} alt="" className="max-h-[90vh] rounded-chunk" /> : <a href={open} target="_blank" rel="noreferrer" className="btn-primary btn">Open file</a>}</motion.div>}</AnimatePresence>
    </div>
  );
}
