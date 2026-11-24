/** Public web page at /privacy-policy (linked from Play Console). */
const S = ({ h, children }: { h: string; children: React.ReactNode }) => <section className="mt-6"><h2 className="font-display text-xl font-extrabold text-navy">{h}</h2><div className="mt-2 space-y-2 text-base leading-relaxed text-ink/85">{children}</div></section>;

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 pb-16">
      <h1 className="font-display text-4xl font-extrabold text-navy">Privacy Policy</h1>
      <p className="mt-1 text-sm text-ink/60">Krishna Gurukul · Last updated 24 November 2026</p>
      <p className="mt-4 text-base">Krishna Gurukul (Near KN Hall, Peedampalli Main Road, Pattanam, Coimbatore 641011) runs abacus, Vedic maths, tuition and Carnatic music classes. This policy explains what the Krishna Gurukul website and Android app collect, why, and your choices. The app is used by parents and by children (with a parent) for practice and tests. Accounts are created by the institute; we do not let strangers sign up.</p>

      <S h="What we collect">
        <ul className="list-disc space-y-1 pl-6">
          <li><b>Child details:</b> name, date of birth, photo (optional), batch, abacus level, admission number.</li>
          <li><b>Attendance:</b> present, absent, late or leave for each class.</li>
          <li><b>Learning records:</b> test answers, scores, stars, practice sessions, points, streaks and leaderboard rank.</li>
          <li><b>Parent details:</b> name, email address and phone number.</li>
          <li><b>Fees:</b> invoices, payments and receipts (we do not store card or UPI credentials).</li>
          <li><b>Device token:</b> a Firebase Cloud Messaging token, so we can send notifications to your phone.</li>
          <li><b>Enquiries:</b> the details you type into our enquiry or demo form.</li>
        </ul>
        <p>We do not use advertising SDKs, we do not track children across other apps, and we do not sell data.</p>
      </S>
      <S h="Why we collect it">
        <p>To run classes and the app: show results and attendance, send test, fee and attendance alerts, calculate leaderboards, issue receipts, and sign you in with a one-time code sent to your email. Practice results saved offline are uploaded when your phone is back online.</p>
      </S>
      <S h="Who sees it">
        <p>Parents see only their own child. Faculty see the students in their batches. Institute admins see everything needed to run the school. Leaderboards show a child&apos;s first name and initial (or hide the child entirely if the parent chooses &quot;hide my child&quot; in Settings). We use these service providers to operate the app: MongoDB (database), Backblaze B2 (file storage), Brevo (email), Google Firebase Cloud Messaging (push notifications) and Groq (to write a short, encouraging test summary; no contact details are sent).</p>
      </S>
      <S h="Storage and security">
        <p>Data is encrypted in transit (HTTPS). Your sign-in refresh token is kept in Android secure storage on your phone. Optional fingerprint or face unlock only uses your phone&apos;s own biometric system; we never receive your biometric data.</p>
      </S>
      <S h="How long we keep it">
        <p>While your child is enrolled and for up to 2 years afterwards for fee and attendance records, unless you ask us to delete sooner.</p>
      </S>
      <S h="Deleting your data">
        <p>In the app go to <b>Settings &gt; Delete my account</b>, or use <a className="font-bold text-sky underline" href="/delete-account">krishnagurukul.in/delete-account</a>. We remove your name, email, phone, device tokens and notification settings, and delete your child&apos;s photo and date of birth. Test and attendance history is anonymised. We finish requests within 30 days.</p>
      </S>
      <S h="Children">
        <p>The app is meant for children to practise under a parent&apos;s guidance. A parent creates and controls the account through the institute. We collect only what is needed for classes and show no ads.</p>
      </S>
      <S h="Contact us">
        <p>Email <a className="font-bold text-sky underline" href="mailto:krishnagurukul2022@gmail.com">krishnagurukul2022@gmail.com</a> or call +91 82706 65953.</p>
      </S>
    </main>
  );
}
