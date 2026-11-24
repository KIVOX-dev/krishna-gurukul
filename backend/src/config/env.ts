import 'dotenv/config';

const get = (k: string, d = '') => (process.env[k] ?? d).trim();

export const env = {
  isProd: process.env.NODE_ENV === 'production' || !!process.env.VERCEL,
  mongoUri: get('MONGODB_URI'),
  accessSecret: get('JWT_ACCESS_SECRET', 'dev-access-secret-change-me'),
  refreshSecret: get('JWT_REFRESH_SECRET', 'dev-refresh-secret-change-me'),
  cronSecret: get('CRON_SECRET'),
  appUrl: get('APP_URL', 'http://localhost:5173'),
  b2: {
    keyId: get('B2_KEY_ID'), appKey: get('B2_APP_KEY'), bucket: get('B2_BUCKET'),
    endpoint: get('B2_ENDPOINT'), region: get('B2_REGION', 'us-west-004'), publicUrl: get('B2_PUBLIC_URL'),
  },
  brevo: { apiKey: get('BREVO_API_KEY'), senderEmail: get('BREVO_SENDER_EMAIL', 'no-reply@krishnagurukul.in'), senderName: get('BREVO_SENDER_NAME', 'Krishna Gurukul') },
  firebase: { projectId: get('FIREBASE_PROJECT_ID'), clientEmail: get('FIREBASE_CLIENT_EMAIL'), privateKey: get('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n') },
  /** Origins used by the Capacitor Android WebView. */
  appOrigins: ['capacitor://localhost', 'https://localhost', 'http://localhost', 'https://krishnagurukul.in', 'https://www.krishnagurukul.in'],
  adminDeviceOtp: get('ADMIN_DEVICE_OTP', process.env.NODE_ENV === 'production' || process.env.VERCEL ? 'on' : 'off') !== 'off', // email OTP for admin on a new device
  officeEmail: get('OFFICE_EMAIL', 'krishnagurukul2022@gmail.com'),
  groq: {
    keys: get('GROQ_API_KEYS').split(',').map((s) => s.trim()).filter((k) => k && !/^key\d+$/.test(k)),
    primary: get('GROQ_PRIMARY_MODEL', 'openai/gpt-oss-120b'),
    fallback: get('GROQ_FALLBACK_MODEL', 'openai/gpt-oss-20b'),
  },
};
