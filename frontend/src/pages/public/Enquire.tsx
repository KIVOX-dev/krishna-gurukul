import { useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, MessageCircle, Phone, PhoneCall, ShieldCheck, Sparkles } from 'lucide-react';
import { CourseIcon, Reveal, SITE, useCourses } from './shared';
import { EnquiryForm } from '../../components/enquiry';
import { useSiteFx } from '../../utils/siteFx';

/** Dedicated enquiry page: /enquire?course=abacus preselects the course. */
export default function Enquire() {
  const [params] = useSearchParams();
  const slug = params.get('course');
  const { data } = useCourses();
  const course = (data ?? []).find((c: any) => c.slug === slug);
  const root = useSiteFx([data]);

  return (
    <div ref={root} className="relative overflow-hidden bg-ivory px-5 pb-20 pt-28 sm:pt-32">
      <div className="pointer-events-none absolute -left-24 top-24 h-80 w-80 rounded-full bg-marigold/25 blur-3xl" /><div className="pointer-events-none absolute -right-20 top-48 h-96 w-96 rounded-full bg-peacock/15 blur-3xl" />
      <div className="relative mx-auto max-w-6xl">
        <Reveal><Link to={course ? `/courses/${course.slug}` : '/courses'} className="inline-flex min-h-12 items-center gap-1.5 text-sm font-extrabold uppercase tracking-[0.14em] text-rose"><ArrowLeft size={16} />{course ? course.name : 'All courses'}</Link></Reveal>

        <div className="mt-2 grid items-start gap-8 lg:grid-cols-[1fr_1.15fr]">
          <div>
            <Reveal delay={0.05}>
              <h1 className="text-4xl font-extrabold leading-tight text-plum sm:text-5xl">{course ? <>Enquire about <span className="text-peacock">{course.name}</span></> : <>Tell us about <span className="text-peacock">your child</span></>}</h1>
            </Reveal>
            <Reveal delay={0.1}><p className="mt-4 text-lg leading-relaxed text-plum/75">Fill in a few details and our team will call you within 24 hours. We will answer your questions, explain batch timings and fees, and book a free demo class if you like.</p></Reveal>

            {course && (
              <Reveal delay={0.15}><div className="mt-6 flex items-center gap-4 rounded-3xl border border-peacock/10 bg-white p-4 shadow-sm">
                <div className="rounded-2xl bg-peacock-soft p-2"><CourseIcon type={course.type} size={52} /></div>
                <div className="min-w-0"><p className="font-display text-xl font-extrabold text-plum">{course.name}</p><p className="text-sm font-bold text-plum/60">{[course.ageGroup, course.duration].filter(Boolean).join(' · ')}</p></div>
              </div></Reveal>
            )}

            <div data-stagger className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {[[Clock, 'Quick reply', 'We call you back within 24 hours.'], [Sparkles, 'Free demo class', 'Try a real class before you decide.'], [ShieldCheck, 'Your details are safe', 'Only used to contact you about your enquiry.']].map(([Icon, t, d]: any, i) => (
                <div key={t} className="flex gap-3 rounded-2xl bg-white p-4 shadow-sm">
                  <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${['bg-peacock-soft text-peacock', 'bg-marigold-soft text-amber-700', 'bg-rose-soft text-rose'][i]}`}><Icon size={22} /></span>
                  <div><p className="font-display text-lg font-extrabold text-plum">{t}</p><p className="text-sm leading-snug text-plum/70">{d}</p></div>
                </div>
              ))}
            </div>

            <Reveal delay={0.1}><div className="mt-6 rounded-3xl bg-peacock-deep p-5 text-white">
              <p className="font-display text-lg font-extrabold">Prefer to talk right now?</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <a href={`tel:${SITE.tel}`} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-5 font-display font-bold text-peacock-deep"><Phone size={18} />{SITE.phone}</a>
                <a href={`https://wa.me/${SITE.wa}`} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#25D366] px-5 font-display font-bold text-white"><MessageCircle size={18} />WhatsApp</a>
              </div>
            </div></Reveal>
          </div>

          <Reveal delay={0.1}>
            <div className="rounded-[2rem] border border-peacock/10 bg-white p-5 shadow-[0_24px_60px_-30px_rgba(10,37,64,.45)] sm:p-7">
              <div className="mb-4 flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-rose-soft text-rose"><PhoneCall size={22} /></span><div><h2 className="font-display text-2xl font-extrabold text-plum">Enquiry form</h2><p className="text-sm text-plum/60">Takes under a minute</p></div></div>
              {/* key remounts the form once the course is known so it is preselected */}
              <EnquiryForm key={course?.name ?? 'any'} course={course?.name} bare />
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
