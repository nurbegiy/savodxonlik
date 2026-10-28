-- Access helpers. SECURITY DEFINER so policies can read profiles without recursion;
-- search_path is pinned to defeat search-path hijacking.
create or replace function public.is_active_user() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.status = 'active'
      and (p.access_expires_at is null or p.access_expires_at > now())
  );
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin' and p.status = 'active'
      and (p.access_expires_at is null or p.access_expires_at > now())
  );
$$;

-- keep updated_at honest
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();

alter table public.profiles                 enable row level security;
alter table public.modules                  enable row level security;
alter table public.lessons                  enable row level security;
alter table public.lesson_versions          enable row level security;
alter table public.lesson_translations      enable row level security;
alter table public.lesson_checkpoints       enable row level security;
alter table public.lesson_progress          enable row level security;
alter table public.task_completions         enable row level security;
alter table public.competencies             enable row level security;
alter table public.assessment_attempts      enable row level security;
alter table public.real_world_confirmations enable row level security;
alter table public.audit_log                enable row level security;

-- profiles: a user may READ their own row (even if suspended, so the app can explain why).
-- Nobody but an admin may change anything; there is NO insert/delete policy (service role only).
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());
create policy profiles_update_admin on public.profiles for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- content: learners read published rows only; admins read and write everything.
create policy modules_read on public.modules for select to authenticated
  using ((published and public.is_active_user()) or public.is_admin());
create policy modules_write on public.modules for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy lessons_read on public.lessons for select to authenticated
  using ((published and public.is_active_user()) or public.is_admin());
create policy lessons_write on public.lessons for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy lesson_versions_read on public.lesson_versions for select to authenticated
  using ((published and public.is_active_user()) or public.is_admin());
create policy lesson_versions_write on public.lesson_versions for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy lesson_translations_read on public.lesson_translations for select to authenticated
  using (public.is_admin() or (public.is_active_user() and exists (
    select 1 from public.lesson_versions v
    where v.lesson_slug = lesson_translations.lesson_slug and v.version = lesson_translations.version and v.published)));
create policy lesson_translations_write on public.lesson_translations for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- checkpoints: temporary simulation snapshots, fully owned by the learner (while active).
create policy checkpoints_own on public.lesson_checkpoints for all to authenticated
  using (user_id = auth.uid() and public.is_active_user())
  with check (user_id = auth.uid() and public.is_active_user());

-- authoritative progress: readable by the owner / admins, writable ONLY through complete_lesson().
create policy progress_read on public.lesson_progress for select to authenticated
  using ((user_id = auth.uid() and public.is_active_user()) or public.is_admin());
create policy task_completions_read on public.task_completions for select to authenticated
  using ((user_id = auth.uid() and public.is_active_user()) or public.is_admin());
create policy competencies_read on public.competencies for select to authenticated
  using ((user_id = auth.uid() and public.is_active_user()) or public.is_admin());

create policy assessments_read on public.assessment_attempts for select to authenticated
  using ((user_id = auth.uid() and public.is_active_user()) or public.is_admin());
create policy assessments_insert on public.assessment_attempts for insert to authenticated
  with check (user_id = auth.uid() and public.is_active_user());

create policy realworld_read on public.real_world_confirmations for select to authenticated
  using ((user_id = auth.uid() and public.is_active_user()) or public.is_admin());
create policy realworld_upsert on public.real_world_confirmations for insert to authenticated
  with check (user_id = auth.uid() and public.is_active_user());
create policy realworld_update on public.real_world_confirmations for update to authenticated
  using (user_id = auth.uid() and public.is_active_user()) with check (user_id = auth.uid() and public.is_active_user());

create policy audit_read on public.audit_log for select to authenticated using (public.is_admin());

-- Table privileges: least privilege on top of RLS.
revoke all on all tables in schema public from anon, authenticated;
grant select on public.profiles, public.modules, public.lessons, public.lesson_versions, public.lesson_translations,
  public.lesson_progress, public.task_completions, public.competencies, public.audit_log to authenticated;
grant update on public.profiles to authenticated;  -- still gated by the admin-only policy
grant insert, update, delete on public.modules, public.lessons, public.lesson_versions, public.lesson_translations to authenticated; -- admin policy
grant select, insert, update, delete on public.lesson_checkpoints to authenticated;
grant select, insert on public.assessment_attempts to authenticated;
grant select, insert, update on public.real_world_confirmations to authenticated;

-- ---- complete_lesson ---------------------------------------------------------------------
-- The browser cannot mark a lesson complete by writing a row. It calls this function, which checks
-- that the reported steps are EXACTLY the published step list, in order. (The server cannot observe
-- clicks inside the simulator; this validates the claim against the published definition, and
-- records it with a server timestamp.)
create or replace function public.complete_lesson(
  p_lesson_slug text, p_version int, p_completed_steps jsonb, p_hints_used int default 0, p_mistakes int default 0
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v public.lesson_versions%rowtype;
  uid uuid := auth.uid();
  c text;
  s text;
begin
  if uid is null or not public.is_active_user() then
    raise exception 'access_denied' using errcode = '42501';
  end if;
  select * into v from public.lesson_versions
   where lesson_slug = p_lesson_slug and version = p_version and published;
  if not found then raise exception 'unknown_or_unpublished_lesson' using errcode = 'P0002'; end if;
  if jsonb_typeof(p_completed_steps) <> 'array' or p_completed_steps <> to_jsonb(v.step_ids) then
    raise exception 'steps_do_not_match_published_lesson' using errcode = '22023';
  end if;
  if exists (select 1 from public.lessons l where l.slug = p_lesson_slug and l.prerequisite_slug is not null
             and not exists (select 1 from public.lesson_progress lp where lp.user_id = uid and lp.lesson_slug = l.prerequisite_slug)) then
    raise exception 'prerequisite_not_completed' using errcode = '55000';
  end if;

  insert into public.lesson_progress (user_id, lesson_slug, lesson_version, completed_steps, hints_used, mistakes)
  values (uid, p_lesson_slug, p_version, v.step_ids, greatest(coalesce(p_hints_used, 0), 0), greatest(coalesce(p_mistakes, 0), 0))
  on conflict (user_id, lesson_slug) do update
    set lesson_version = excluded.lesson_version, completed_steps = excluded.completed_steps,
        hints_used = excluded.hints_used, mistakes = excluded.mistakes, completed_at = now();

  foreach s in array v.step_ids loop
    insert into public.task_completions (user_id, lesson_slug, lesson_version, step_id)
    values (uid, p_lesson_slug, p_version, s) on conflict (user_id, lesson_slug, step_id) do nothing;
  end loop;
  foreach c in array v.competencies loop
    insert into public.competencies (user_id, competency_key, lesson_slug)
    values (uid, c, p_lesson_slug) on conflict (user_id, competency_key) do nothing;
  end loop;
  return jsonb_build_object('ok', true, 'competencies', to_jsonb(v.competencies));
end $$;

-- ---- clear_must_change_password -------------------------------------------------------------
-- Only succeeds if the auth password really changed AFTER the admin issued the temporary one
-- (auth.users.updated_at moves when the password is updated).
create or replace function public.clear_must_change_password() returns void
language plpgsql security definer set search_path = public, auth as $$
declare uid uuid := auth.uid(); reset_at timestamptz; changed_at timestamptz;
begin
  if uid is null then raise exception 'access_denied' using errcode = '42501'; end if;
  select password_reset_at into reset_at from public.profiles where id = uid;
  select updated_at into changed_at from auth.users where id = uid;
  if reset_at is not null and (changed_at is null or changed_at <= reset_at) then
    raise exception 'password_not_changed' using errcode = '55000';
  end if;
  update public.profiles set must_change_password = false where id = uid;
end $$;

revoke all on function public.complete_lesson(text, int, jsonb, int, int) from public, anon;
revoke all on function public.clear_must_change_password() from public, anon;
grant execute on function public.complete_lesson(text, int, jsonb, int, int) to authenticated;
grant execute on function public.clear_must_change_password() to authenticated;
revoke all on function public.is_active_user(), public.is_admin() from public, anon;
grant execute on function public.is_active_user(), public.is_admin() to authenticated;
