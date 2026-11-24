import { useEffect, useState } from 'react';
import { MapPin, Mail, MessageCircle, Phone, Send } from 'lucide-react';
import { post } from '../../services/api';
import { EnquiryForm } from '../../components/enquiry';
import { SITE } from './shared';
import { Button, Input } from '../../components/ui';

function Chat() {
  const [q, setQ] = useState(''); const [log, setLog] = useState<{ me: boolean; t: string }[]>([{ me: false, t: 'Hi! Ask me about our courses, fees or timings.' }]); const [busy, setBusy] = useState(false);
  async function ask(e: React.FormEvent) {
    e.preventDefault(); if (q.trim().length < 2) return; const text = q; setQ(''); setLog((l) => [...l, { me: true, t: text }]); setBusy(true);
    try { const r = await post('/public/chat', { question: text }); setLog((l) => [...l, { me: false, t: r.answer }]); } catch { setLog((l) => [...l, { me: false, t: 'Please call us on ' + SITE.phone }]); } finally { setBusy(false); }
  }
  return (
    <div className="card p-4"><h3 className="mb-2 text-xl font-extrabold text-navy">Quick answers</h3>
      <div className="mb-3 max-h-60 space-y-2 overflow-y-auto" aria-live="polite">{log.map((m, i) => <p key={i} className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${m.me ? 'ml-auto bg-navy text-white' : 'bg-sky/10'}`}>{m.t}</p>)}{busy && <p className="text-sm text-ink/50">Typing…</p>}</div>
      <form onSubmit={ask} className="flex gap-2"><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Fees for abacus?" aria-label="Your question" /><Button type="submit" small aria-label="Send"><Send size={16} /></Button></form></div>
  );
}

export default function Contact() {
  const [tick, setTick] = useState(0);
  useEffect(() => { if (location.hash === '#enquire') setTimeout(() => document.getElementById('enquire')?.scrollIntoView({ behavior: 'smooth' }), 200); setTick(1); }, []);
  void tick;
  return (
    <div>
      <section className="grad-sunset px-4 pb-16 pt-32 text-center text-white"><h1 className="text-5xl font-extrabold sm:text-6xl">Contact us</h1><p className="mt-2 text-xl">We would love to meet your little learner.</p></section>
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-14 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="card space-y-3 p-5"><p className="flex gap-3"><MapPin className="shrink-0 text-saffron" />{SITE.address}</p><a className="flex gap-3" href={`tel:${SITE.tel}`}><Phone className="text-saffron" />{SITE.phone}</a><a className="flex gap-3" href={`mailto:${SITE.email}`}><Mail className="text-saffron" />{SITE.email}</a>
            <a href={`https://wa.me/${SITE.wa}`} target="_blank" rel="noreferrer" className="btn w-full bg-[#25D366] text-white"><MessageCircle size={18} />Click to chat on WhatsApp</a></div>
          <iframe title="Map" src={SITE.map} className="h-72 w-full rounded-chunk border-0 shadow-soft" loading="lazy" />
          <Chat />
        </div>
        <div id="enquire"><h2 className="mb-3 text-3xl font-extrabold text-navy">Send an enquiry</h2><EnquiryForm /></div>
      </section>
    </div>
  );
}
