import { useEffect, useState } from 'react';
import { WifiOff, Download } from 'lucide-react';
import { useOnline } from '../hooks';
import { pendingCount, syncQueue } from '../offline/queue';
import { EXIT_EVENT, exitApp } from '../native/bootstrap';
import { checkPlayUpdate } from '../native/feel';
import { useBackClose } from '../native/backStack';
import { BottomSheet } from './BottomSheet';
import { Mascot } from '../components/celebration/Mascot';
import { Button } from '../components/ui';
import { t } from '../i18n';
import { isNative } from '../native/platform';

/** "You're offline, practice still works" + a brief "syncing" note when the queue drains. */
export function OfflineBanner() {
  const online = useOnline();
  const [msg, setMsg] = useState('');
  useEffect(() => {
    if (!online) { setMsg(''); return; }
    let live = true;
    pendingCount().then(async (n) => { if (n > 0 && live) { setMsg(t('offlineSync')); await syncQueue(); setTimeout(() => live && setMsg(''), 2500); } });
    return () => { live = false; };
  }, [online]);
  if (online && !msg) return null;
  return (
    <div role="status" className={`fixed inset-x-0 top-0 z-[120] flex items-center justify-center gap-2 px-4 pb-2 pt-[calc(0.5rem+env(safe-area-inset-top))] text-sm font-bold text-white ${online ? 'bg-mint' : 'bg-navy'}`}>
      {!online && <WifiOff size={16} />}{online ? msg : t('offline')}
    </div>
  );
}

/** "Exit app?" on the home screen back press + in-app update prompt. Mount once inside the router. */
export function NativeDialogs() {
  const [exit, setExit] = useState(false);
  const [upd, setUpd] = useState<{ open: () => Promise<void> } | null>(null);
  useEffect(() => { const f = () => setExit(true); window.addEventListener(EXIT_EVENT, f); return () => window.removeEventListener(EXIT_EVENT, f); }, []);
  useEffect(() => { if (!isNative()) return; let live = true; checkPlayUpdate().then((u) => { if (live && u.available && !sessionStorage.getItem('kg_upd_seen')) setUpd(u); }); return () => { live = false; }; }, []);
  const closeExit = () => setExit(false);
  useBackClose(exit, closeExit);
  const dismissUpd = () => { try { sessionStorage.setItem('kg_upd_seen', '1'); } catch { /* ignore */ } setUpd(null); };
  return (
    <>
      <BottomSheet open={exit} onClose={closeExit} title={t('exitTitle')} footer={<div className="grid grid-cols-2 gap-3"><Button variant="ghost" onClick={closeExit}>{t('stay')}</Button><Button onClick={() => void exitApp()}>{t('exit')}</Button></div>}>
        <p className="text-base text-ink/80">{t('exitBody')}</p>
      </BottomSheet>
      <BottomSheet open={!!upd} onClose={dismissUpd} title={t('updateTitle')} footer={<div className="grid grid-cols-2 gap-3"><Button variant="ghost" onClick={dismissUpd}>{t('later')}</Button><Button onClick={() => void upd?.open()}><Download size={18} />{t('update')}</Button></div>}>
        <div className="flex items-center gap-3"><Mascot mood="cheer" size={72} /><p className="text-base text-ink/80">{t('updateBody')}</p></div>
      </BottomSheet>
    </>
  );
}
