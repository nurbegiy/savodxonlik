import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { RequireAccess, RequireAdmin } from '../auth/guards.jsx';
import { ErrorBoundary, Spinner, BlockedScreen } from '../ui/Feedback.jsx';
import LoginPage from './LoginPage.jsx';
import HomePage from './HomePage.jsx';
import ChangePasswordPage from './ChangePasswordPage.jsx';

// Heavy / rarely used sections are loaded on demand.
const LessonPage = lazy(() => import('./LessonPage.jsx'));
const AdminPage = lazy(() => import('../admin/AdminPage.jsx'));

export default function App() {
  const { t } = useTranslation();
  return (
    <ErrorBoundary>
      <Suspense fallback={<Spinner label={t('common.loading')} />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/change-password" element={<RequireAccess allowPasswordChange><ChangePasswordPage /></RequireAccess>} />
          <Route path="/" element={<RequireAccess><HomePage /></RequireAccess>} />
          <Route path="/learn/:lessonId" element={<RequireAccess><LessonPage /></RequireAccess>} />
          <Route path="/admin" element={<RequireAccess><RequireAdmin><AdminPage /></RequireAdmin></RequireAccess>} />
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="*" element={<BlockedScreen title={t('notFound.title')} body="" home />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
