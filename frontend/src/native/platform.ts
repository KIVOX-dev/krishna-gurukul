import { Capacitor } from '@capacitor/core';

/** True when running inside the Android app (Capacitor WebView). Public website routes are web only. */
export const isNative = (): boolean => Capacitor.isNativePlatform();
export const useNative = (): boolean => isNative();
export const platform = (): 'android' | 'ios' | 'web' => Capacitor.getPlatform() as 'android' | 'ios' | 'web';

/** API origin: same-origin on web, the real server inside the app (WebView origin is https://localhost). */
export const API_BASE = isNative() ? `${(import.meta.env.VITE_API_URL ?? 'https://api.krishnagurukul.in').replace(/\/$/, '')}/api` : '/api';
export const WEB_ORIGIN: string = import.meta.env.VITE_WEB_URL ?? 'https://krishnagurukul.in';
