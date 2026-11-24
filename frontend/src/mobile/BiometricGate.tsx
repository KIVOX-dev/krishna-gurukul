import { useEffect, useState, type ReactNode } from 'react';
import { Fingerprint } from 'lucide-react';
import { biometricEnabled, biometricUnlock } from '../native/feel';
import { isNative } from '../native/platform';
import { Button } from '../components/ui';
import { Mascot } from '../components/celebration/Mascot';

/** Wrap the signed-in area. When the parent turned on fingerprint/face unlock, reopening the app asks for it. */
export function BiometricGate({ children }: { children: ReactNode }) {
  const [locked, setLocked] = useState(() => isNative() && biometricEnabled());
  const unlock = async () => { if (await biometricUnlock()) setLocked(false); };
  useEffect(() => { if (locked) void unlock(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!isNative() || !biometricEnabled()) return;
    let away = 0;
    const f = () => { if (document.hidden) away = Date.now(); else if (away && Date.now() - away > 30_000) setLocked(true); }; // relock after 30s in background
    document.addEventListener('visibilitychange', f); return () => document.removeEventListener('visibilitychange', f);
  }, []);
  if (!locked) return <>{children}</>;
  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-4 bg-sun p-6 text-center text-ink">
      <Mascot mood="wave" size={120} />
      <p className="font-display text-2xl font-extrabold">Krishna Gurukul</p>
      <Button variant="blue" onClick={() => void unlock()}><Fingerprint /> Unlock</Button>
    </div>
  );
}
