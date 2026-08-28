// Data-isolation test for the multi-tenant email importer.
//
// This does NOT hit the database — it tests extractSyncToken() in
// isolation, which is the one function responsible for deciding which
// user a forwarded bank email gets attributed to. That's the actual
// isolation boundary: every downstream query is already scoped by
// req.userId (unchanged since before M2), so the new risk M2 introduces
// is specifically "can email A ever resolve to user B's token" — which is
// exactly what this proves it can't.
//
// Run with: node --test test/

import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { extractSyncToken } from '../services/emailSync.js'

const ORIGINAL_GMAIL_IMAP_USER = process.env.GMAIL_IMAP_USER

before(() => {
  process.env.GMAIL_IMAP_USER = 'budgetbuddy.ingest@gmail.com'
})

after(() => {
  process.env.GMAIL_IMAP_USER = ORIGINAL_GMAIL_IMAP_USER
})

function rawEmail({ deliveredTo, from = 'alerts@axis.bank.in', body = 'INR 100.00 was debited' }) {
  return [
    `Delivered-To: ${deliveredTo}`,
    `From: ${from}`,
    'Subject: Test transaction alert',
    '',
    body
  ].join('\r\n')
}

test('extracts the correct token for user A', () => {
  const source = rawEmail({ deliveredTo: 'budgetbuddy.ingest+userA123@gmail.com' })
  assert.equal(extractSyncToken(source), 'userA123')
})

test('extracts the correct token for user B, never user A\'s', () => {
  const source = rawEmail({ deliveredTo: 'budgetbuddy.ingest+userB456@gmail.com' })
  const token = extractSyncToken(source)
  assert.equal(token, 'userB456')
  assert.notEqual(token, 'userA123')
})

test('two different users\' emails never resolve to the same token', () => {
  const tokenA = extractSyncToken(rawEmail({ deliveredTo: 'budgetbuddy.ingest+alice001@gmail.com' }))
  const tokenB = extractSyncToken(rawEmail({ deliveredTo: 'budgetbuddy.ingest+bob002@gmail.com' }))
  assert.equal(tokenA, 'alice001')
  assert.equal(tokenB, 'bob002')
  assert.notEqual(tokenA, tokenB)
})

test('an email with no matching address attributes to nobody, not a guess', () => {
  const source = rawEmail({ deliveredTo: 'someone.else@gmail.com' })
  assert.equal(extractSyncToken(source), null)
})

test('a spoofed similar-looking local part does not match as a substring', () => {
  // Without the lookbehind/lookahead boundary this used to match as a
  // substring of "budgetbuddy.ingest+..." — verifying the fix holds.
  const evilPrefix = rawEmail({ deliveredTo: 'evilbudgetbuddy.ingest+stolen@gmail.com' })
  const evilSuffix = rawEmail({ deliveredTo: 'budgetbuddy.ingestwrong+stolen@gmail.com' })
  const evilDomain = rawEmail({ deliveredTo: 'budgetbuddy.ingest+stolen@gmail.company' })
  assert.equal(extractSyncToken(evilPrefix), null)
  assert.equal(extractSyncToken(evilSuffix), null)
  assert.equal(extractSyncToken(evilDomain), null)
})

test('the token is pulled from the raw source even if buried in a forwarding wrapper', () => {
  const source = [
    'Delivered-To: budgetbuddy.ingest+wrapped789@gmail.com',
    'Received: by 2002:a05 with SMTP id abc123',
    'X-Forwarded-For: original-bank-sender@axis.bank.in budgetbuddy.ingest+wrapped789@gmail.com',
    'From: alerts@axis.bank.in',
    'Subject: INR 250.00 was debited',
    '',
    '---------- Forwarded message ---------',
    'From: Axis Bank <alerts@axis.bank.in>',
    'Amount Debited: INR 250.00'
  ].join('\r\n')
  assert.equal(extractSyncToken(source), 'wrapped789')
})
