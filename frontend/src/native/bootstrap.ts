import { isNative, WEB_ORIGIN } from './platform';
import { popBack } from './backStack';
import { setPushNavigator } from './push';

/** Window event the shell listens to for the "Exit app?" dialog. */
export const EXIT_EVENT = 'kg:exit-prompt';

/** Path -> in-app route. Brevo links (https://krishnagurukul.in/parent/...) open the app when it is installed. */
export function routeFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.origin !== WEB_ORIGIN && !/(^|\.)krishnagurukul\.in$/.test(u.hostname)) return null;
    return /^\/(parent|faculty|admin)(\/|$)/.test(u.pathname) ? u.pathname + u.search : null;
  } catch { return null; }
}

interface Nav { navigate: (to: string) => void; canGoBack: () => boolean; back: () => void; isHome: () => boolean }

/** Call once after the router mounts. Hides the splash, wires back button, deep links and push taps. */
export async function initNative(nav: Nav) {
  if (!isNative()) return;
  const [{ App }, { SplashScreen }, { LocalNotifications }] = await Promise.all([
    import('@capacitor/app'), import('@capacitor/splash-screen'), import('@capacitor/local-notifications'),
  ]);
  setPushNavigator(nav.navigate);

  // Android back: close modal/sheet first, then go back, then ask "Exit app?" on home
  await App.addListener('backButton', () => {
    if (popBack()) return;
    if (!nav.isHome() && nav.canGoBack()) return nav.back();
    window.dispatchEvent(new Event(EXIT_EVENT));
  });
  await App.addListener('appUrlOpen', (e) => { const r = routeFromUrl(e.url); if (r) nav.navigate(r); });
  const launch = await App.getLaunchUrl(); const r0 = launch?.url ? routeFromUrl(launch.url) : null; if (r0) nav.navigate(r0);
  await LocalNotifications.addListener('localNotificationActionPerformed', (a) => { const r = (a.notification.extra as any)?.route; if (r) nav.navigate(r); });

  // let the first frame paint, then fade the splash
  requestAnimationFrame(() => setTimeout(() => SplashScreen.hide({ fadeOutDuration: 250 }).catch(() => {}), 350));
}

export const exitApp = async () => { const { App } = await import('@capacitor/app'); await App.exitApp(); };
