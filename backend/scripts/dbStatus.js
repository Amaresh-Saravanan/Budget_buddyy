#!/usr/bin/env node
//
// Migration status tracker.
//
// Answers the question "what state is this database actually in?" by
// comparing the live database against the latest Drizzle snapshot:
//   - which expected tables exist, and which are missing
//   - which expected columns are missing from tables that DO exist
//     (migrations use CREATE TABLE IF NOT EXISTS, so an older table that
//     predates a column is skipped silently — this is what catches that)
//   - which migrations the database has recorded as applied
//
// Deliberately reports row COUNTS only, never row contents: this database
// holds other people's financial records, and a debug script that dumps
// them to a terminal is a liability, not a convenience.
//
// Usage: npm run db:status

import dotenv from 'dotenv'
dotenv.config()

import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { neon } from '@neondatabase/serverless'

const __dirname = dirname(fileURLToPath(import.meta.url))
const MIGRATIONS_DIR = join(__dirname, '..', 'migrations')
const META_DIR = join(MIGRATIONS_DIR, 'meta')

const green = (s) => `\x1b[32m${s}\x1b[0m`
const red = (s) => `\x1b[31m${s}\x1b[0m`
const yellow = (s) => `\x1b[33m${s}\x1b[0m`
const dim = (s) => `\x1b[2m${s}\x1b[0m`
const bold = (s) => `\x1b[1m${s}\x1b[0m`

function loadJournal() {
  try {
    return JSON.parse(readFileSync(join(META_DIR, '_journal.json'), 'utf8'))
  } catch {
    return null
  }
}

// The newest snapshot is the expected shape of the database once every
// generated migration has been applied.
function loadLatestSnapshot() {
  const snapshots = readdirSync(META_DIR)
    .filter((f) => f.endsWith('_snapshot.json'))
    .sort()
  if (snapshots.length === 0) return null
  const latest = snapshots[snapshots.length - 1]
  return JSON.parse(readFileSync(join(META_DIR, latest), 'utf8'))
}

function expectedTables(snapshot) {
  // Snapshot keys are schema-qualified ("public.users"); the table's own
  // `name` field is the bare name we compare against information_schema.
  return Object.values(snapshot.tables).map((table) => ({
    name: table.name,
    columns: Object.values(table.columns).map((c) => c.name)
  }))
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error(red('DATABASE_URL is not set. Add it to backend/.env first.'))
    process.exit(1)
  }

  const journal = loadJournal()
  const snapshot = loadLatestSnapshot()

  if (!snapshot) {
    console.error(red('No migration snapshot found. Run `npm run db:generate` first.'))
    process.exit(1)
  }

  const expected = expectedTables(snapshot)

  console.log(bold('\nBudgetBuddy database status\n'))

  console.log(bold('Migrations on disk'))
  if (!journal || journal.entries.length === 0) {
    console.log(`  ${yellow('none')} — run \`npm run db:generate\``)
  } else {
    for (const entry of journal.entries) {
      console.log(`  ${dim(String(entry.idx).padStart(4, '0'))}  ${entry.tag}`)
    }
  }

  const sql = neon(process.env.DATABASE_URL)

  let liveTables
  try {
    liveTables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `
  } catch (error) {
    console.error(`\n${red('Could not reach the database:')} ${error.message}`)
    console.error(dim('Check DATABASE_URL in backend/.env, and that the Neon project is awake.'))
    process.exit(1)
  }

  const liveTableNames = new Set(liveTables.map((r) => r.table_name))

  // Which generated migrations has this database actually run? Drizzle
  // records them in its own bookkeeping table, which won't exist yet if
  // the database has only ever been set up with `db:push`.
  console.log(`\n${bold('Migrations applied to this database')}`)
  try {
    const applied = await sql`
      SELECT hash, created_at
      FROM drizzle.__drizzle_migrations
      ORDER BY created_at
    `
    if (applied.length === 0) {
      console.log(`  ${yellow('none recorded')}`)
    } else {
      for (const row of applied) {
        console.log(`  ${green('applied')}  ${dim(new Date(Number(row.created_at)).toISOString())}`)
      }
    }
  } catch {
    console.log(`  ${yellow('no migration history')} ${dim('— this database predates migrations (set up with db:push)')}`)
  }

  console.log(`\n${bold('Tables')}`)
  const missingTables = []
  const driftedTables = []

  for (const table of expected) {
    if (!liveTableNames.has(table.name)) {
      missingTables.push(table.name)
      console.log(`  ${red('missing')}  ${table.name}`)
      continue
    }

    const liveColumns = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = ${table.name}
    `
    const liveColumnNames = new Set(liveColumns.map((r) => r.column_name))
    const missingColumns = table.columns.filter((c) => !liveColumnNames.has(c))

    const countResult = await sql(`SELECT COUNT(*)::int AS count FROM "${table.name}"`)
    const rowCount = countResult[0]?.count ?? 0

    if (missingColumns.length > 0) {
      driftedTables.push({ table: table.name, missingColumns })
      console.log(`  ${yellow('drifted')}  ${table.name} ${dim(`(${rowCount} rows)`)}`)
      console.log(`            ${yellow('missing columns:')} ${missingColumns.join(', ')}`)
    } else {
      console.log(`  ${green('ok')}       ${table.name} ${dim(`(${rowCount} rows)`)}`)
    }
  }

  console.log(`\n${bold('Summary')}`)
  if (missingTables.length === 0 && driftedTables.length === 0) {
    console.log(`  ${green('Database matches the schema.')}\n`)
    return
  }

  if (missingTables.length > 0) {
    console.log(`  ${red(`${missingTables.length} table(s) missing:`)} ${missingTables.join(', ')}`)
    console.log(`  ${dim('Fix: npm run db:migrate')}`)
  }
  if (driftedTables.length > 0) {
    console.log(`  ${yellow(`${driftedTables.length} table(s) missing columns.`)}`)
    console.log(`  ${dim('Migrations use CREATE TABLE IF NOT EXISTS, so they will NOT add columns to')}`)
    console.log(`  ${dim('a table that already exists. Fix with: npm run db:push')}`)
  }
  console.log('')
}

main().catch((error) => {
  console.error(red(`\nUnexpected error: ${error.message}`))
  process.exit(1)
})
