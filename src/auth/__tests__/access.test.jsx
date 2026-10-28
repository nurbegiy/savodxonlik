import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k) => k, i18n: { language: 'uz' } }) }));
let mockAuth;
vi.mock('../AuthProvider.jsx', async (orig) => ({ ...(await orig()), useAuth: () => mockAuth }));

import { accessState } from '../AuthProvider.jsx';
import { RequireAccess, RequireAdmin } from '../guards.jsx';

const user = { id: 'u1' };
const base = { role: 'learner', status: 'active', access_expires_at: null, must_change_password: false };

describe('accessState', () => {
  it('anonymous / missing profile', () => {
    expect(accessState(null, null)).toBe('anonymous');
    expect(accessState(user, null)).toBe('noProfile');
  });
  it('suspension and expiry are enforced', () => {
    expect(accessState(user, { ...base, status: 'suspended' })).toBe('suspended');
    expect(accessState(user, { ...base, access_expires_at: '2020-01-01T00:00:00Z' })).toBe('expired');
    expect(accessState(user, { ...base, access_expires_at: '2999-01-01T00:00:00Z' })).toBe('ok');
    expect(accessState(user, { ...base, access_expires_at: '2026-01-01T00:00:00Z' }, new Date('2026-01-01T00:00:00Z'))).toBe('expired');
  });
  it('forces a password change', () => {
    expect(accessState(user, { ...base, must_change_password: true })).toBe('mustChangePassword');
  });
});

function renderAt(path, auth) {
  mockAuth = { loading: false, signOut: vi.fn(), ...auth };
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<p>LOGIN</p>} />
        <Route path="/change-password" element={<p>CHANGE</p>} />
        <Route path="/" element={<RequireAccess><p>HOME</p></RequireAccess>} />
        <Route path="/admin" element={<RequireAccess><RequireAdmin><p>ADMIN</p></RequireAdmin></RequireAccess>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('route guards', () => {
  it('redirects anonymous users to /login', () => {
    renderAt('/', { access: 'anonymous', isAdmin: false });
    expect(screen.getByText('LOGIN')).toBeInTheDocument();
  });
  it('blocks suspended and expired accounts with an explanation', () => {
    const { unmount } = renderAt('/', { access: 'suspended', isAdmin: false });
    expect(screen.getByText('auth.suspendedTitle')).toBeInTheDocument();
    unmount();
    renderAt('/', { access: 'expired', isAdmin: false });
    expect(screen.getByText('auth.expiredTitle')).toBeInTheDocument();
  });
  it('sends users who must change their password to /change-password', () => {
    renderAt('/', { access: 'mustChangePassword', isAdmin: false });
    expect(screen.getByText('CHANGE')).toBeInTheDocument();
  });
  it('a learner cannot open the admin route', () => {
    renderAt('/admin', { access: 'ok', isAdmin: false });
    expect(screen.queryByText('ADMIN')).not.toBeInTheDocument();
    expect(screen.getByText('auth.adminOnly')).toBeInTheDocument();
  });
  it('an admin can', () => {
    renderAt('/admin', { access: 'ok', isAdmin: true });
    expect(screen.getByText('ADMIN')).toBeInTheDocument();
  });
});
