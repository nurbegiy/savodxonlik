// Supabase Edge Function: privileged user administration.
// The service-role key lives ONLY here (injected by Supabase as SUPABASE_SERVICE_ROLE_KEY).
// Every call re-verifies, server-side, that the caller is an ACTIVE ADMIN.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const URL_ = Deno.env.get('SUPABASE_URL')!;
const ANON = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') ?? '*'; // set to your site URL in production

const cors = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isIso = (v: unknown) => typeof v === 'string' && !Number.isNaN(Date.parse(v));

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' });

  const authHeader = req.headers.get('Authorization') ?? '';
  const caller = createClient(URL_, ANON, { global: { headers: { Authorization: authHeader } } });
  const { data: u, error: uErr } = await caller.auth.getUser();
  if (uErr || !u.user) return json(401, { error: 'unauthenticated' });

  const admin = createClient(URL_, SERVICE, { auth: { persistSession: false } });
  const { data: me } = await admin.from('profiles').select('role,status,access_expires_at').eq('id', u.user.id).maybeSingle();
  const expired = me?.access_expires_at && new Date(me.access_expires_at) <= new Date();
  if (!me || me.role !== 'admin' || me.status !== 'active' || expired) return json(403, { error: 'forbidden' });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json(400, { error: 'invalid_json' }); }

  const audit = (action: string, target: string | null, details: Record<string, unknown> = {}) =>
    admin.from('audit_log').insert({ actor_id: u.user.id, action, target_user_id: target, details });

  switch (body.action) {
    case 'create': {
      const email = String(body.email ?? '').trim().toLowerCase();
      const password = String(body.password ?? '');
      const fullName = String(body.fullName ?? '').trim().slice(0, 120);
      const role = body.role === 'admin' ? 'admin' : 'learner';
      const exp = body.accessExpiresAt ?? null;
      if (!EMAIL.test(email)) return json(400, { error: 'invalid_email' });
      if (password.length < 8) return json(400, { error: 'password_too_short' });
      if (exp !== null && !isIso(exp)) return json(400, { error: 'invalid_expiry' });

      const { data: created, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
      if (error || !created.user) return json(400, { error: error?.message ?? 'create_failed' });
      const { error: pErr } = await admin.from('profiles').insert({
        id: created.user.id, email, full_name: fullName, role, status: 'active',
        access_expires_at: exp, must_change_password: true, password_reset_at: new Date().toISOString(),
      });
      if (pErr) { await admin.auth.admin.deleteUser(created.user.id); return json(500, { error: 'profile_failed' }); } // never leave a half-created account
      await audit('user.create', created.user.id, { role, hasExpiry: exp !== null });
      return json(200, { ok: true, userId: created.user.id });
    }
    case 'update': {
      const userId = String(body.userId ?? '');
      const patch: Record<string, unknown> = {};
      if (body.status !== undefined) {
        if (body.status !== 'active' && body.status !== 'suspended') return json(400, { error: 'invalid_status' });
        if (userId === u.user.id && body.status === 'suspended') return json(400, { error: 'cannot_suspend_self' });
        patch.status = body.status;
      }
      if (body.accessExpiresAt !== undefined) {
        if (body.accessExpiresAt !== null && !isIso(body.accessExpiresAt)) return json(400, { error: 'invalid_expiry' });
        patch.access_expires_at = body.accessExpiresAt;
      }
      if (body.role !== undefined) {
        if (body.role !== 'admin' && body.role !== 'learner') return json(400, { error: 'invalid_role' });
        if (userId === u.user.id) return json(400, { error: 'cannot_change_own_role' });
        patch.role = body.role;
      }
      if (!userId || Object.keys(patch).length === 0) return json(400, { error: 'nothing_to_update' });
      const { error } = await admin.from('profiles').update(patch).eq('id', userId);
      if (error) return json(400, { error: error.message });
      if (patch.status === 'suspended') await admin.auth.admin.signOut(userId, 'global').catch(() => {});
      await audit('user.update', userId, patch);
      return json(200, { ok: true });
    }
    case 'reset-password': {
      const userId = String(body.userId ?? '');
      const password = String(body.password ?? '');
      if (!userId) return json(400, { error: 'missing_user' });
      if (password.length < 8) return json(400, { error: 'password_too_short' });
      const { error } = await admin.auth.admin.updateUserById(userId, { password });
      if (error) return json(400, { error: error.message });
      await admin.from('profiles').update({ must_change_password: true, password_reset_at: new Date().toISOString() }).eq('id', userId);
      await audit('user.reset_password', userId);
      return json(200, { ok: true });
    }
    default:
      return json(400, { error: 'unknown_action' });
  }
});
