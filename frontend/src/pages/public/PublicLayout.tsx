import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { ArrowRight, Menu, MessageCircle, Phone, X, MapPin, Mail } from 'lucide-react';
import { useAuth } from '../../store';
import { SITE, Reveal } from './shared';
import { cx } from '../../components/ui';
import { homeFor } from '../auth/Login';
import { gsap, reduced, useMagnetic } from '../../utils/motion';
import { useLayoutFx } from '../../utils/siteFx';

const links = [['/', 'Home'], ['/about', 'About'], ['/courses', 'Courses'], ['/gallery', 'Gallery'], ['/demo', 'Free demo'], ['/contact', 'Contact']] as const;

const GMAPS_LINK = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Krishna Gurukul, Near KN Hall, Peedampalli Main Road, Pattanam, Coimbatore 641011')}`;

export default function PublicLayout() {
  const [open, setOpen] = useState(false); const [scrolled, setScrolled] = useState(false);
  const user = useAuth((s) => s.user); const loc = useLocation();
  const header = useRef<HTMLElement>(null); const bar = useRef<HTMLDivElement>(null); const main = useRef<HTMLDivElement>(null); const menu = useRef<HTMLDivElement>(null);
  const cta = useMagnetic<HTMLAnchorElement>(0.25);
  useLayoutFx(header, bar, main);

  useEffect(() => { const f = () => setScrolled(window.scrollY > 12); f(); window.addEventListener('scroll', f, { passive: true }); return () => window.removeEventListener('scroll', f); }, []);

  // route change: close menu, scroll to top (or to #hash), fade the new page in
  useLayoutEffect(() => {
    setOpen(false);
    if (loc.hash) { const el = document.querySelector(loc.hash); if (el) { setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120); } } else window.scrollTo(0, 0);
    const el = main.current; if (!el || reduced()) return;
    gsap.fromTo(el, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out', clearProps: 'transform,opacity' });
    gsap.set(header.current, { yPercent: 0 });
  }, [loc.pathname, loc.hash]);

  // mobile menu: circular reveal + staggered links
  useEffect(() => {
    const el = menu.current; if (!el) return;
    if (open) {
      gsap.set(el, { autoAlpha: 1 });
      if (reduced()) return;
      gsap.fromTo(el, { clipPath: 'circle(0% at 90% 5%)' }, { clipPath: 'circle(150% at 90% 5%)', duration: 0.65, ease: 'power3.inOut' });
      gsap.fromTo(el.querySelectorAll('.menu-item'), { x: 36, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, stagger: 0.06, delay: 0.25, ease: 'power3.out' });
    } else gsap.to(el, { autoAlpha: 0, duration: reduced() ? 0 : 0.25 });
  }, [open]);

  const dash = user ? homeFor(user.role) : '/login';

  return (
    <div className="min-h-screen bg-ivory text-plum">
      <div ref={bar} className="fixed inset-x-0 top-0 z-[70] h-1 bg-gradient-to-r from-peacock via-marigold to-rose" aria-hidden />

      {/* floating pill nav: always readable on the light page */}
      <header ref={header} className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5">
        <div className={cx('mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-full border bg-white/90 py-2 pl-5 pr-2 backdrop-blur-xl transition-shadow', scrolled ? 'border-peacock/15 shadow-[0_12px_40px_-16px_rgba(10,37,64,.45)]' : 'border-peacock/10 shadow-sm')}>
          <Link to="/" className="flex items-center gap-2.5" aria-label="Krishna Gurukul home">
            <img src="/logo-mark.png" alt="Krishna Gurukul" width={497} height={279} className="h-12 w-auto sm:h-14" />
          </Link>
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
            {links.map(([to, l]) => (
              <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => cx('rounded-full px-4 py-2.5 font-display text-[15px] font-bold transition-colors', isActive ? 'bg-peacock-deep text-white' : 'text-plum/80 hover:bg-peacock-soft hover:text-peacock-deep')}>{l}</NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link to={dash} className="hidden min-h-12 items-center rounded-full px-5 font-display font-bold text-peacock-deep hover:bg-peacock-soft sm:inline-flex">{user ? 'My dashboard' : 'Login'}</Link>
            <Link ref={cta} to="/demo" className="hidden min-h-12 items-center gap-1.5 rounded-full bg-rose px-5 font-display font-bold text-white shadow-[0_10px_24px_-10px_rgba(232,89,12,.7)] transition hover:brightness-110 active:scale-95 sm:inline-flex">Book free demo <ArrowRight size={18} /></Link>
            <button aria-label="Open menu" className="grid h-12 w-12 place-items-center rounded-full bg-peacock-deep text-white lg:hidden" onClick={() => setOpen(true)}><Menu /></button>
          </div>
        </div>
      </header>

      <div ref={menu} className="invisible fixed inset-0 z-[80] flex flex-col bg-peacock-deep p-6 text-white opacity-0" aria-hidden={!open}>
        <div className="flex items-center justify-between"><span className="font-display text-2xl font-extrabold">Krishna <span className="text-marigold">Gurukul</span></span><button aria-label="Close menu" className="grid h-12 w-12 place-items-center rounded-full bg-white/10" onClick={() => setOpen(false)}><X /></button></div>
        <div className="mt-8 flex flex-col">{links.map(([to, l]) => (
          <Link key={to} to={to} className="menu-item flex min-h-14 items-center justify-between border-b border-white/10 font-display text-3xl font-extrabold">{l}<ArrowRight className="text-marigold" /></Link>
        ))}</div>
        <div className="menu-item mt-auto grid gap-3 pb-4 pt-8"><Link to="/demo" className="inline-flex min-h-14 items-center justify-center rounded-full bg-rose font-display text-lg font-bold">Book free demo</Link><Link to={dash} className="inline-flex min-h-14 items-center justify-center rounded-full border-2 border-white/30 font-display text-lg font-bold">{user ? 'My dashboard' : 'Parent / Staff login'}</Link></div>
      </div>

      <div ref={main}><Outlet /></div>

      <footer className="relative mt-10 overflow-hidden bg-peacock-deep pt-16 text-white">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-marigold/10" /><div className="pointer-events-none absolute -bottom-24 left-10 h-64 w-64 rounded-full bg-rose/10" />
        <Reveal><div className="relative mx-auto grid max-w-7xl gap-10 px-5 pb-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3"><img src="/logo-wide.png" alt="Krishna Gurukul" width={190} height={109} className="h-20 w-auto rounded-2xl bg-white px-2 py-1" /></div>
            <p className="mt-4 max-w-sm text-lg text-white/80">{SITE.tagline}</p>
          </div>
          <div className="space-y-3 text-white/85">
            <h4 className="font-display text-lg font-extrabold text-marigold">Visit us</h4>
            <a className="flex gap-2 hover:text-white" href={GMAPS_LINK} target="_blank" rel="noreferrer"><MapPin className="mt-1 shrink-0" size={18} />{SITE.address}</a>
            <a href={GMAPS_LINK} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-marigold px-4 font-display text-sm font-bold text-ink">Open in Google Maps ↗</a>
            <iframe title="Krishna Gurukul on Google Maps" src={SITE.map} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="mt-2 h-44 w-full rounded-2xl border-0" />
            <a className="flex items-center gap-2" href={`tel:${SITE.tel}`}><Phone size={18} />{SITE.phone}</a>
            <a className="flex items-center gap-2 break-all" href={`mailto:${SITE.email}`}><Mail size={18} />{SITE.email}</a>
          </div>
          <div>
            <h4 className="mb-2 font-display text-lg font-extrabold text-marigold">Quick links</h4>
            {links.map(([to, l]) => <Link key={to} to={to} className="block py-1.5 text-white/80 hover:text-white">{l}</Link>)}
            <Link to="/#faq" className="block py-1.5 text-white/80 hover:text-white">FAQ</Link>
            <Link to="/login" className="block py-1.5 text-white/80 hover:text-white">Parent / Staff login</Link>
            <Link to="/privacy-policy" className="block py-1.5 text-white/80 hover:text-white">Privacy policy</Link>
          </div>
        </div></Reveal>
        <p className="relative border-t border-white/10 py-5 text-center text-sm text-white/60">© {new Date().getFullYear()} Krishna Gurukul · Built by GrowaLabs</p>
      </footer>

      <a href={`https://wa.me/${SITE.wa}?text=${encodeURIComponent('Hello Krishna Gurukul! I would like to know more.')}`} target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp" className="fixed bottom-24 right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-lg lg:bottom-6"><MessageCircle /></a>
      <div className="safe-bottom fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-peacock/10 bg-white/95 p-2 backdrop-blur lg:hidden">
        <a href={`tel:${SITE.tel}`} className="grid h-12 w-12 flex-none place-items-center rounded-full border-2 border-peacock/20 text-peacock-deep" aria-label="Call us"><Phone size={18} /></a>
        <Link to="/enquire" className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full bg-rose font-display font-bold text-white">Enquire now</Link>
      </div>
    </div>
  );
}
