# Talentra Database

## Folder structure

```
supabase/
├── migrations/          ← the 14 canonical migrations, in order (history)
└── schema-complete.sql  ← flattened full schema (FRESH databases only)
```

## Which file do I use?

**Your live Supabase project is already up to date.** All 14 migrations in
`migrations/` have been applied. You do **not** need to run anything to keep it working.

### Setting up a brand-new database (staging, a teammate's clone, etc.)
Run `schema-complete.sql` once in the new project's SQL Editor. It recreates
every table, enum, function, trigger, RLS policy, and grant in one shot. This is
faster and less error-prone than replaying 14 migration files.

⚠️ **Never run `schema-complete.sql` on the live database.** It assumes an empty
schema; running it on a populated DB can conflict with existing enums and tables.

### Making a NEW schema change going forward
Add a new timestamped file to `migrations/` (e.g.
`20260601090000_my_change.sql`), run it on the live DB, then fold the same change
into `schema-complete.sql` so fresh setups stay in sync.

## Why 14 files instead of 3?
Migrations are append-only history — collapsing applied migrations into fewer
files would force a risky re-run on the live DB (enums with dependent columns
can't be cleanly dropped/recreated). Keeping the history intact and maintaining
one consolidated snapshot (`schema-complete.sql`) is the standard, safe approach.

## Schema at a glance (20 tables)
- **Core:** profiles, user_roles, companies, jobs, applications, saved_jobs
- **Moderation:** job_reports, contact_messages
- **Employment:** company_employees, reference_requests
- **Engagement:** job_alerts, notifications, application_status_history
- **Skills:** skills, skill_quiz_questions, user_skill_assessments, user_verified_skills
- **Social:** follows, posts, post_likes

## Enums
app_role, position_level, contract_type, qualification_level, job_status,
application_status, report_status, reference_status, follow_target_type
