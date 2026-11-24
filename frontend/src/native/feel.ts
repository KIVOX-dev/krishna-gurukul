import { isNative } from './platform';

/** Android "remove animations" sets animator scale 0, which Chromium reports as prefers-reduced-motion. */
export const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
/** Low-end phone heuristic, used to cap confetti. */
export const lowEnd = () => ((navigator as any).deviceMemory ?? 4) <= 2 || (navigator.hardwareConcurrency ?? 4) <= 4;
export const confettiCount = (n: number) => (reducedMotion() ? 0 : lowEnd() ? Math.round(n / 3) : n);

type Kind = 'tap' | 'ok' | 'wrong' | 'celebrate';
/** Haptics on taps, correct/wrong answers and celebrations. No-op on web. */
export async function haptic(kind: Kind = 'tap') {
  if (!isNative()) return;
  try {
    const { Haptics, ImpactStyle, NotificationType } = await import('@capacitor/haptics');
    if (kind === 'tap') await Haptics.impact({ style: ImpactStyle.Light });
    else if (kind === 'ok') await Haptics.notification({ type: NotificationType.Success });
    else if (kind === 'wrong') await Haptics.notification({ type: NotificationType.Error });
    else { await Haptics.notification({ type: NotificationType.Success }); setTimeout(() => Haptics.vibrate({ duration: 120 }), 180); }
  } catch { /* ignore */ }
}

/** Colour the Android status bar to match the screen. Edge-to-edge: web content draws behind the bars. */
export async function setBars(color: string, darkBg = false) {
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', color);
  if (!isNative()) return;
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setOverlaysWebView({ overlay: true });
    await StatusBar.setStyle({ style: darkBg ? Style.Dark : Style.Light }); // Style.Dark = light icons
    await StatusBar.setBackgroundColor({ color });
  } catch { /* ignore */ }
}

export async function keepAwake(on: boolean) {
  if (!isNative()) return;
  try { const { KeepAwake } = await import('@capacitor-community/keep-awake'); if (on) await KeepAwake.keepAwake(); else await KeepAwake.allowSleep(); } catch { /* ignore */ }
}

/** Blocks screenshots and the recents preview on the test screen (admin setting). */
export async function privacyScreen(on: boolean) {
  if (!isNative()) return;
  try { const { PrivacyScreen } = await import('@capacitor-community/privacy-screen'); if (on) await PrivacyScreen.enable(); else await PrivacyScreen.disable(); } catch { /* ignore */ }
}

/** Share an image (result card / rank) to WhatsApp and other apps. */
export async function shareImage(blob: Blob, text: string, filename = 'kg-share.png') {
  if (isNative()) {
    try {
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      const { Share } = await import('@capacitor/share');
      const data = await new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = rej; r.readAsDataURL(blob); });
      const f = await Filesystem.writeFile({ path: filename, data, directory: Directory.Cache });
      await Share.share({ text, files: [f.uri], dialogTitle: 'Share' });
      return;
    } catch { /* fall through to web share */ }
  }
  const file = new File([blob], filename, { type: blob.type });
  if (navigator.canShare?.({ files: [file] })) { try { await navigator.share({ files: [file], text }); } catch { /* cancelled */ } return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
}

/** Optional fingerprint / face unlock when the app is reopened. */
export async function biometricAvailable() {
  if (!isNative()) return false;
  try { const { BiometricAuth } = await import('@aparajita/capacitor-biometric-auth'); return (await BiometricAuth.checkBiometry()).isAvailable; } catch { return false; }
}
export async function biometricUnlock(reason = 'Unlock Krishna Gurukul'): Promise<boolean> {
  try { const { BiometricAuth } = await import('@aparajita/capacitor-biometric-auth'); await BiometricAuth.authenticate({ reason, allowDeviceCredential: true }); return true; } catch { return false; }
}
const BIO = 'kg_bio';
export const biometricEnabled = () => { try { return localStorage.getItem(BIO) === '1'; } catch { return false; } };
export const setBiometricEnabled = (v: boolean) => { try { localStorage.setItem(BIO, v ? '1' : '0'); } catch { /* ignore */ } };

/** Prompt when a newer version is live on Play. */
export async function checkPlayUpdate(): Promise<{ available: boolean; open: () => Promise<void> }> {
  if (!isNative()) return { available: false, open: async () => {} };
  try {
    const { AppUpdate, AppUpdateAvailability } = await import('@capawesome/capacitor-app-update');
    const info = await AppUpdate.getAppUpdateInfo();
    return { available: info.updateAvailability === AppUpdateAvailability.UPDATE_AVAILABLE, open: () => AppUpdate.openAppStore() };
  } catch { return { available: false, open: async () => {} }; }
}
