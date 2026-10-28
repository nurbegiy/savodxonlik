// @vitest-environment node
// Runs the REAL migrations in an in-process PostgreSQL (PGlite) with Supabase-style roles and
// auth.uid(), then exercises Row Level Security as different users.
import { describe, it, expect, beforeAll } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ch1 } from '../../src/lessons/ch1/definition.js';
import { ch2 } from '../../src/lessons/ch2/definition.js';

const dir = process.env.MIGRATIONS_DIR ?? fileURLToPath(new URL('../migrations/', import.meta.url));
const ids = {
  admin: '00000000-0000-0000-0000-0000000000a1',
  alice: '00000000-0000-0000-0000-0000000000b1',
  bob: '00000000-0000-0000-0000-0000000000b2',
  suspended: '00000000-0000-0000-0000-0000000000c1',
  expired: '00000000-0000-0000-0000-0000000000c2',
  fresh: '00000000-0000-0000-0000-0000000000d1',
};
let db;

// Run SQL as an authenticated user (or anon). Always resets the role afterwards.
async function as(uid, sql, params = []) {
  await db.exec(uid ? `set role authenticated; select set_config('request.jwt.claim.sub', '${uid}', false);` : `set role anon; select set_config('request.jwt.claim.sub', '', false);`);
  try { return await db.query(sql, params); } finally { await db.exec('reset role;'); }
}
const fails = async (p) => { try { await p; return null; } catch (e) { return String(e.message); } };
const steps = (def) => JSON.stringify(def.steps.map((s) => s.id));

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
    create schema auth;
    create table auth.users (id uuid primary key, email text, updated_at timestamptz not null default now());
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth, public to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;
  `);
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.sql')).sort()) await db.exec(readFileSync(dir + f, 'utf8'));
  for (const [name, id] of Object.entries(ids)) await db.query('insert into auth.users (id, email) values ($1, $2)', [id, `${name}@t.test`]);
  const prof = (id, email, role = 'learner', status = 'active', exp = null) =>
    db.query('insert into public.profiles (id, email, full_name, role, status, access_expires_at) values ($1,$2,$2,$3,$4,$5)', [id, email, role, status, exp]);
  await prof(ids.admin, 'admin@t.test', 'admin');
  await prof(ids.alice, 'alice@t.test');
  await prof(ids.bob, 'bob@t.test');
  await prof(ids.suspended, 'sus@t.test', 'learner', 'suspended');
  await prof(ids.expired, 'exp@t.test', 'learner', 'active', '2020-01-01T00:00:00Z');
  await prof(ids.fresh, 'fresh@t.test');
});

describe('migrations & seed', () => {
  it('seeded published step lists match the code definitions exactly', async () => {
    const r = await db.query("select lesson_slug, to_jsonb(step_ids) as s from public.lesson_versions order by lesson_slug");
    expect(r.rows.find((x) => x.lesson_slug === 'ch1-desktop').s).toEqual(ch1.steps.map((s) => s.id));
    expect(r.rows.find((x) => x.lesson_slug === 'ch2-files').s).toEqual(ch2.steps.map((s) => s.id));
  });
});

describe('profiles', () => {
  it('a learner sees only their own profile; an admin sees all', async () => {
    expect((await as(ids.alice, 'select id from public.profiles')).rows.map((r) => r.id)).toEqual([ids.alice]);
    expect((await as(ids.admin, 'select id from public.profiles')).rows.length).toBe(6);
  });
  it('a learner cannot grant themselves admin or extend their own expiry', async () => {
    await as(ids.alice, "update public.profiles set role = 'admin' where id = $1", [ids.alice]);
    await as(ids.expired, "update public.profiles set access_expires_at = null where id = $1", [ids.expired]);
    const r = await db.query("select role from public.profiles where id = $1", [ids.alice]);
    expect(r.rows[0].role).toBe('learner');
    const e = await db.query("select access_expires_at from public.profiles where id = $1", [ids.expired]);
    expect(e.rows[0].access_expires_at).not.toBeNull();
  });
  it('a learner cannot create or delete profiles', async () => {
    expect(await fails(as(ids.alice, "insert into public.profiles (id, email, role) values (gen_random_uuid(), 'x@x', 'admin')"))).toMatch(/permission denied|row-level/i);
    expect(await fails(as(ids.alice, 'delete from public.profiles'))).toMatch(/permission denied/i);
  });
  it('an anonymous caller sees nothing', async () => {
    expect(await fails(as(null, 'select * from public.profiles'))).toMatch(/permission denied/i);
  });
  it('an admin can suspend a user, and the suspension takes effect immediately', async () => {
    await as(ids.admin, "update public.profiles set status = 'suspended' where id = $1", [ids.bob]);
    expect((await as(ids.bob, 'select * from public.lesson_checkpoints')).rows).toEqual([]);
    expect(await fails(as(ids.bob, "select public.complete_lesson('ch1-desktop', 1, $1::jsonb)", [steps(ch1)]))).toMatch(/access_denied/);
    await as(ids.admin, "update public.profiles set status = 'active' where id = $1", [ids.bob]);
  });
});

describe('progress is server-authoritative', () => {
  it('a learner cannot write progress, tasks or competencies directly', async () => {
    for (const sql of [
      `insert into public.lesson_progress (user_id, lesson_slug, lesson_version, completed_steps) values ('${ids.alice}', 'ch1-desktop', 1, '{x}')`,
      `insert into public.task_completions (user_id, lesson_slug, lesson_version, step_id) values ('${ids.alice}', 'ch1-desktop', 1, 'welcome')`,
      `insert into public.competencies (user_id, competency_key, lesson_slug) values ('${ids.alice}', 'mouse', 'ch1-desktop')`,
    ]) expect(await fails(as(ids.alice, sql))).toMatch(/permission denied/i);
  });
  it('complete_lesson rejects a wrong, partial, reordered or unknown step list', async () => {
    const all = ch1.steps.map((s) => s.id);
    for (const bad of [[], all.slice(0, -1), [...all].reverse(), [...all, 'extra'], 'not-an-array']) {
      expect(await fails(as(ids.alice, "select public.complete_lesson('ch1-desktop', 1, $1::jsonb)", [JSON.stringify(bad)]))).toMatch(/steps_do_not_match/);
    }
    expect(await fails(as(ids.alice, "select public.complete_lesson('ch1-desktop', 99, $1::jsonb)", [steps(ch1)]))).toMatch(/unknown_or_unpublished/);
    expect((await as(ids.alice, 'select * from public.lesson_progress')).rows).toEqual([]);
  });
  it('prerequisites are enforced', async () => {
    expect(await fails(as(ids.alice, "select public.complete_lesson('ch2-files', 1, $1::jsonb)", [steps(ch2)]))).toMatch(/prerequisite_not_completed/);
  });
  it('a valid completion records progress, steps and competencies; it is idempotent', async () => {
    for (let i = 0; i < 2; i++) await as(ids.alice, "select public.complete_lesson('ch1-desktop', 1, $1::jsonb, 2, 3)", [steps(ch1)]);
    const p = (await as(ids.alice, 'select * from public.lesson_progress')).rows;
    expect(p).toHaveLength(1);
    expect(p[0].hints_used).toBe(2);
    expect((await as(ids.alice, 'select count(*)::int c from public.task_completions')).rows[0].c).toBe(ch1.steps.length);
    expect((await as(ids.alice, 'select count(*)::int c from public.competencies')).rows[0].c).toBe(ch1.competencies.length);
    await as(ids.alice, "select public.complete_lesson('ch2-files', 1, $1::jsonb)", [steps(ch2)]); // now allowed
  });
  it("a learner cannot read another learner's progress; an admin can", async () => {
    expect((await as(ids.bob, 'select * from public.lesson_progress')).rows).toEqual([]);
    expect((await as(ids.bob, 'select * from public.competencies')).rows).toEqual([]);
    expect((await as(ids.admin, 'select distinct user_id from public.lesson_progress')).rows.map((r) => r.user_id)).toEqual([ids.alice]);
  });
  it('suspended and expired accounts cannot complete lessons', async () => {
    for (const u of [ids.suspended, ids.expired]) {
      expect(await fails(as(u, "select public.complete_lesson('ch1-desktop', 1, $1::jsonb)", [steps(ch1)]))).toMatch(/access_denied/);
    }
  });
});

describe('checkpoints (temporary learner state)', () => {
  it('a learner can save and read their own checkpoint but never anyone else’s', async () => {
    await as(ids.alice, `insert into public.lesson_checkpoints (user_id, lesson_slug, lesson_version, checkpoint) values ('${ids.alice}', 'ch1-desktop', 1, '{"stepIndex":3}')`);
    expect((await as(ids.alice, 'select * from public.lesson_checkpoints')).rows).toHaveLength(1);
    expect((await as(ids.bob, 'select * from public.lesson_checkpoints')).rows).toHaveLength(0);
    expect(await fails(as(ids.bob, `insert into public.lesson_checkpoints (user_id, lesson_slug, lesson_version, checkpoint) values ('${ids.alice}', 'ch2-files', 1, '{}')`))).toMatch(/row-level security/i);
    await as(ids.bob, `update public.lesson_checkpoints set checkpoint = '{"evil":1}' where user_id = '${ids.alice}'`);
    expect((await as(ids.alice, 'select checkpoint from public.lesson_checkpoints')).rows[0].checkpoint).toEqual({ stepIndex: 3 });
  });
  it('suspended / expired users cannot write checkpoints', async () => {
    for (const u of [ids.suspended, ids.expired]) {
      expect(await fails(as(u, `insert into public.lesson_checkpoints (user_id, lesson_slug, lesson_version, checkpoint) values ('${u}', 'ch1-desktop', 1, '{}')`))).toMatch(/row-level security/i);
    }
  });
});

describe('content & admin data', () => {
  it('unpublished content is hidden from learners but visible to admins', async () => {
    await db.exec("insert into public.lessons (slug, module_slug, position, published) values ('draft-lesson', 'first-step', 9, false)");
    expect((await as(ids.alice, "select slug from public.lessons where slug = 'draft-lesson'")).rows).toEqual([]);
    expect((await as(ids.admin, "select slug from public.lessons where slug = 'draft-lesson'")).rows).toHaveLength(1);
  });
  it('learners cannot edit content; admins can', async () => {
    await as(ids.alice, "update public.lessons set published = false where slug = 'ch1-desktop'");
    expect((await db.query("select published from public.lessons where slug = 'ch1-desktop'")).rows[0].published).toBe(true);
    expect(await fails(as(ids.alice, "insert into public.modules (slug, position) values ('hack', 99)"))).toMatch(/row-level security/i);
    await as(ids.admin, "insert into public.modules (slug, position) values ('admin-made', 98)");
    expect((await db.query("select 1 from public.modules where slug = 'admin-made'")).rows).toHaveLength(1);
  });
  it('the audit log is readable by admins only and writable by nobody via the API', async () => {
    await db.exec(`insert into public.audit_log (actor_id, action) values ('${ids.admin}', 'test')`);
    expect((await as(ids.alice, 'select * from public.audit_log').catch(() => ({ rows: [] }))).rows).toEqual([]);
    expect((await as(ids.admin, 'select * from public.audit_log')).rows).toHaveLength(1);
    expect(await fails(as(ids.admin, `insert into public.audit_log (action) values ('forged')`))).toMatch(/permission denied/i);
  });
});

describe('forced password change', () => {
  it('cannot be cleared until the auth password actually changed after the temporary one was issued', async () => {
    await db.query("update public.profiles set must_change_password = true, password_reset_at = now() where id = $1", [ids.fresh]);
    await db.query("update auth.users set updated_at = now() - interval '1 hour' where id = $1", [ids.fresh]);
    expect(await fails(as(ids.fresh, 'select public.clear_must_change_password()'))).toMatch(/password_not_changed/);
    await db.query("update auth.users set updated_at = now() + interval '1 minute' where id = $1", [ids.fresh]);
    await as(ids.fresh, 'select public.clear_must_change_password()');
    expect((await db.query('select must_change_password m from public.profiles where id = $1', [ids.fresh])).rows[0].m).toBe(false);
  });
  it('a learner cannot clear someone else’s flag', async () => {
    await db.query("update public.profiles set must_change_password = true where id = $1", [ids.bob]);
    await as(ids.alice, 'select public.clear_must_change_password()');
    expect((await db.query('select must_change_password m from public.profiles where id = $1', [ids.bob])).rows[0].m).toBe(true);
  });
});
