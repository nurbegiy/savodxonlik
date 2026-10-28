import { Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthProvider.jsx';
import { Spinner, BlockedScreen } from '../ui/Feedback.jsx';

// Protects routes: signed-in, active, not expired, password already changed.
export function RequireAccess({ children, allowPasswordChange = false }) {
  const { loading, access, signOut } = useAuth();
  const { t } = useTranslation();
  const loc = useLocation();
  if (loading) return <Spinner label={t('common.loading')} />;
  if (access === 'anonymous') return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  if (access === 'suspended') return <BlockedScreen title={t('auth.suspendedTitle')} body={t('auth.suspendedBody')} onLogout={signOut} />;
  if (access === 'expired') return <BlockedScreen title={t('auth.expiredTitle')} body={t('auth.expiredBody')} onLogout={signOut} />;
  if (access === 'noProfile') return <BlockedScreen title={t('auth.profileMissingTitle')} body={t('auth.profileMissingBody')} onLogout={signOut} />;
  if (access === 'mustChangePassword' && !allowPasswordChange) return <Navigate to="/change-password" replace />;
  return children;
}

// UI-level admin gate. Real enforcement is RLS + the Edge Function; this only hides the screen.
export function RequireAdmin({ children }) {
  const { isAdmin } = useAuth();
  const { t } = useTranslation();
  if (!isAdmin) return <BlockedScreen title={t('notFound.title')} body={t('auth.adminOnly')} home />;
  return children;
}
