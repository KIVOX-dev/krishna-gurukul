/** All app strings live here so a Tamil file (ta.ts) can be dropped in later. */
export const en = {
  appName: 'Krishna Gurukul',
  offline: "You're offline, practice still works",
  offlineSync: 'Back online. Syncing your practice…',
  lastUpdated: 'Last updated {time}',
  pullToRefresh: 'Pull to refresh',
  releaseToRefresh: 'Release to refresh',
  refreshing: 'Refreshing…',
  exitTitle: 'Exit app?',
  exitBody: 'Press Exit to close Krishna Gurukul.',
  exit: 'Exit',
  stay: 'Stay',
  updateTitle: 'A new version is ready',
  updateBody: 'Update Krishna Gurukul for the latest features.',
  update: 'Update',
  later: 'Later',
  nav: { home: 'Home', tests: 'Tests', practice: 'Practice', fees: 'Fees', more: 'More', attendance: 'Attendance', leaderboard: 'Ranks', settings: 'Settings', enquiries: 'Enquiries', dashboard: 'Dashboard', batches: 'Batches' },
  notifyAsk: { title: 'Stay in the loop?', body: 'I can ping you when a new test arrives, results are ready, your child is marked absent, fees are due, or they climb the leaderboard.', yes: 'Yes, notify me', no: 'Not now', denied: 'Notifications are off. You can turn them on in your phone settings.' },
  settings: {
    title: 'Settings', notifications: 'Notifications', reminder: 'Daily practice reminder', reminderHint: 'A gentle nudge at the time you pick', reminderOff: 'Off',
    appearance: 'Appearance', dark: 'Dark mode', security: 'Security', biometric: 'Unlock with fingerprint or face', biometricHint: 'Ask every time the app is reopened',
    account: 'Account', signOut: 'Sign out', deleteAccount: 'Delete my account', deleteHint: 'We will remove your data after you confirm. This cannot be undone.',
    deleteSent: 'Request received. The institute will complete it and confirm by email.', deletePending: 'Your deletion request is being processed.', version: 'Version {v}',
    push: { 'test-assigned': 'New test assigned', 'test-result': 'Test result ready', absence: 'Absent today', fee: 'Fee due or paid', 'rank-up': 'Leaderboard rank up', 'enquiry-assigned': 'Enquiry assigned to me' },
  },
  delete: {
    title: 'Delete your account', intro: 'Use this page to ask us to delete your Krishna Gurukul account and the data linked to it.',
    what: 'What we delete: your name, email, phone, device tokens, notification settings, and your child\'s profile photo and date of birth. Test and attendance records are anonymised.',
    when: 'We complete requests within 30 days and confirm by email.', email: 'Account email', name: 'Your name', reason: 'Reason (optional)', send: 'Request deletion', thanks: 'Request received. If that email has an account, the institute will contact you.',
  },
  common: { retry: 'Try again', cancel: 'Cancel', confirm: 'Confirm', close: 'Close', save: 'Save', loading: 'Loading…' },
} as const;
export type Strings = typeof en;
