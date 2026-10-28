# Raqamli Dunyo — story-driven computer academy

React + Vite + Supabase. Learners practise inside a simulated computer; every step validates the *actual simulation state*.
UI and lessons: **uz (default) / ru / en**, light + dark themes.

## What is implemented (and verified)

| Area | Status |
|---|---|
| Virtual desktop: icons, windows (move/min/max/restore/close), taskbar, Start menu, context menus | implemented, browser-tested |
| Virtual filesystem: create/rename/copy/cut/paste/delete/restore/search, Recycle Bin, name validation | implemented, unit-tested |
| Notepad with real save into the simulated filesystem | implemented |
| Guided engine: state machine, declarative steps, validation, hints, recovery, pause, restart, checkpoints, duplicate-event protection | implemented, unit-tested |
| Chapter 1 *Yangi ish stoli* (13 steps) and Chapter 2 *Fayllar va tartib* (18 steps), full uz/ru/en copy | implemented, played end-to-end in Chromium |
| Auth (Supabase), protected routes, suspension/expiry, forced password change, admin user management | implemented; **Supabase side tested only against a local PGlite Postgres, not a live project** |
| SQL migrations + RLS + `complete_lesson` server validation | implemented, 19 RLS tests on real migrations |
| Edge Function `admin-users` (service-role key stays server-side) | implemented, **not executed** (needs a Supabase project) |

## Not yet built (honest list)
Chapters 3–9 (keyboard, internet, documents, Word/Excel/PowerPoint simulators, settings, software, independent missions),
the lesson **authoring UI** (lessons are versioned in code; DB tables for translations/versions exist), Start-menu search app,
real-world practice confirmation UI (table exists), Alt+Tab/shortcut-recognition lesson. Real-device practice notes are shown after each chapter.

## Run locally
```bash
npm install
cp .env.example .env.local      # fill VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev
```
No Supabase yet? Preview with the **dev-only demo mode**: set `VITE_DEV_DEMO=true` in `.env.local`. It is compiled out of production builds,
shows a banner, skips authentication and stores progress in the browser only. It is not a production auth path.

## Supabase setup
1. Create a project. In SQL editor (or `supabase db push`) apply `supabase/migrations/0001..0003` in order.
2. `0003_seed_lessons.sql` is generated from the code: after changing a lesson's steps run `npm run gen:seed` and add a **new version** (bump `version`), never edit a published one.
3. Deploy the function: `supabase functions deploy admin-users` and `supabase secrets set ALLOWED_ORIGIN=https://your-site`.
   (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` are injected automatically; the service-role key is never put in `VITE_*`.)
4. Create the **first admin** manually (there is no public signup): Auth → Users → Add user, then in SQL:
   ```sql
   insert into public.profiles (id, email, full_name, role) select id, email, 'Admin', 'admin' from auth.users where email = 'you@example.com';
   ```
   After that, create learners from the in-app **Administrator panel** (temporary password, optional expiry; the learner must change it on first sign-in).
5. Auth settings: disable "Allow new users to sign up".

## Deploy (Vercel)
Framework: Vite · Build `npm run build` · Output `dist` · env vars `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. `vercel.json` handles SPA routing and security headers.

## Tests
```bash
npm test          # 61 unit/integration tests (engine, filesystem, locales parity, guards, theme contrast, RLS on real migrations via PGlite)
npm run dev &     # with VITE_DEV_DEMO=true
npm run e2e       # real-browser playthrough of chapters 1 and 2 (needs Playwright + Chromium)
```

## Architecture
```
src/sim/        pure reducer + immutable filesystem + declarative conditions; sim/ui = React rendering of the computer
src/engine/     guide state machine + lesson validation + checkpoints (no React/DOM — testable alone)
src/lessons/    language-independent definitions (stable ids) + separate uz/ru/en copy per lesson
src/i18n/       UI strings (key parity enforced by test)
src/auth/       Supabase session, access state, route guards
src/lib/        supabase client, progress service (server-authoritative completion; local+remote checkpoints)
supabase/       migrations, RLS tests, admin Edge Function
```
Key rules enforced by design: a step completes only when the matching action is dispatched **and** the resulting state satisfies its `check`;
"Continue" works only on explanation steps; hints never mutate the simulation; each event has a sequence number so duplicates are ignored;
a checkpoint from another lesson version is discarded, not migrated; changing language/theme never touches simulation or guide state.

## Security notes
- Learners cannot write `lesson_progress`, `task_completions` or `competencies`; completion goes through `complete_lesson()`, which checks the reported steps equal the published ordered step list and enforces prerequisites. The server cannot observe clicks inside the simulator, so this validates the claim against the published definition — it is not proof of interaction.
- Profiles are admin-writable only; suspension and expiry are enforced in RLS (`is_active_user()`), not just in the UI.
- `clear_must_change_password()` succeeds only if the auth password actually changed after the temporary one was issued.
- Lesson data contains no executable code; only a fixed set of action types and condition kinds is accepted (`validateLesson`).

## Known limitations
Lesson file names (e.g. `Loyiha`, `Hisobot.txt`) are fixed Uzbek strings in all languages. Mobile uses a compact layout (windows full-screen) but chapters that teach keyboard shortcuts are best done on a computer.
