import { supabase, DEMO_MODE } from './supabase.js';

// Progress service. Two layers:
//  - lesson_progress / competencies : AUTHORITATIVE, written only by the server (RPC complete_lesson).
//  - lesson_checkpoints             : TEMPORARY simulation state the learner may overwrite freely.
// A local copy of the checkpoint is always kept so work survives a lost connection.

const lsGet = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };

export function createProgressService(userId) {
  const ns = DEMO_MODE || !supabase ? 'rd.demo' : `rd.u.${userId}`;
  const cpKey = (lessonId) => `${ns}.cp.${lessonId}`;
  const doneKey = `${ns}.done`;
  const remote = !DEMO_MODE && supabase;

  return {
    async loadSummary() {
      if (!remote) return lsGet(doneKey) ?? { lessons: {}, competencies: [] };
      const [p, c] = await Promise.all([
        supabase.from('lesson_progress').select('lesson_slug, lesson_version, status, completed_at').eq('user_id', userId),
        supabase.from('competencies').select('competency_key').eq('user_id', userId),
      ]);
      if (p.error) throw p.error;
      if (c.error) throw c.error;
      const lessons = {};
      for (const r of p.data) lessons[r.lesson_slug] = { status: r.status, version: r.lesson_version, completedAt: r.completed_at };
      return { lessons, competencies: c.data.map((r) => r.competency_key) };
    },

    async loadCheckpoint(lessonId) {
      const local = lsGet(cpKey(lessonId));
      if (!remote) return local;
      try {
        const { data, error } = await supabase.from('lesson_checkpoints').select('checkpoint, updated_at')
          .eq('user_id', userId).eq('lesson_slug', lessonId).maybeSingle();
        if (error) throw error;
        const server = data?.checkpoint ?? null;
        if (!server) return local;
        if (!local) return server;
        return String(local.savedAt) > String(server.savedAt) ? local : server;
      } catch {
        return local; // offline: fall back to the local copy
      }
    },

    // Returns { ok, remote } — never throws.
    async saveCheckpoint(lessonId, checkpoint) {
      lsSet(cpKey(lessonId), checkpoint);
      if (!remote) return { ok: true, remote: false };
      try {
        const { error } = await supabase.from('lesson_checkpoints').upsert({
          user_id: userId, lesson_slug: lessonId, lesson_version: checkpoint.lessonVersion,
          checkpoint, updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,lesson_slug' });
        if (error) throw error;
        return { ok: true, remote: true };
      } catch {
        return { ok: false, remote: true };
      }
    },

    async clearCheckpoint(lessonId) {
      try { localStorage.removeItem(cpKey(lessonId)); } catch { /* ignore */ }
      if (!remote) return;
      await supabase.from('lesson_checkpoints').delete().eq('user_id', userId).eq('lesson_slug', lessonId);
    },

    // The server re-validates the step list against the published lesson version.
    async completeLesson({ lessonId, version, completedSteps, hintsUsed, mistakes, competencies }) {
      if (!remote) {
        const cur = lsGet(doneKey) ?? { lessons: {}, competencies: [] };
        cur.lessons[lessonId] = { status: 'completed', version, completedAt: new Date().toISOString() };
        cur.competencies = Array.from(new Set([...cur.competencies, ...competencies]));
        lsSet(doneKey, cur);
        return { ok: true };
      }
      const { data, error } = await supabase.rpc('complete_lesson', {
        p_lesson_slug: lessonId, p_version: version, p_completed_steps: completedSteps,
        p_hints_used: hintsUsed ?? 0, p_mistakes: mistakes ?? 0,
      });
      if (error) return { ok: false, error: error.message };
      return { ok: true, data };
    },
  };
}
