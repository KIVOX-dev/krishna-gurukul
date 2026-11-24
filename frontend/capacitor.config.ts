import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'in.krishnagurukul.app',
  appName: 'Krishna Gurukul',
  webDir: 'dist',
  android: { allowMixedContent: false, backgroundColor: '#FFA723' },
  // `npm run app:dev` sets CAP_LIVE_URL (e.g. http://192.168.1.5:5173) for live reload on a phone
  ...(process.env.CAP_LIVE_URL ? { server: { url: process.env.CAP_LIVE_URL, cleartext: true } } : {}),
  plugins: {
    SplashScreen: { launchShowDuration: 0, launchAutoHide: false, backgroundColor: '#FFA723', androidSplashResourceName: 'splash', showSpinner: false },
    StatusBar: { overlaysWebView: true, style: 'DARK' },
    Keyboard: { resize: 'body', resizeOnFullScreen: true },
    PushNotifications: { presentationOptions: ['badge', 'sound', 'alert'] },
    LocalNotifications: { smallIcon: 'ic_stat_kg', iconColor: '#EC6206' },
  },
};
export default config;
