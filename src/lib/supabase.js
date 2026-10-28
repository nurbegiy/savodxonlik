import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isConfigured = Boolean(url && anon && /^https?:\/\//.test(url));

// Only the public anon key is ever used in the browser. Authorization is enforced by
// Postgres Row Level Security and by the admin Edge Function — never by this client.
export const supabase = isConfigured
  ? createClient(url, anon, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } })
  : null;

// Demo mode exists only in `vite dev` and only when explicitly enabled.
export const DEMO_MODE = Boolean(import.meta.env.DEV && import.meta.env.VITE_DEV_DEMO === 'true');
