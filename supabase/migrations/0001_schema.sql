-- Raqamli Dunyo — core schema.
-- AUTHORITATIVE (server-owned): profiles, lesson_progress, task_completions, competencies, audit_log, content tables.
-- TEMPORARY (learner-owned):    lesson_checkpoints (simulation snapshots; may be overwritten or discarded at any time).

create table public.profiles (
  id                   uuid primary key references auth.users (id) on delete cascade,
  email                text not null,
  full_name            text not null default '' check (char_length(full_name) <= 120),
  role                 text not null default 'learner' check (role in ('learner', 'admin')),
  status               text not null default 'active'  check (status in ('active', 'suspended')),
  access_expires_at    timestamptz,
  must_change_password boolean not null default false,
  password_reset_at    timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index profiles_role_status_idx on public.profiles (role, status);

-- ---- content ---------------------------------------------------------------------------
create table public.modules (
  slug      text primary key check (slug ~ '^[a-z0-9-]+$'),
  position  int  not null unique,
  published boolean not null default false
);

create table public.lessons (
  slug              text primary key check (slug ~ '^[a-z0-9-]+$'),
  module_slug       text not null references public.modules (slug) on delete restrict,
  position          int  not null,
  prerequisite_slug text references public.lessons (slug),
  published         boolean not null default false,
  unique (module_slug, position)
);

-- Each published version is immutable in meaning: a checkpoint stores the version it was made with,
-- and is discarded (not "migrated") when versions differ.
create table public.lesson_versions (
  lesson_slug text not null references public.lessons (slug) on delete cascade,
  version     int  not null check (version > 0),
  step_ids    text[] not null check (cardinality(step_ids) > 0),
  competencies text[] not null default '{}',
  published   boolean not null default false,
  created_at  timestamptz not null default now(),
  primary key (lesson_slug, version)
);

create table public.lesson_translations (
  lesson_slug text not null,
  version     int  not null,
  lang        text not null check (lang in ('uz', 'ru', 'en')),
  content     jsonb not null,
  primary key (lesson_slug, version, lang),
  foreign key (lesson_slug, version) references public.lesson_versions (lesson_slug, version) on delete cascade
);

-- ---- learner data --------------------------------------------------------------------------
create table public.lesson_checkpoints (
  user_id        uuid not null references auth.users (id) on delete cascade,
  lesson_slug    text not null references public.lessons (slug) on delete cascade,
  lesson_version int  not null,
  checkpoint     jsonb not null check (pg_column_size(checkpoint) < 262144),
  updated_at     timestamptz not null default now(),
  primary key (user_id, lesson_slug)
);

create table public.lesson_progress (
  user_id         uuid not null references auth.users (id) on delete cascade,
  lesson_slug     text not null references public.lessons (slug) on delete cascade,
  lesson_version  int  not null,
  status          text not null default 'completed' check (status = 'completed'),
  completed_steps text[] not null,
  hints_used      int  not null default 0 check (hints_used >= 0),
  mistakes        int  not null default 0 check (mistakes >= 0),
  completed_at    timestamptz not null default now(),
  primary key (user_id, lesson_slug)
);

create table public.task_completions (
  id             bigint generated always as identity primary key,
  user_id        uuid not null references auth.users (id) on delete cascade,
  lesson_slug    text not null,
  lesson_version int  not null,
  step_id        text not null,
  completed_at   timestamptz not null default now(),
  unique (user_id, lesson_slug, step_id)
);
create index task_completions_user_idx on public.task_completions (user_id);

create table public.competencies (
  user_id        uuid not null references auth.users (id) on delete cascade,
  competency_key text not null,
  lesson_slug    text not null,
  demonstrated_at timestamptz not null default now(),
  primary key (user_id, competency_key)
);

create table public.assessment_attempts (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  lesson_slug text not null,
  kind        text not null,
  answers     jsonb not null default '{}'::jsonb check (pg_column_size(answers) < 65536),
  passed      boolean not null,
  created_at  timestamptz not null default now()
);
create index assessment_attempts_user_idx on public.assessment_attempts (user_id, lesson_slug);

-- "I did this on my real computer" — a self-report, never presented as observed by the site.
create table public.real_world_confirmations (
  user_id      uuid not null references auth.users (id) on delete cascade,
  practice_key text not null,
  answer       text not null default '' check (char_length(answer) <= 500),
  confirmed_at timestamptz not null default now(),
  primary key (user_id, practice_key)
);

create table public.audit_log (
  id             bigint generated always as identity primary key,
  actor_id       uuid references auth.users (id) on delete set null,
  action         text not null,
  target_user_id uuid references auth.users (id) on delete set null,
  details        jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now()
);
create index audit_log_created_idx on public.audit_log (created_at desc);
