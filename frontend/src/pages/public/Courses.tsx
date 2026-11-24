import { Link } from 'react-router-dom';
import { ArrowRight, CalendarClock, CheckCircle2, Clock, MessageCircle, Users } from 'lucide-react';
import { CourseIcon, Reveal, SITE, SectionHead, useCourses } from './shared';
import { copyFor } from './courseContent';
import { Skeleton } from '../../components/ui';
import { useSiteFx } from '../../utils/siteFx';

const TINTS = ['bg-peacock-soft', 'bg-marigold-soft', 'bg-rose-soft', 'bg-peacock-mist'];
const BARS = ['bg-peacock', 'bg-marigold', 'bg-rose', 'bg-peacock-deep'];

export default function Courses() {
  const { data, isLoading } = useCourses();
  const root = useSiteFx([data]);
  return (
    <div ref={root}>
      <section className="relative overflow-hidden bg-ivory px-5 pb-12 pt-32 text-center sm:pt-36">
        <div className="pointer-events-none absolute -left-20 top-24 h-72 w-72 rounded-full bg-marigold/25 blur-3xl" /><div className="pointer-events-none absolute -right-16 top-32 h-80 w-80 rounded-full bg-peacock/15 blur-3xl" />
        <div className="relative mx-auto max-w-3xl">
          <Reveal><p className="font-display text-sm font-extrabold uppercase tracking-[0.18em] text-rose">Our courses</p></Reveal>
          <Reveal delay={0.06}><h1 className="mt-2 text-5xl font-extrabold leading-[1.05] text-plum sm:text-6xl">Find the right course for <span className="text-peacock">your child</span></h1></Reveal>
          <Reveal delay={0.12}><p className="mx-auto mt-5 max-w-2xl text-xl leading-relaxed text-plum/70">Four programmes taught in small, friendly batches by patient teachers. Not sure which one fits? Book a free demo class and we will help you choose.</p></Reveal>
          <Reveal delay={0.18}><div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link to="/demo" className="inline-flex min-h-14 items-center gap-2 rounded-full bg-rose px-7 font-display text-lg font-bold text-white shadow-[0_14px_30px_-12px_rgba(232,89,12,.8)] active:scale-95">Try the free demo <ArrowRight size={20} /></Link>
            <a href={`https://wa.me/${SITE.wa}`} target="_blank" rel="noreferrer" className="inline-flex min-h-14 items-center gap-2 rounded-full border-2 border-peacock-deep/20 bg-white px-7 font-display text-lg font-bold text-peacock-deep active:scale-95"><MessageCircle size={20} />Ask on WhatsApp</a>
          </div></Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-16 pt-4">
        <div data-stagger className="grid gap-6 lg:grid-cols-2">
          {isLoading ? [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-96" />) : (data ?? []).map((c: any, i: number) => {
            const x = copyFor(c.type);
            return (
              <article key={c._id} className="relative flex flex-col overflow-hidden rounded-[2rem] border border-peacock/10 bg-white p-6 shadow-sm transition hover:shadow-xl sm:p-8">
                <span className={`absolute inset-x-0 top-0 h-1.5 ${BARS[i % 4]}`} />
                <div className="flex items-start gap-4">
                  <div className={`shrink-0 rounded-2xl p-2 ${TINTS[i % 4]}`}><CourseIcon type={c.type} size={64} /></div>
                  <div className="min-w-0">
                    <h2 className="text-3xl font-extrabold leading-tight text-plum">{c.name}</h2>
                    <p className="font-bold text-rose">{x.tagline}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-sm font-extrabold text-peacock-deep">
                  {c.ageGroup && <span className="inline-flex items-center gap-1.5 rounded-full bg-peacock-soft px-3 py-1.5"><Users size={15} />{c.ageGroup}</span>}
                  {c.duration && <span className="inline-flex items-center gap-1.5 rounded-full bg-marigold-soft px-3 py-1.5 text-amber-800"><Clock size={15} />{c.duration}</span>}
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-soft px-3 py-1.5 text-rose"><CalendarClock size={15} />Small batches</span>
                </div>
                <p className="mt-4 leading-relaxed text-plum/75">{c.description}</p>
                <p className="mt-2 leading-relaxed text-plum/75"><b className="text-plum">Who it is for:</b> {x.who}</p>
                <h3 className="mt-5 font-display text-lg font-extrabold text-plum">What your child learns</h3>
                <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                  {x.learns.map((t) => <li key={t} className="flex gap-2 text-[15px] leading-snug text-plum/80"><CheckCircle2 className="mt-0.5 shrink-0 text-peacock" size={18} />{t}</li>)}
                </ul>
                {!!c.levels?.length && <div className="mt-4 flex flex-wrap gap-1.5">{c.levels.slice(0, 6).map((l: string) => <span key={l} className="rounded-full bg-peacock-mist px-3 py-1 text-xs font-bold text-peacock-deep">{l}</span>)}{c.levels.length > 6 && <span className="rounded-full bg-peacock-mist px-3 py-1 text-xs font-bold text-peacock-deep">+{c.levels.length - 6} more</span>}</div>}
                <div className="mt-auto flex flex-col gap-3 pt-6 sm:flex-row">
                  <Link to={`/enquire?course=${c.slug}`} className="inline-flex min-h-14 flex-1 items-center justify-center gap-2 rounded-full bg-rose px-6 font-display text-lg font-bold text-white shadow-[0_12px_26px_-12px_rgba(232,89,12,.8)] transition hover:brightness-110 active:scale-95">Enquire now <ArrowRight size={20} /></Link>
                  <Link to={`/courses/${c.slug}`} className="inline-flex min-h-14 flex-1 items-center justify-center rounded-full border-2 border-peacock-deep/20 bg-white px-6 font-display text-lg font-bold text-peacock-deep transition hover:border-peacock active:scale-95">View details</Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 pb-20">
        <Reveal><div className="rounded-[2.5rem] bg-peacock-deep p-8 text-center text-white sm:p-12">
          <h2 className="text-3xl font-extrabold sm:text-4xl">Not sure where to start?</h2>
          <p className="mx-auto mt-3 max-w-xl text-lg text-white/80">Come for a free demo class. Our teachers will meet your child and suggest the right course and batch. Fees and timings are shared when you contact us.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/enquire" className="inline-flex min-h-14 items-center gap-2 rounded-full bg-rose px-7 font-display text-lg font-bold text-white active:scale-95">Enquire now <ArrowRight size={20} /></Link>
            <a href={`tel:${SITE.tel}`} className="inline-flex min-h-14 items-center rounded-full border-2 border-white/30 px-7 font-display text-lg font-bold active:scale-95">Call {SITE.phone}</a>
          </div>
        </div></Reveal>
      </section>
    </div>
  );
}
