import { Link } from 'react-router-dom';
import { useHeroIntro, useSiteFx } from '../../utils/siteFx';
import { useMagnetic } from '../../utils/motion';
import { ArrowRight, Award, BellRing, BookOpen, CalendarCheck, CheckCircle2, ChevronDown, ClipboardList, IndianRupee, Layers, MapPin, MessageCircle, Phone, Quote, Sparkles, Star, StarHalf, Trophy, Heart, Brain, Palette, Flame, Users, UserCheck, LineChart } from 'lucide-react';
import { LEVEL_PRESETS } from '@kg/shared';
import { AbacusArt, CourseIcon, Reveal, SITE, SectionHead, useCms, useCourses } from './shared';
import { EnquiryForm } from '../../components/enquiry';
import { FaqAccordion } from './Faq';

const FALLBACK_STATS = [{ n: 500, s: '+', l: 'Happy students' }, { n: 10, s: '', l: 'Abacus levels' }, { n: 4, s: '', l: 'Courses under one roof' }, { n: 100, s: '%', l: 'Parent updates, every class' }];
const STAGES = [
  { name: 'Foundation', range: '1-3', pill: 'bg-peacock-soft text-peacock-deep', dot: 'bg-peacock', card: 'bg-peacock-soft', num: 'text-peacock', badge: 'bg-peacock text-white', test: (n: number) => n <= 3 },
  { name: 'Speed', range: '4-6', pill: 'bg-marigold-soft text-amber-800', dot: 'bg-marigold', card: 'bg-marigold-soft', num: 'text-amber-600', badge: 'bg-marigold text-plum', test: (n: number) => n >= 4 && n <= 6 },
  { name: 'Mastery', range: '7-10', pill: 'bg-rose-soft text-rose', dot: 'bg-rose', card: 'bg-rose-soft', num: 'text-rose', badge: 'bg-rose text-white', test: (n: number) => n >= 7 },
];
const stageOf = (n: number) => STAGES.find((s) => s.test(n)) ?? STAGES[0];
const levelName = (n: string) => (n.split('·')[1] ?? n).trim();
const opLabel = (o: string) => (o === 'mixed' ? '+ − mixed' : o === 'x' ? '× multiply' : o === '/' ? '÷ divide' : '+ add');
const PILLAR_ICONS = [Flame, Brain, Heart, Palette];
const TINTS = ['bg-peacock-soft text-peacock', 'bg-marigold-soft text-amber-700', 'bg-rose-soft text-rose', 'bg-peacock-mist text-peacock-deep'];
const CARD_TINTS = ['bg-peacock-soft', 'bg-marigold-soft', 'bg-rose-soft', 'bg-peacock-mist'];


const PILLAR_COPY: Record<string, string> = {
  tradition: 'We begin every class with a moment of calm and gratitude. Children learn respect for teachers, patience and discipline alongside the sums, the way a gurukul always has.',
  concentration: 'Abacus and Vedic techniques train children to hold numbers in their mind, ignore distractions and stay with a problem until it is solved. Focus built bead by bead.',
  confidence: 'Small batches mean every child is noticed. We praise effort, celebrate small wins and encourage little learners to answer out loud, so they speak up with pride.',
  creativity: 'Carnatic music, puzzles and visual thinking games keep learning playful. Curiosity grows when children enjoy the journey, so they love coming back.',
};
const STAT_META = [
  { Icon: Users, text: 'Children who have learned and grown with us.' },
  { Icon: Award, text: 'Of patient, hands-on classroom teaching.' },
  { Icon: BookOpen, text: 'Abacus, Vedic Maths, Tuition and Carnatic Music.' },
  { Icon: Layers, text: 'Structured steps from first beads to champion.' },
];
const STEPS = [
  { Icon: CalendarCheck, t: 'Book a free demo', d: 'Pick a time that suits you. Your child joins a real class, meets the teacher and tries the abacus with no pressure and no commitment.' },
  { Icon: UserCheck, t: 'Meet your teacher', d: 'We understand your child\'s age, school class and interests, then suggest the right course and a friendly small batch.' },
  { Icon: ClipboardList, t: 'Learn, practise, test', d: 'Weekly classes, daily practice games and regular tests with instant results, stars and encouraging feedback after each one.' },
  { Icon: LineChart, t: 'Watch them grow', d: 'Parents see attendance, test scores, levels and class rank in one place, and get an alert only for the updates they choose.' },
];
const FAQS: [string, string][] = [
  ['What age can my child start?', 'Abacus welcomes children from 5 to 14 years, Vedic Maths from 9 to 16, tuition from Class 1 to 10, and Carnatic music from 6 years and above. If you are unsure, bring your child for a free demo and we will guide you.'],
  ['Is there a free demo class?', 'Yes. Every new family can attend a free demo class. Book it online, on WhatsApp or by phone, and we will confirm the batch and time.'],
  ['How do I follow my child\'s progress?', 'Sign in to the parent portal with just your email. You will see attendance, test results, level, leaderboard rank and fee details. You can also choose which alerts you want.'],
  ['What if my child misses a class?', 'You get an alert the same day. Your child can catch up with practice games at home, and our teachers will help them with anything they missed.'],
  ['How are the batches arranged?', 'We keep batches small and group children by age and level, so every child gets personal attention and learns at a comfortable pace.'],
  ['How do I know about fees and timings?', 'Fees and batch timings depend on the course and level. Call or WhatsApp us on +91 82706 65953, or visit us in Pattanam, and we will share everything clearly.'],
];

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-marigold" role="img" aria-label={`${value} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => i + 1 <= value ? <Star key={i} size={18} fill="currentColor" /> : i + 0.5 === value ? <span key={i} className="relative inline-block h-[18px] w-[18px]"><Star size={18} className="absolute inset-0 text-marigold/30" fill="currentColor" /><StarHalf size={18} className="absolute inset-0" fill="currentColor" /></span> : <Star key={i} size={18} className="text-marigold/30" fill="currentColor" />)}
      <span className="ml-1.5 text-sm font-extrabold text-plum">{value.toFixed(1)}</span>
    </span>
  );
}

export default function Home() {
  const cms = useCms().data ?? {}; const courses = useCourses();
  const hero = cms.home?.hero ?? { title: SITE.tagline, subtitle: 'Abacus, Vedic Maths, Academic Tuition and Carnatic Music in Pattanam, Coimbatore.' };
  const pillars = cms.home?.pillars ?? { title: 'Why families choose us', items: [{ t: 'Tradition', d: 'Rooted values and time-tested methods.' }, { t: 'Concentration', d: 'Mental maths that trains focus.' }, { t: 'Confidence', d: 'Small batches where every child is heard.' }, { t: 'Creativity', d: 'Music and thinking games alongside the sums.' }] };
  const stats = cms.home?.stats?.items?.length ? cms.home.stats.items : FALLBACK_STATS;
  const mentors = cms.home?.faculty ?? { title: 'The mentors behind our success', items: [] };
  const testi = cms.home?.testimonials?.items ?? [];
  const words = String(hero.title).split(' ');
  const root = useSiteFx([courses.data, cms]); useHeroIntro(root);
  const ctaRef = useMagnetic<HTMLAnchorElement>(0.3);

  return (
    <div ref={root}>
      {/* HERO */}
      <section className="relative overflow-hidden bg-ivory pb-16 pt-28 sm:pt-32 lg:pb-24">
        <div className="pointer-events-none hero-blob-a absolute -left-24 top-20 h-80 w-80 rounded-full bg-marigold/25 blur-3xl" />
        <div className="pointer-events-none hero-blob-b absolute -right-20 top-40 h-96 w-96 rounded-full bg-peacock/15 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 lg:grid-cols-[1.05fr_1fr]">
          <div className="hero-copy">
            <p className="hero-pill inline-flex items-center gap-2 rounded-full border border-peacock/15 bg-white px-4 py-2 text-sm font-bold text-peacock-deep shadow-sm"><MapPin size={16} className="text-rose" />Pattanam, Coimbatore · Abacus · Vedic · Tuition · Carnatic</p>
              <h1 className="mt-5 text-[2.75rem] font-extrabold leading-[1.05] text-plum sm:text-6xl xl:text-7xl">
                {words.map((w, i) => <span key={i} className="inline-block overflow-hidden pb-1 align-bottom"><span className={`hero-word inline-block ${/^(tradition|modern|excellence)$/i.test(w) ? (i % 2 ? 'text-rose' : 'text-peacock') : ''}`}>{w}&nbsp;</span></span>)}
              </h1>
            <p className="hero-sub mt-5 max-w-xl text-lg leading-relaxed text-plum/70 sm:text-xl">{hero.subtitle}</p>
              <div className="hero-cta mt-8 flex flex-wrap gap-3">
                <Link ref={ctaRef} to="/demo" className="inline-flex min-h-14 items-center gap-2 rounded-full bg-rose px-7 font-display text-lg font-bold text-white shadow-[0_14px_30px_-12px_rgba(232,89,12,.8)] transition hover:brightness-110 active:scale-95">Try the free abacus demo <ArrowRight size={20} /></Link>
                <Link to="/courses" className="inline-flex min-h-14 items-center rounded-full border-2 border-peacock-deep/20 bg-white px-7 font-display text-lg font-bold text-peacock-deep transition hover:border-peacock active:scale-95">Explore courses</Link>
              </div>
              <div className="hero-trust mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-bold text-plum/70">
                <span className="flex items-center gap-1.5"><span className="flex text-marigold">{Array.from({ length: 5 }, (_, i) => <Star key={i} size={16} fill="currentColor" />)}</span>Loved by parents</span>
                <span className="flex items-center gap-1.5"><Sparkles size={16} className="text-rose" />Ages 5 to 16</span>
                <a href={`https://wa.me/${SITE.wa}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-peacock underline-offset-4 hover:underline"><MessageCircle size={16} />Chat on WhatsApp</a>
              </div>
          </div>

          <div className="hero-card relative mx-auto w-full max-w-[560px]">
            <div className="absolute inset-4 rounded-[3rem] bg-gradient-to-br from-peacock to-peacock-deep" />
            <div className="hero-frame absolute -inset-1 rotate-3 rounded-[3rem] border-2 border-dashed border-marigold" aria-hidden />
            <div className="hero-art relative p-6 sm:p-8"><AbacusArt className="w-full drop-shadow-xl" /></div>
            <div className="hero-chip hero-chip-a absolute -left-3 top-8 rounded-2xl bg-white px-4 py-3 shadow-xl sm:-left-8"><p className="font-display text-3xl font-extrabold leading-none text-rose">10</p><p className="text-xs font-bold text-plum/60">abacus levels</p></div>
            <div className="hero-chip hero-chip-b absolute -right-2 bottom-12 flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-xl sm:-right-6"><span className="grid h-10 w-10 place-items-center rounded-full bg-marigold-soft text-amber-600"><Trophy size={20} /></span><div><p className="font-display text-lg font-extrabold leading-none text-plum">Live ranks</p><p className="text-xs font-bold text-plum/60">tests and leaderboard</p></div></div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="overflow-hidden bg-peacock-deep py-4 text-white" aria-hidden>
        <div data-marquee="34" className="flex w-max font-display text-xl font-extrabold">
          {[0, 1].flatMap((k) => ['Abacus', 'Vedic Maths', 'Academic Tuition', 'Carnatic Music', 'Mental Maths', 'Concentration', 'Confidence'].map((t) => <span key={`${k}${t}`} className="flex items-center gap-12 whitespace-nowrap pr-12">{t}<span className="text-marigold">✦</span></span>))}
        </div>
      </div>

      {/* COURSES */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-5">
          <SectionHead eyebrow="Our courses" title={<>Learn what <span className="text-peacock">lights them up</span></>} sub="Four programmes, one friendly gurukul." />
          <div data-stagger className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {(courses.data ?? []).map((c: any, i: number) => (
              <div key={c._id}>
                <Link to={`/courses/${c.slug}`} className={`group flex h-full flex-col rounded-[2rem] p-6 transition hover:-translate-y-1 hover:shadow-xl ${CARD_TINTS[i % 4]}`}>
                  <div className="mb-5 w-fit rounded-2xl bg-white p-2 shadow-sm"><CourseIcon type={c.type} size={56} /></div>
                  <h3 className="text-2xl font-extrabold text-plum">{c.name}</h3>
                  <p className="mt-1 line-clamp-3 flex-1 text-plum/70">{c.description}</p>
                  <p className="mt-3 text-sm font-extrabold text-peacock-deep">{c.ageGroup}</p>
                  <span className="mt-3 inline-flex items-center gap-1 font-display font-bold text-rose transition-all group-hover:gap-3">Explore <ArrowRight size={18} /></span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WELCOME */}
      <section className="mx-auto max-w-7xl px-5 py-20">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <p className="font-display text-sm font-extrabold uppercase tracking-[0.18em] text-rose">Welcome to Krishna Gurukul</p>
            <h2 className="mt-2 text-4xl font-extrabold leading-tight text-plum sm:text-5xl">A gurukul spirit, with today&apos;s way of learning</h2>
            <p className="mt-4 text-lg leading-relaxed text-plum/75">In the heart of Pattanam, Coimbatore, Krishna Gurukul brings together the calm, caring spirit of a traditional gurukul and the clarity of modern teaching. Children come to us to learn abacus, Vedic maths, school subjects and Carnatic music, and leave with something more lasting: focus, confidence and a love of learning.</p>
            <p className="mt-3 text-lg leading-relaxed text-plum/75">Our teachers know every child by name. Classes are small, lessons are joyful, and parents are never in the dark. Attendance, test results and progress are shared with you clearly and kindly.</p>
          </Reveal>
          <div className="grid gap-3 sm:grid-cols-2">
            {[['Small, friendly batches', 'Every child is seen, heard and encouraged.'], ['Structured levels', 'Clear steps so progress is easy to see.'], ['Games and practice', 'Daily practice that feels like play.'], ['Open communication', 'Updates and results straight to parents.']].map(([t, d], i) => (
              <Reveal key={t} delay={i * 0.07}><div className="h-full rounded-3xl border border-peacock/10 bg-white p-5 shadow-sm"><CheckCircle2 className="text-peacock" /><p className="mt-2 font-display text-xl font-extrabold text-plum">{t}</p><p className="mt-1 text-plum/70">{d}</p></div></Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* PILLARS */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-5">
          <SectionHead eyebrow="Our pillars" title={pillars.title} sub="Four values shape everything we teach, in every course and every class." />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {pillars.items.map((p: any, i: number) => { const Icon = PILLAR_ICONS[i % 4]; const copy = PILLAR_COPY[String(p.t).toLowerCase()] ?? p.d; return (
              <Reveal key={p.t} delay={i * 0.07}>
                <div className="relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-peacock/10 bg-ivory p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                  <span className={`absolute inset-x-0 top-0 h-1.5 ${['bg-peacock', 'bg-marigold', 'bg-rose', 'bg-peacock-deep'][i % 4]}`} />
                  <span className={`mb-4 grid h-14 w-14 place-items-center rounded-2xl ${TINTS[i % 4]}`}><Icon size={28} /></span>
                  <h3 className="text-2xl font-extrabold text-plum">{p.t}</h3>
                  <p className="mt-2 leading-relaxed text-plum/70">{copy}</p>
                </div>
              </Reveal>); })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-7xl px-5 py-20">
        <SectionHead eyebrow="How it works" title={<>Getting started is <span className="text-peacock">easy</span></>} sub="Four simple steps from your first hello to visible progress." />
        <div className="relative mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ Icon, t, d }, i) => (
            <Reveal key={t} delay={i * 0.08}>
              <div className="relative flex h-full flex-col rounded-[2rem] border border-peacock/10 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-peacock-soft text-peacock"><Icon size={28} /></span>
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-rose font-display text-lg font-extrabold text-white shadow-md">{i + 1}</span>
                </div>
                <h3 className="mt-5 text-2xl font-extrabold leading-tight text-plum">{t}</h3>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-plum/70">{d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* LEVEL JOURNEY: a staircase that climbs, colour-coded by stage */}
      <section className="relative overflow-hidden bg-gradient-to-b from-ivory via-peacock-mist to-ivory py-20">
        <div className="mx-auto max-w-7xl px-5">
          <SectionHead eyebrow="The abacus journey" title={<>Ten levels. Ten new <span className="text-rose">superpowers.</span></>} sub="From first beads to lightning-fast mental maths, one step at a time." />
          <Reveal className="mt-8 flex flex-wrap justify-center gap-2">
            {STAGES.map((st) => <span key={st.name} className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-extrabold ${st.pill}`}><span className={`h-2.5 w-2.5 rounded-full ${st.dot}`} />{st.name} · levels {st.range}</span>)}
          </Reveal>

          {/* desktop: stairs */}
          <div data-grow className="mt-14 hidden items-end gap-3 lg:grid lg:grid-cols-10">
            {LEVEL_PRESETS.map((l, i) => {
              const st = stageOf(l.level);
              return (
                <div key={l.level}
                  className={`relative flex flex-col rounded-t-[1.75rem] rounded-b-2xl p-3.5 pb-4 text-center shadow-sm ring-1 ring-black/5 ${st.card}`} style={{ height: 170 + (l.level - 1) * 26 }}>
                  {l.level === 10 && <span className="absolute -top-5 left-1/2 grid h-10 w-10 -translate-x-1/2 place-items-center rounded-full bg-marigold text-plum shadow-lg"><Trophy size={20} /></span>}
                  <span className={`font-display text-5xl font-extrabold leading-none ${st.num}`}>{l.level}</span>
                  <span className="mt-2 font-display text-[15px] font-extrabold leading-tight text-plum">{levelName(l.name)}</span>
                  <span className="mt-auto text-[12px] font-bold leading-snug text-plum/65">{l.digits} digit<br />{l.rows} rows<br />{opLabel(l.operations)}</span>
                  <span className="mt-3 flex flex-wrap justify-center gap-1">{Array.from({ length: Math.min(l.level, 5) }, (_, k) => <span key={k} className={`h-2 w-2 rounded-full ${st.dot}`} />)}</span>
                </div>
              );
            })}
          </div>

          {/* phones and tablets: a path */}
          <ol data-stagger className="relative mx-auto mt-12 max-w-xl space-y-4 lg:hidden">
            <span className="absolute bottom-6 left-[1.65rem] top-6 w-1 rounded-full bg-gradient-to-b from-peacock via-marigold to-rose" aria-hidden />
            {LEVEL_PRESETS.map((l, i) => {
              const st = stageOf(l.level);
              return (
                <li key={l.level} className="relative flex items-center gap-4">
                  <span className={`relative z-10 grid h-14 w-14 shrink-0 place-items-center rounded-full border-4 border-ivory font-display text-2xl font-extrabold shadow-md ${st.badge}`}>{l.level}</span>
                  <div className={`flex-1 rounded-3xl p-4 ring-1 ring-black/5 ${st.card}`}>
                    <div className="flex items-center justify-between gap-2"><h3 className="font-display text-xl font-extrabold text-plum">{levelName(l.name)}</h3>{l.level === 10 && <Trophy size={20} className="text-amber-600" />}</div>
                    <p className="mt-0.5 text-sm font-bold text-plum/65">{l.digits} digit · {l.rows} rows · {opLabel(l.operations)}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* PARENT PORTAL */}
      <section className="mx-auto max-w-7xl px-5 py-20">
        <div className="grid items-center gap-10 rounded-[2.5rem] bg-gradient-to-br from-marigold-soft via-ivory to-rose-soft p-8 sm:p-12 lg:grid-cols-2">
          <Reveal>
            <p className="font-display text-sm font-extrabold uppercase tracking-[0.18em] text-rose">For parents</p>
            <h2 className="mt-2 text-4xl font-extrabold leading-tight text-plum sm:text-5xl">Everything about your child, in your pocket</h2>
            <p className="mt-3 text-lg text-plum/70">Sign in with just your email. No passwords to remember.</p>
            <Link to="/login" className="mt-6 inline-flex min-h-14 items-center gap-2 rounded-full bg-peacock-deep px-7 font-display text-lg font-bold text-white transition hover:bg-peacock active:scale-95">Parent login <ArrowRight size={20} /></Link>
          </Reveal>
          <div className="grid gap-3 sm:grid-cols-2">
            {[[CalendarCheck, 'Attendance', 'Know instantly if a class is missed'], [Trophy, 'Tests and stars', 'Animated results after every test'], [IndianRupee, 'Fees and receipts', 'Due dates and downloads'], [BellRing, 'Smart alerts', 'Only the updates you choose']].map(([Icon, t, d]: any, i) => (
              <Reveal key={t} delay={i * 0.07}><div className="h-full rounded-3xl bg-white p-5 shadow-sm"><Icon className="text-rose" /><p className="mt-2 font-display text-xl font-extrabold text-plum">{t}</p><p className="text-sm text-plum/65">{d}</p></div></Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="bg-peacock-deep py-16">
        <div className="mx-auto max-w-7xl px-5">
          <SectionHead eyebrow="Krishna Gurukul in numbers" title={<span className="text-white">Trusted by families across Coimbatore</span>} tone="dark" />
          <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map((st: any, i: number) => { const { Icon, text } = STAT_META[i % 4]; return (
              <Reveal key={st.l} delay={i * 0.07}>
                <div className="h-full rounded-[1.75rem] bg-white p-5 text-center shadow-lg sm:p-7">
                  <span className={`mx-auto grid h-12 w-12 place-items-center rounded-2xl ${TINTS[i % 4]}`}><Icon size={24} /></span>
                  <p className="mt-3 font-display text-5xl font-extrabold text-peacock sm:text-6xl"><span data-count={Number(st.n) || 0}>{st.n}</span>{st.s}</p>
                  <p className="font-display text-lg font-extrabold text-plum">{st.l}</p>
                  <p className="mt-1 hidden text-sm text-plum/65 sm:block">{text}</p>
                </div>
              </Reveal>); })}
          </div>
        </div>
      </section>

      {/* MENTORS */}
      {(mentors.items ?? []).length > 0 && (
        <section className="mx-auto max-w-7xl px-5 py-20">
          <SectionHead eyebrow="Our team" title={mentors.title} sub="Patient, qualified teachers who treat every child like their own." />
          <div className="mt-12 grid items-start gap-6 lg:grid-cols-[1fr_1.2fr]">
            <div className="flex flex-wrap justify-center gap-5">
              {mentors.items.map((m: any, i: number) => (
                <Reveal key={m.name} delay={i * 0.06}><div className="w-full min-w-[260px] max-w-sm rounded-[2rem] border border-peacock/10 bg-white p-6 text-center shadow-sm">
                  {m.photo ? <img src={m.photo} alt={m.name} loading="lazy" className="mx-auto mb-3 h-24 w-24 rounded-full object-cover ring-4 ring-marigold-soft" /> : <div className="mx-auto mb-3 grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-rose to-marigold font-display text-4xl font-extrabold text-white ring-4 ring-marigold-soft">{m.name[0]}</div>}
                  <h3 className="text-2xl font-extrabold text-plum">{m.name}</h3><p className="font-bold text-rose">{m.role}</p><p className="mt-1 text-plum/70">{m.note}</p>
                </div></Reveal>
              ))}
            </div>
            <Reveal delay={0.1}>
              <div className="rounded-[2rem] bg-peacock-soft p-7">
                <h3 className="text-2xl font-extrabold text-plum">How our teachers teach</h3>
                <p className="mt-2 leading-relaxed text-plum/75">Every lesson starts from what the child already knows. We explain with beads, stories and simple examples, let children try for themselves, and correct kindly. Mistakes are treated as part of learning, never as failure.</p>
                <ul className="mt-4 space-y-2.5">
                  {['Small groups, so no child is left behind', 'Hands-on practice in every class', 'Regular tests with warm, specific feedback', 'Open door for parents to talk to teachers'].map((x) => <li key={x} className="flex gap-2.5 font-bold text-plum/85"><CheckCircle2 className="mt-0.5 shrink-0 text-peacock" size={20} />{x}</li>)}
                </ul>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* TESTIMONIALS */}
      {testi.length > 0 && (
        <section className="bg-white py-20"><div className="mx-auto max-w-7xl px-5">
          <SectionHead eyebrow="Kind words" title="Parents love it" sub="What families say about learning at Krishna Gurukul." />
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {testi.map((t: any, i: number) => (
              <Reveal key={t.n} delay={i * 0.07}>
                <figure className="relative flex h-full flex-col rounded-[2rem] border border-peacock/10 bg-ivory p-7 shadow-sm">
                  <Quote className="absolute right-6 top-6 text-marigold/40" size={44} />
                  <Stars value={Number(t.rating) || (i % 2 === 0 ? 5 : 4.5)} />
                  <blockquote className="mt-4 flex-1 text-lg leading-relaxed text-plum/85">&ldquo;{t.t}&rdquo;</blockquote>
                  <figcaption className="mt-5 flex items-center gap-3 border-t border-peacock/10 pt-4">
                    <span className="grid h-11 w-11 place-items-center rounded-full bg-peacock font-display text-lg font-extrabold text-white">{String(t.n)[0]}</span>
                    <span><span className="block font-display text-lg font-extrabold text-peacock-deep">{t.n}</span><span className="text-sm font-bold text-plum/55">Parent, Krishna Gurukul</span></span>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div></section>
      )}

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-4xl scroll-mt-28 px-5 py-20">
        <SectionHead eyebrow="FAQ" title="Frequently asked questions" sub="Can't find your answer? Call or WhatsApp us, we are happy to help." />
        <div className="mt-10"><FaqAccordion items={FAQS} /></div>
      </section>

      {/* ENQUIRY */}
      <section id="enquire" className="mx-auto max-w-7xl px-5 py-20">
        <div className="grid gap-8 rounded-[2.5rem] bg-peacock-deep p-6 text-white sm:p-10 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <h2 className="text-4xl font-extrabold sm:text-5xl">Book a <span className="text-marigold">free demo</span> class</h2>
            <p className="mb-6 mt-2 text-lg text-white/80">Tell us about your child. We will call you within 24 hours.</p>
            <div className="rounded-3xl bg-white p-4 text-plum sm:p-6"><EnquiryForm type="demo" bare /></div>
          </div>
          <aside className="space-y-4 lg:col-span-2">
            <div className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/15">
              <h3 className="mb-3 font-display text-xl font-extrabold text-marigold">Talk to us</h3>
              <a href={`tel:${SITE.tel}`} className="mb-2 flex min-h-12 items-center justify-center gap-2 rounded-full bg-white font-display font-bold text-peacock-deep"><Phone size={18} />{SITE.phone}</a>
              <a href={`https://wa.me/${SITE.wa}`} target="_blank" rel="noreferrer" className="mb-4 flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#25D366] font-display font-bold text-white"><MessageCircle size={18} />Chat on WhatsApp</a>
              <p className="flex gap-2 text-sm text-white/85"><MapPin className="shrink-0 text-marigold" size={18} />{SITE.address}</p>
            </div>
            <iframe title="Map" src={SITE.map} className="h-60 w-full rounded-3xl border-0" loading="lazy" />
          </aside>
        </div>
      </section>
    </div>
  );
}
