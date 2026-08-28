# Database migrations

Schema changes are tracked as versioned SQL files in this directory, generated
from `backend/models/schema.js`. Don't hand-write them, and don't edit one that
has already been applied to a database — add a new migration instead.

## Everyday workflow

```bash
# 1. Edit backend/models/schema.js
# 2. Generate a migration from the change
npm run db:generate

# 3. Review the generated SQL (always — read it before you run it)
# 4. Apply it
npm run db:migrate

# At any point, check what state a database is actually in
npm run db:status
```

## The commands

| Command | What it does |
|---|---|
| `npm run db:generate` | Writes a new migration by diffing `schema.js` against the last snapshot. Needs no database. |
| `npm run db:migrate` | Applies pending migrations and records them in the database. This is what production uses. |
| `npm run db:status` | Reports which migrations exist, which the database has applied, and any table or column the database is missing. Reports row counts only, never row contents. |
| `npm run db:push` | Syncs the schema directly with no migration file. Fast for local experiments; **never run it against a deployed database** — it leaves no record of what changed. |

## Adopting migrations on a database built with `db:push`

The first migration (`0000_…`) creates every table with
`CREATE TABLE IF NOT EXISTS`, so it is safe to run against a database that
already has some of them: existing tables are left alone and missing ones get
created.

The catch worth knowing: because it's `IF NOT EXISTS`, it will **not** add a
missing column to a table that already exists. If a table predates a column
that was later added via `db:push`, the migration silently skips it.

`npm run db:status` is what catches that — it compares every expected column
against the live database and reports drift explicitly. Run it after your
first `db:migrate`; if it reports drifted tables, a one-time `npm run db:push`
reconciles them, and migrations take over cleanly from there.

## Why not just keep using `db:push`

`push` compares your schema to the database and mutates it to match, with no
record of what it did. That's fine on a laptop. On a deployed database holding
other people's financial records, it means no review before a destructive
change, no history of what ran when, and no way to reproduce the same change
across environments. Migrations give all three.
