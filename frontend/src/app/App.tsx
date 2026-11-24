import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { restoreSession } from '../services/api';
import { initNative } from '../native/bootstrap';
import { useNative } from '../native/platform';
import { startSyncWatcher } from '../offline/queue';
import { applyTheme } from '../mobile/theme';
import { NativeDialogs, OfflineBanner } from '../mobile/NativeChrome';
import { BiometricGate } from '../mobile/BiometricGate';
import { NotifyPrompt } from '../mobile/NotifyPrompt';
import AppSettings from '../mobile/SettingsPage';
import PrivacyPolicyPage from '../mobile/PrivacyPolicyPage';
import DeleteAccountPage from '../mobile/DeleteAccountPage';
import {
  BarChart3, BookOpen, CalendarCheck, ClipboardList, Home, IndianRupee, Inbox, Layers, Settings, Trophy, Users, GraduationCap, Bell, Pencil, Globe, Sparkles, Baby, UserCog,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api, get } from '../services/api';
import { useAuth } from '../store';
import { AppShell, type NavItem } from '../layouts/AppShell';
import { Toaster, Skeleton } from '../components/ui';
import { useUser } from '../hooks';
import type { Role } from '@kg/shared';

const L = (f: () => Promise<any>) => lazy(f);
const PublicLayout = L(() => import('../pages/public/PublicLayout'));
const HomePage = L(() => import('../pages/public/Home'));
const About = L(() => import('../pages/public/About'));
const Courses = L(() => import('../pages/public/Courses'));
const CourseDetail = L(() => import('../pages/public/CourseDetail'));
const Gallery = L(() => import('../pages/public/Gallery'));
const Contact = L(() => import('../pages/public/Contact'));
const Demo = L(() => import('../pages/public/Demo'));
const Enquire = L(() => import('../pages/public/Enquire'));
const Login = L(() => import('../pages/auth/Login'));

const A = {
  Dashboard: L(() => import('../pages/admin/Dashboard')), People: L(() => import('../pages/admin/People')), Courses: L(() => import('../pages/admin/CoursesAdmin')),
  Batches: L(() => import('../pages/admin/Batches')), Fees: L(() => import('../pages/admin/Fees')), Enquiries: L(() => import('../pages/admin/Enquiries')),
  Tests: L(() => import('../pages/admin/Tests')), Leaderboard: L(() => import('../pages/shared/Leaderboard')), Cms: L(() => import('../pages/admin/Cms')),
  Reports: L(() => import('../pages/admin/Reports')), Settings: L(() => import('../pages/admin/SettingsPage')),
};
const F = { Dashboard: L(() => import('../pages/faculty/Dashboard')), Attendance: L(() => import('../pages/faculty/Attendance')), Results: L(() => import('../pages/faculty/Results')), Student: L(() => import('../pages/faculty/StudentProfile')) };
const P = {
  Home: L(() => import('../pages/parent/Home')), Attendance: L(() => import('../pages/parent/Attendance')), Tests: L(() => import('../pages/parent/Tests')),
  Player: L(() => import('../pages/parent/TestPlayer')), Result: L(() => import('../pages/parent/Result')), Practice: L(() => import('../pages/parent/Practice')),
  Leaderboard: L(() => import('../pages/parent/ParentLeaderboard')), Fees: L(() => import('../pages/parent/ParentFees')), Notifications: L(() => import('../pages/parent/Notifications')),
};

const sz = 22;
const adminNav = (badge: number): NavItem[] => [
  { to: '/admin', label: 'Home', icon: <Home size={sz} />, tab: true, group: 'Overview' },
  { to: '/admin/students', label: 'Students', icon: <GraduationCap size={sz} />, tab: true, group: 'People' },
  { to: '/admin/parents', label: 'Parents', icon: <Baby size={sz} />, group: 'People' },
  { to: '/admin/faculty', label: 'Faculty', icon: <UserCog size={sz} />, group: 'People' },
  { to: '/admin/courses', label: 'Courses', icon: <BookOpen size={sz} />, group: 'Academics' },
  { to: '/admin/batches', label: 'Batches', icon: <Layers size={sz} />, group: 'Academics' },
  { to: '/admin/tests', label: 'Abacus tests', icon: <ClipboardList size={sz} />, group: 'Academics' },
  { to: '/admin/leaderboard', label: 'Leaderboard', icon: <Trophy size={sz} />, group: 'Academics' },
  { to: '/admin/fees', label: 'Fees', icon: <IndianRupee size={sz} />, tab: true, group: 'Money' },
  { to: '/admin/enquiries', label: 'Enquiries', icon: <Inbox size={sz} />, tab: true, group: 'Growth', badge },
  { to: '/admin/cms', label: 'Website CMS', icon: <Globe size={sz} />, group: 'Growth' },
  { to: '/admin/reports', label: 'Reports', icon: <BarChart3 size={sz} />, group: 'System' },
  { to: '/admin/settings', label: 'Settings', icon: <Settings size={sz} />, group: 'System' },
];
const facultyNav: NavItem[] = [
  { to: '/faculty', label: 'My classes', icon: <Home size={sz} />, tab: true },
  { to: '/faculty/results', label: 'Results', icon: <ClipboardList size={sz} />, tab: true },
  { to: '/faculty/leaderboard', label: 'Leaderboard', icon: <Trophy size={sz} />, tab: true },
];
const parentNav: NavItem[] = [
  { to: '/parent', label: 'Home', icon: <Home size={sz} />, tab: true },
  { to: '/parent/attendance', label: 'Attendance', icon: <CalendarCheck size={sz} />, tab: true },
  { to: '/parent/tests', label: 'Tests', icon: <ClipboardList size={sz} />, tab: true },
  { to: '/parent/practice', label: 'Practice', icon: <Pencil size={sz} />, tab: true },
  { to: '/parent/leaderboard', label: 'Leaderboard', icon: <Trophy size={sz} /> },
  { to: '/parent/fees', label: 'Fees', icon: <IndianRupee size={sz} /> },
  { to: '/parent/notifications', label: 'Alerts', icon: <Bell size={sz} /> },
];

function Guard({ role, children }: { role: Role | Role[]; children: JSX.Element }) {
  const { user, ready } = useAuth(); const loc = useLocation();
  if (!ready) return <div className="p-8"><Skeleton className="h-40" /></div>;
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  return (Array.isArray(role) ? role : [role]).includes(user.role) ? <BiometricGate>{children}<NotifyPrompt /></BiometricGate> : <Navigate to="/" replace />;
}

function AdminShell() {
  const badge = useQuery({ queryKey: ['enq-badge'], queryFn: () => get('/admin/enquiries/badge'), refetchInterval: 30_000 });
  return <AppShell calm items={adminNav(badge.data?.count ?? 0)} />;
}

/** In the Android app the public website is web only: "/" goes to login or the role home. */
function NativeHome() {
  const { user, ready } = useAuth();
  if (!ready) return <div className="p-8"><Skeleton className="h-40" /></div>;
  return <Navigate to={user ? (user.role === 'admin' ? '/admin' : user.role === 'faculty' ? '/faculty' : '/parent') : '/login'} replace />;
}

export default function App() {
  const user = useUser(); const navigate = useNavigate(); const native = useNative();
  useEffect(() => {
    restoreSession(); // cookie on web, secure storage in the app
    applyTheme();
    startSyncWatcher();
    initNative({ navigate, canGoBack: () => (history.state?.idx ?? 0) > 0, back: () => navigate(-1), isHome: () => ['/parent', '/faculty', '/admin', '/login'].includes(location.pathname) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  void user; void Sparkles; void Users; void api;
  return (
    <>
      <Suspense fallback={<div className="p-8"><Skeleton className="h-64" /></div>}>
        <Routes>
          <Route path="privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="delete-account" element={<DeleteAccountPage />} />
          {native && <Route index element={<NativeHome />} />}
          <Route element={<PublicLayout />}>
            <Route index element={<HomePage />} /><Route path="about" element={<About />} /><Route path="courses" element={<Courses />} />
            <Route path="courses/:slug" element={<CourseDetail />} /><Route path="gallery" element={<Gallery />} /><Route path="contact" element={<Contact />} /><Route path="demo" element={<Demo />} /><Route path="enquire" element={<Enquire />} />
          </Route>
          <Route path="login" element={<Login />} />

          <Route path="admin" element={<Guard role="admin"><AdminShell /></Guard>}>
            <Route index element={<A.Dashboard />} />
            <Route path="students" element={<A.People kind="students" />} /><Route path="parents" element={<A.People kind="parents" />} /><Route path="faculty" element={<A.People kind="faculty" />} />
            <Route path="courses" element={<A.Courses />} /><Route path="batches" element={<A.Batches />} /><Route path="fees" element={<A.Fees />} />
            <Route path="enquiries" element={<A.Enquiries />} /><Route path="tests" element={<A.Tests />} /><Route path="leaderboard" element={<A.Leaderboard />} />
            <Route path="cms" element={<A.Cms />} /><Route path="reports" element={<A.Reports />} /><Route path="settings" element={<A.Settings />} />
            <Route path="students/:id" element={<F.Student />} /><Route path="app-settings" element={<AppSettings />} />
          </Route>

          <Route path="faculty" element={<Guard role="faculty"><AppShell calm items={facultyNav} /></Guard>}>
            <Route index element={<F.Dashboard />} /><Route path="attendance/:batchId" element={<F.Attendance />} /><Route path="results" element={<F.Results />} />
            <Route path="leaderboard" element={<A.Leaderboard />} /><Route path="students/:id" element={<F.Student />} /><Route path="settings" element={<AppSettings />} />
          </Route>

          <Route path="parent" element={<Guard role="parent"><AppShell calm={false} items={parentNav} /></Guard>}>
            <Route index element={<P.Home />} /><Route path="attendance" element={<P.Attendance />} /><Route path="tests" element={<P.Tests />} />
            <Route path="tests/:testId/play" element={<P.Player />} /><Route path="results/:attemptId" element={<P.Result />} /><Route path="practice" element={<P.Practice />} />
            <Route path="leaderboard" element={<P.Leaderboard />} /><Route path="fees" element={<P.Fees />} /><Route path="notifications" element={<P.Notifications />} /><Route path="settings" element={<AppSettings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <Toaster /><NativeDialogs /><OfflineBanner />
    </>
  );
}
