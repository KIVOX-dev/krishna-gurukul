import { useEffect, useState } from 'react';
import { enablePush, pushPermissionState, refreshPushIfGranted } from '../native/push';
import { isNative } from '../native/platform';
import { BottomSheet } from './BottomSheet';
import { Mascot } from '../components/celebration/Mascot';
import { Button } from '../components/ui';
import { t } from '../i18n';

const ASKED = 'kg_push_asked';

/** Friendly explainer shown once after the first login (never on launch). Mount inside the signed-in area. */
export function NotifyPrompt() {
  const [open, setOpen] = useState(false);
  const [denied, setDenied] = useState(false);
  useEffect(() => {
    if (!isNative()) return; let live = true;
    (async () => {
      const st = await pushPermissionState();
      if (st === 'granted') return void refreshPushIfGranted();
      let asked = false; try { asked = localStorage.getItem(ASKED) === '1'; } catch { /* ignore */ }
      if (st === 'prompt' && !asked && live) setTimeout(() => live && setOpen(true), 1200);
    })();
    return () => { live = false; };
  }, []);
  const mark = () => { try { localStorage.setItem(ASKED, '1'); } catch { /* ignore */ } };
  const yes = async () => { mark(); const ok = await enablePush(); if (ok) setOpen(false); else setDenied(true); };
  const no = () => { mark(); setOpen(false); };
  return (
    <BottomSheet open={open} onClose={no} title={t('notifyAsk.title')} footer={denied ? <Button onClick={no}>{t('common.close')}</Button> : <div className="grid grid-cols-2 gap-3"><Button variant="ghost" onClick={no}>{t('notifyAsk.no')}</Button><Button onClick={() => void yes()}>{t('notifyAsk.yes')}</Button></div>}>
      <div className="flex flex-col items-center gap-3 text-center"><Mascot mood="wave" size={110} /><p className="text-base text-ink/80">{denied ? t('notifyAsk.denied') : t('notifyAsk.body')}</p></div>
    </BottomSheet>
  );
}
