import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase, isConfigured, DEMO_MODE } from '../lib/supabase.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const DEMO_USER = { id: 'demo-user', email: 'demo@local' };
const DEMO_PROFILE = { id: 'demo-user', role: 'learner', status: 'active', access_expires_at: null, must_change_password: false, full_name: 'Demo' };

// Pure helper (unit-tested): what may this session do?
export function accessState(user, profile, now = new Date()) {
  if (!user) return 'anonymous';
  if (!profile) return 'noProfile';
  if (profile.status !== 'active') return 'suspended';
  if (profile.access_expires_at && new Date(profile.access_expires_at) <= now) return 'expired';
  if (profile.must_change_password) return 'mustChangePassword';
  return 'ok';
}

export function AuthProvider({ children }) {
  const [state, setState] = useState({ loading: true, user: null, profile: null, profileError: false, demo: false });

  const loadProfile = useCallback(async (user) => {
    if (!user) { setState({ loading: false, user: null, profile: null, profileError: false, demo: false }); return; }
    const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    setState({ loading: false, user, profile: data ?? null, profileError: Boolean(error), demo: false });
  }, []);

  useEffect(() => {
    if (DEMO_MODE && sessionStorage.getItem('rd.demo.session') === '1') {
      setState({ loading: false, user: DEMO_USER, profile: DEMO_PROFILE, profileError: false, demo: true });
      return undefined;
    }
    if (!isConfigured) { setState((s) => ({ ...s, loading: false })); return undefined; }
    let alive = true;
    supabase.auth.getSession().then(({ data }) => { if (alive) loadProfile(data.session?.user ?? null); });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED') return;
      // Defer to avoid calling supabase inside the auth callback synchronously.
      setTimeout(() => { if (alive) loadProfile(session?.user ?? null); }, 0);
    });
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, [loadProfile]);

  const signIn = useCallback(async (email, password) => {
    if (!supabase) return { error: 'notConfigured' };
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) return { error: error.status === 400 || /invalid/i.test(error.message) ? 'invalidCredentials' : 'networkError' };
    await loadProfile(data.user);
    return { ok: true };
  }, [loadProfile]);

  const signInDemo = useCallback(() => {
    if (!DEMO_MODE) return;
    try { sessionStorage.setItem('rd.demo.session', '1'); } catch { /* ignore */ }
    setState({ loading: false, user: DEMO_USER, profile: DEMO_PROFILE, profileError: false, demo: true });
  }, []);

  const signOut = useCallback(async () => {
    try { sessionStorage.removeItem('rd.demo.session'); } catch { /* ignore */ }
    if (supabase && !state.demo) await supabase.auth.signOut();
    setState({ loading: false, user: null, profile: null, profileError: false, demo: false });
  }, [state.demo]);

  const refreshProfile = useCallback(() => loadProfile(state.user), [loadProfile, state.user]);

  const value = useMemo(() => ({
    ...state, access: accessState(state.user, state.profile),
    isAdmin: state.profile?.role === 'admin' && state.profile?.status === 'active',
    signIn, signInDemo, signOut, refreshProfile,
  }), [state, signIn, signInDemo, signOut, refreshProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
