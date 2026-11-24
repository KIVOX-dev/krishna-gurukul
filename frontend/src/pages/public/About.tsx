import { Link } from 'react-router-dom';
import { useSiteFx } from '../../utils/siteFx';
import { ArrowRight, Brain, CheckCircle2, Eye, Flame, HandHeart, Heart, MapPin, MessageCircle, Palette, Phone, Target } from 'lucide-react';
import { CourseIcon, Reveal, SITE, SectionHead, useCms, useCourses } from './shared';

const PILLAR_ICONS = [Flame, Brain, Heart, Palette];
const TINTS = ['bg-peacock-soft text-peacock', 'bg-marigold-soft text-amber-700', 'bg-rose-soft text-rose', 'bg-peacock-mist text-peacock-deep'];
const BARS = ['bg-peacock', 'bg-marigold', 'bg-rose', 'bg-peacock-deep'];
const CARD_TINTS = ['bg-peacock-soft', 'bg-marigold-soft', 'bg-rose-soft', 'bg-peacock-mist'];
const PILLAR_COPY: Record<string, string> = {
  tradition: 'We begin every class with a moment of calm and gratitude. Children learn respect for teachers, patience and discipline alongside the sums, the way a gurukul always has.',
  concentration: 'Abacus and Vedic techniques train children to hold numbers in their mind, ignore distractions and stay with a problem until it is solved. Focus built bead by bead.',
  confidence: 'Small batches mean every child is noticed. We praise effort, celebrate small wins and encourage little learners to answer out loud, so they speak up with pride.',
  creativity: 'Carnatic music, puzzles and visual thinking games keep learning playful. Curiosity grows when children enjoy the journey, so they love coming back.',
};

export default function About() {
  const cms = useCms().data ?? {}; const courses = useCourses();
  const pillars = cms.home?.pillars?.items ?? []; const mentors = cms.home?.faculty?.items ?? [];

  const root = useSiteFx([courses.data, cms]);
  return (
    <div ref={root}>
      {/* HERO */}
      <section className="relative overflow-hidden bg-ivory px-5 pb-16 pt-32 sm:pt-36">
        <div className="pointer-events-none absolute -left-20 top-24 h-72 w-72 rounded-full bg-marigold/25 blur-3xl" /><div className="pointer-events-none absolute -right-16 top-32 h-80 w-80 rounded-full bg-peacock/15 blur-3xl" />
        <div className="relative mx-auto max-w-4xl text-center">
          <Reveal><p className="font-display text-sm font-extrabold uppercase tracking-[0.18em] text-rose">About us</p></Reveal>
          <Reveal delay={0.06}><h1 className="mt-2 text-5xl font-extrabold leading-[1.05] text-plum sm:text-6xl">The story of <span className="text-peacock">Krishna</span> <span className="text-rose">Gurukul</span></h1></Reveal>
          <Reveal delay={0.12}><p className="mx-auto mt-5 max-w-2xl text-xl leading-relaxed text-plum/70">{SITE.tagline} A small, caring place in Pattanam, Coimbatore where children learn to think fast, focus deeply and believe in themselves.</p></Reveal>
          <Reveal delay={0.18}><div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/demo" className="inline-flex min-h-14 items-center gap-2 rounded-full bg-rose px-7 font-display text-lg font-bold text-white shadow-[0_14px_30px_-12px_rgba(232,89,12,.8)] active:scale-95">Book a free demo <ArrowRight size={20} /></Link>
            <Link to="/courses" className="inline-flex min-h-14 items-center rounded-full border-2 border-peacock-deep/20 bg-white px-7 font-display text-lg font-bold text-peacock-deep active:scale-95">See our courses</Link>
          </div></Reveal>
        </div>
      </section>

      {/* STORY */}
      <section className="mx-auto max-w-7xl px-5 py-16">
        <div className="grid items-start gap-10 lg:grid-cols-[1.2fr_1fr]">
          <Reveal>
            <SectionHeadLeft eyebrow="Our story" title="Where the gurukul spirit meets modern teaching" />
            <div className="mt-5 space-y-4 text-lg leading-relaxed text-plum/75">
              <p>Krishna Gurukul began with a simple belief: children learn best when they feel known, safe and curious. In a traditional gurukul, a teacher knew each student personally and taught with patience. We have carried that spirit into a modern classroom.</p>
              <p>Today children here learn Abacus, Vedic Maths, school subjects and Carnatic music in small, caring batches. Lessons are hands-on and joyful. Children practise with beads, games and music, and gain confidence one step at a time.</p>
              <p>We also believe parents should never be left guessing. Attendance, test results with instant feedback and a friendly leaderboard that rewards effort as much as talent are shared with families clearly and kindly.</p>
            </div>
          </Reveal>
          <div className="grid gap-4">
            {[['Mission', Target, 'To help every child build strong mental skills, steady focus and quiet confidence through patient, personal teaching.'], ['Vision', Eye, 'A community where children grow up curious and capable, rooted in good values and ready for tomorrow.'], ['Promise', HandHeart, 'Small batches, honest feedback and open doors. You will always know how your child is doing.']].map(([t, Icon, d]: any, i) => (
              <Reveal key={t} delay={i * 0.08}>
                <div className="flex gap-4 rounded-[2rem] border border-peacock/10 bg-white p-5 shadow-sm">
                  <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ${TINTS[i]}`}><Icon size={26} /></span>
                  <div><h3 className="font-display text-2xl font-extrabold text-plum">{t}</h3><p className="mt-1 leading-relaxed text-plum/70">{d}</p></div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT WE TEACH */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-5">
          <SectionHead eyebrow="What we teach" title="Four programmes, one family" sub="Choose one, or combine them. Our teachers help you plan." />
          <div data-stagger className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {(courses.data ?? []).map((c: any, i: number) => (
              <div key={c._id}>
                <Link to={`/courses/${c.slug}`} className={`group flex h-full flex-col rounded-[2rem] p-6 transition hover:-translate-y-1 hover:shadow-xl ${CARD_TINTS[i % 4]}`}>
                  <div className="mb-4 w-fit rounded-2xl bg-white p-2 shadow-sm"><CourseIcon type={c.type} size={52} /></div>
                  <h3 className="text-2xl font-extrabold text-plum">{c.name}</h3>
                  <p className="mt-1 line-clamp-3 flex-1 text-plum/70">{c.description}</p>
                  <p className="mt-3 text-sm font-extrabold text-peacock-deep">{c.ageGroup}</p>
                  <span className="mt-2 inline-flex items-center gap-1 font-display font-bold text-rose transition-all group-hover:gap-3">Learn more <ArrowRight size={18} /></span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PILLARS */}
      {pillars.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 py-20">
          <SectionHead eyebrow="Our pillars" title="Four values behind every class" sub="They guide how we teach, how we speak to children and how we work with parents." />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {pillars.map((p: any, i: number) => { const Icon = PILLAR_ICONS[i % 4]; return (
              <Reveal key={p.t} delay={i * 0.07}>
                <div className="relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-peacock/10 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                  <span className={`absolute inset-x-0 top-0 h-1.5 ${BARS[i % 4]}`} />
                  <span className={`mb-4 grid h-14 w-14 place-items-center rounded-2xl ${TINTS[i % 4]}`}><Icon size={28} /></span>
                  <h3 className="text-2xl font-extrabold text-plum">{p.t}</h3>
                  <p className="mt-2 leading-relaxed text-plum/70">{PILLAR_COPY[String(p.t).toLowerCase()] ?? p.d}</p>
                </div>
              </Reveal>); })}
          </div>
        </section>
      )}

      {/* APPROACH */}
      <section className="bg-peacock-deep py-16 text-white">
        <div className="mx-auto max-w-7xl px-5">
          <SectionHead tone="dark" eyebrow="Our approach" title="Learn. Practise. Test. Celebrate." sub="A simple loop that keeps children moving forward and enjoying it." />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[['Learn', 'Short, clear lessons with beads, stories and examples the child can touch and see.'], ['Practise', 'Daily practice games build speed and accuracy without feeling like homework.'], ['Test', 'Regular tests with instant results and kind, specific feedback on what to improve.'], ['Celebrate', 'Stars, points and class ranks cheer on effort, and every improvement counts.']].map(([t, d], i) => (
              <Reveal key={t} delay={i * 0.07}>
                <div className="h-full rounded-[1.75rem] bg-white/10 p-6 ring-1 ring-white/15">
                  <span className="font-display text-5xl font-extrabold text-marigold">{i + 1}</span>
                  <h3 className="mt-1 font-display text-2xl font-extrabold">{t}</h3>
                  <p className="mt-1 leading-relaxed text-white/80">{d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* MENTORS */}
      <section className="mx-auto max-w-7xl px-5 py-20">
        <SectionHead eyebrow="Our team" title="The mentors behind our success" sub="Patient, experienced teachers who treat every child like their own." />
        <div className="mt-12 grid items-start gap-6 lg:grid-cols-[1fr_1.2fr]">
          <div className="flex flex-wrap justify-center gap-5">
            {mentors.map((m: any, i: number) => (
              <Reveal key={m.name} delay={i * 0.06}>
                <div className="w-full min-w-[260px] max-w-sm rounded-[2rem] border border-peacock/10 bg-white p-6 text-center shadow-sm">
                  {m.photo ? <img src={m.photo} alt={m.name} loading="lazy" className="mx-auto mb-3 h-24 w-24 rounded-full object-cover ring-4 ring-marigold-soft" /> : <div className="mx-auto mb-3 grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-rose to-marigold font-display text-4xl font-extrabold text-white ring-4 ring-marigold-soft">{m.name[0]}</div>}
                  <h3 className="text-2xl font-extrabold text-plum">{m.name}</h3><p className="font-bold text-rose">{m.role}</p><p className="mt-1 text-plum/70">{m.note}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.1}>
            <div className="rounded-[2rem] bg-peacock-soft p-7">
              <h3 className="text-2xl font-extrabold text-plum">What parents can expect from our teachers</h3>
              <ul className="mt-4 space-y-3">
                {['Warm, patient teaching that never shames a mistake', 'Personal attention in small groups, grouped by age and level', 'Honest, regular updates on how your child is progressing', 'Always happy to talk, by phone, on WhatsApp or in person'].map((x) => <li key={x} className="flex gap-2.5 font-bold text-plum/85"><CheckCircle2 className="mt-0.5 shrink-0 text-peacock" size={20} />{x}</li>)}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* VISIT */}
      <section className="mx-auto max-w-7xl px-5 pb-20">
        <div className="grid gap-6 rounded-[2.5rem] bg-gradient-to-br from-marigold-soft via-ivory to-rose-soft p-8 sm:p-12 lg:grid-cols-2">
          <Reveal>
            <h2 className="text-4xl font-extrabold leading-tight text-plum sm:text-5xl">Come and say hello</h2>
            <p className="mt-3 text-lg leading-relaxed text-plum/75">The best way to know us is to visit. Walk in, meet the teachers and see a class in action. Or bring your child for a free demo.</p>
            <p className="mt-5 flex gap-2 font-bold text-plum/85"><MapPin className="mt-0.5 shrink-0 text-rose" size={20} />{SITE.address}</p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="grid gap-3">
              <a href={`tel:${SITE.tel}`} className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-peacock-deep font-display text-lg font-bold text-white"><Phone size={20} />{SITE.phone}</a>
              <a href={`https://wa.me/${SITE.wa}`} target="_blank" rel="noreferrer" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-[#25D366] font-display text-lg font-bold text-white"><MessageCircle size={20} />Chat on WhatsApp</a>
              <Link to="/enquire" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full border-2 border-peacock-deep/20 bg-white font-display text-lg font-bold text-peacock-deep">Enquire now <ArrowRight size={20} /></Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

function SectionHeadLeft({ eyebrow, title }: { eyebrow: string; title: string }) {
  return <div><p className="font-display text-sm font-extrabold uppercase tracking-[0.18em] text-rose">{eyebrow}</p><h2 className="mt-2 text-4xl font-extrabold leading-tight text-plum sm:text-5xl">{title}</h2></div>;
}
