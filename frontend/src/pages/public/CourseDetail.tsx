import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, CalendarClock, CheckCircle2, Clock, Target, Users } from 'lucide-react';
import { get } from '../../services/api';
import { CourseIcon, Reveal, SITE, SectionHead } from './shared';
import { copyFor } from './courseContent';
import { EnquiryForm } from '../../components/enquiry';
import { ErrorState, Skeleton } from '../../components/ui';
import { useSiteFx } from '../../utils/siteFx';

export default function CourseDetail() {
  const { slug } = useParams();
  const q = useQuery({ queryKey: ['course', slug], queryFn: () => get(`/public/courses/${slug}`) });
  const root = useSiteFx([q.data]);
  if (q.isLoading) return <div className="mx-auto max-w-5xl p-4 pt-36"><Skeleton className="h-64" /></div>;
  if (q.error || !q.data) return <div className="mx-auto max-w-xl p-4 pt-36"><ErrorState error={q.error} retry={() => q.refetch()} /></div>;
  const c = q.data; const x = copyFor(c.type);

  return (
    <div ref={root}>
      {/* HERO */}
      <section className="relative overflow-hidden bg-ivory px-5 pb-14 pt-32 sm:pt-36">
        <div className="pointer-events-none absolute -left-20 top-24 h-72 w-72 rounded-full bg-marigold/25 blur-3xl" /><div className="pointer-events-none absolute -right-16 top-32 h-80 w-80 rounded-full bg-peacock/15 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-8 lg:grid-cols-[auto_1fr]">
          <Reveal><div className="mx-auto w-fit rounded-[2rem] bg-white p-5 shadow-xl"><CourseIcon type={c.type} size={110} /></div></Reveal>
          <div className="text-center lg:text-left">
            <Reveal><Link to="/courses" className="text-sm font-extrabold uppercase tracking-[0.18em] text-rose">&larr; All courses</Link></Reveal>
            <Reveal delay={0.05}><h1 className="mt-1 text-5xl font-extrabold leading-tight text-plum sm:text-6xl">{c.name}</h1></Reveal>
            <Reveal delay={0.1}><p className="mt-1 text-2xl font-bold text-peacock">{x.tagline}</p></Reveal>
            <Reveal delay={0.15}><p className="mx-auto mt-3 max-w-2xl text-lg leading-relaxed text-plum/75 lg:mx-0">{c.description}</p></Reveal>
            <Reveal delay={0.2}><div className="mt-6 flex flex-wrap justify-center gap-3 lg:justify-start">
              <Link to={`/enquire?course=${c.slug}`} className="inline-flex min-h-14 items-center gap-2 rounded-full bg-rose px-7 font-display text-lg font-bold text-white shadow-[0_14px_30px_-12px_rgba(232,89,12,.8)] active:scale-95">Enquire now <ArrowRight size={20} /></Link>
              <Link to="/demo" className="inline-flex min-h-14 items-center rounded-full border-2 border-peacock-deep/20 bg-white px-7 font-display text-lg font-bold text-peacock-deep active:scale-95">Try the free demo</Link>
            </div></Reveal>
          </div>
        </div>
      </section>

      {/* AT A GLANCE */}
      <section className="mx-auto max-w-6xl px-5 py-6">
        <div data-stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[[Users, 'Age group', c.ageGroup], [Clock, 'Duration', c.duration], [CalendarClock, 'Batches', 'Small, friendly groups'], [Target, 'Outcome', x.outcome]].map(([Icon, k, v]: any, i) => (
            <div key={k} className="rounded-3xl border border-peacock/10 bg-white p-5 shadow-sm">
              <span className={`grid h-11 w-11 place-items-center rounded-2xl ${['bg-peacock-soft text-peacock', 'bg-marigold-soft text-amber-700', 'bg-rose-soft text-rose', 'bg-peacock-mist text-peacock-deep'][i]}`}><Icon size={22} /></span>
              <p className="mt-3 text-xs font-extrabold uppercase tracking-wide text-plum/50">{k}</p>
              <p className="font-display text-lg font-extrabold leading-snug text-plum">{v || 'Ask us'}</p>
            </div>
          ))}
        </div>
      </section>

      {/* LEARN + FORMAT */}
      <section className="mx-auto grid max-w-6xl gap-6 px-5 py-12 lg:grid-cols-2">
        <Reveal><div className="h-full rounded-[2rem] bg-peacock-soft p-7">
          <h2 className="text-3xl font-extrabold text-plum">What your child learns</h2>
          <ul className="mt-4 space-y-3">{x.learns.map((t) => <li key={t} className="flex gap-3 text-lg font-semibold leading-snug text-plum/85"><CheckCircle2 className="mt-0.5 shrink-0 text-peacock" size={22} />{t}</li>)}</ul>
          <p className="mt-5 rounded-2xl bg-white p-4 leading-relaxed text-plum/75"><b className="text-plum">Who it is for:</b> {x.who}</p>
        </div></Reveal>
        <Reveal delay={0.08}><div className="h-full rounded-[2rem] border border-peacock/10 bg-white p-7 shadow-sm">
          <h2 className="text-3xl font-extrabold text-plum">How classes work</h2>
          <ol className="mt-4 space-y-4">{x.format.map((t, i) => <li key={t} className="flex gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-rose font-display font-extrabold text-white">{i + 1}</span><span className="pt-1 text-lg leading-snug text-plum/80">{t}</span></li>)}</ol>
        </div></Reveal>
      </section>

      {!!c.levels?.length && (
        <section className="mx-auto max-w-6xl px-5 pb-6">
          <SectionHead eyebrow="Levels" title="Step by step progress" sub="Children move up when they are ready, never before." />
          <div data-stagger className="mt-8 flex flex-wrap justify-center gap-2.5">{c.levels.map((l: string, i: number) => <span key={l} className={`rounded-full px-5 py-2.5 font-display text-base font-extrabold ${['bg-peacock-soft text-peacock-deep', 'bg-marigold-soft text-amber-800', 'bg-rose-soft text-rose'][i % 3]}`}>{l}</span>)}</div>
        </section>
      )}

      {/* ENQUIRE */}
      <section id="enquire" className="mx-auto max-w-6xl scroll-mt-28 px-5 py-16">
        <div className="grid gap-8 rounded-[2.5rem] bg-peacock-deep p-6 text-white sm:p-10 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <h2 className="text-4xl font-extrabold leading-tight">Enquire about <span className="text-marigold">{c.name}</span></h2>
            <p className="mt-3 text-lg leading-relaxed text-white/80">Share a few details and we will call you within 24 hours to answer your questions, explain batch timings and fees, and book a free demo class.</p>
            <p className="mt-5 text-white/85">Prefer to talk now? Call <a className="font-extrabold text-marigold" href={`tel:${SITE.tel}`}>{SITE.phone}</a> or <a className="font-extrabold text-marigold" href={`https://wa.me/${SITE.wa}`} target="_blank" rel="noreferrer">message us on WhatsApp</a>.</p>
          </div>
          <div className="rounded-3xl bg-white p-4 text-plum sm:p-6 lg:col-span-3"><EnquiryForm course={c.name} bare /></div>
        </div>
      </section>
    </div>
  );
}
