import { useMute } from '../store';

/** Tiny WebAudio synth: no audio files to ship. Honors the mute toggle. */
let ctx: AudioContext | null = null;
const ac = () => (ctx ??= new (window.AudioContext || (window as any).webkitAudioContext)());

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', vol = 0.12) {
  const c = ac(); const o = c.createOscillator(); const g = c.createGain();
  o.type = type; o.frequency.value = freq; o.connect(g); g.connect(c.destination);
  const t = c.currentTime + start;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.start(t); o.stop(t + dur + 0.05);
}

export const sfx = {
  bead() { play(() => tone(520 + Math.random() * 80, 0, 0.08, 'triangle', 0.1)); },
  tick() { play(() => tone(880, 0, 0.05, 'square', 0.04)); },
  drum(seconds = 2) { play(() => { for (let i = 0; i < seconds * 14; i++) tone(90 + (i % 2) * 20, i * 0.07, 0.06, 'triangle', 0.08 + i * 0.002); }); },
  ding() { play(() => { [1047, 1319, 1568].forEach((f, i) => tone(f, i * 0.07, 0.22, 'sine', 0.13)); }); },
  fanfare() { play(() => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.35, 'triangle', 0.14))); },
  oops() { play(() => { tone(300, 0, 0.18, 'sawtooth', 0.06); tone(220, 0.15, 0.25, 'sawtooth', 0.06); }); },
};
function play(fn: () => void) {
  if (useMute.getState().muted) return;
  try { ac().resume?.(); fn(); } catch { /* audio blocked */ }
}

let voice: SpeechSynthesisVoice | null | undefined;
function pickVoice() {
  if (voice !== undefined && voice !== null) return voice;
  const vs = window.speechSynthesis.getVoices();
  voice = vs.find((v) => v.lang === 'en-IN') ?? vs.find((v) => /en[-_](GB|US)/.test(v.lang) && /google|natural|online/i.test(v.name)) ?? vs.find((v) => v.lang.startsWith('en')) ?? null;
  return voice;
}

/** Fast, clear number reading. Cancels anything still queued so it never lags behind the flash. */
export function speak(text: string, rate = 1.45) {
  if (useMute.getState().muted || !('speechSynthesis' in window)) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = rate; u.pitch = 1.05; u.volume = 1; u.lang = 'en-IN';
  const v = pickVoice(); if (v) u.voice = v;
  synth.speak(u);
}
if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.onvoiceschanged = () => { voice = undefined; };

/** Speaks and resolves when the voice has finished (or after a safety timeout). Never cancels in front of itself. */
export function speakAsync(text: string, rate = 1.3): Promise<void> {
  return new Promise((resolve) => {
    if (useMute.getState().muted || !('speechSynthesis' in window)) return resolve();
    const synth = window.speechSynthesis;
    const u = new SpeechSynthesisUtterance(text);
    u.rate = rate; u.pitch = 1.05; u.lang = 'en-IN';
    const v = pickVoice(); if (v) u.voice = v;
    let done = false; const fin = () => { if (!done) { done = true; clearTimeout(t); resolve(); } };
    const t = setTimeout(fin, 2500);
    u.onend = fin; u.onerror = fin;
    if (synth.paused) synth.resume();
    synth.speak(u);
  });
}
export const stopSpeaking = () => { try { window.speechSynthesis?.cancel(); } catch { /* ignore */ } };
