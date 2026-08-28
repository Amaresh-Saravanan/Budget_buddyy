import { ImapFlow } from 'imapflow'
import { simpleParser } from 'mailparser'
import { db } from '../config/db.js'
import { expenses, incomes, syncedEmails, emailConnections } from '../models/schema.js'
import { eq } from 'drizzle-orm'

const BANK_ALERT_SENDER = process.env.BANK_ALERT_SENDER || 'alerts@axis.bank.in'
const GMAIL_FORWARDING_SENDER = 'forwarding-noreply@google.com'
const LOOKBACK_DAYS = 3

// Keyword -> category mapping, checked against the merchant/payee name pulled
// from the bank's "Transaction Info" line (e.g. "UPI/P2M/<ref>/SWIGGY")
const CATEGORY_KEYWORDS = {
  Food: ['swiggy', 'zomato', 'dominos', 'pizza', 'restaurant', 'cafe', 'starbucks', 'mcdonald', 'kfc', 'food'],
  Transport: ['uber', 'ola', 'rapido', 'metro', 'irctc', 'petrol', 'fuel', 'fastag', 'redbus'],
  Shopping: ['amazon', 'flipkart', 'myntra', 'ajio', 'meesho', 'nykaa'],
  Entertainment: ['netflix', 'hotstar', 'spotify', 'bookmyshow', 'prime video', 'sonyliv'],
  Bills: ['electricity', 'recharge', 'broadband', 'airtel', 'jio', 'vodafone', 'gas authority', 'wifi'],
  Health: ['pharmacy', 'apollo', 'hospital', 'medplus', 'medicine', 'clinic']
}

function guessCategory(name) {
  const lower = (name || '').toLowerCase()
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) return category
  }
  return 'Other'
}

// Parses the specific transactional-alert format Axis Bank sends. Each bank
// tends to use its own template, so add a sibling parser + sender match here
// if you need to support another bank later.
function parseAxisBankEmail(body) {
  const amountMatch = body.match(/Amount\s+(Debited|Credited):\s*\n*\s*INR\s*([\d,]+\.\d{2})/i)
  if (!amountMatch) return null

  const type = amountMatch[1].toLowerCase() === 'debited' ? 'debit' : 'credit'
  const amount = parseFloat(amountMatch[2].replace(/,/g, ''))

  const dateMatch = body.match(/Date\s*&\s*Time:\s*\n*\s*(\d{2})-(\d{2})-(\d{2}),\s*(\d{2}:\d{2}:\d{2})/i)
  let date = new Date()
  if (dateMatch) {
    const [, dd, mm, yy, time] = dateMatch
    const parsedDate = new Date(`20${yy}-${mm}-${dd}T${time}+05:30`)
    if (!isNaN(parsedDate.getTime())) date = parsedDate
  }

  const infoMatch = body.match(/Transaction Info:\s*\n+\s*([^\n]+)/i)
  const rawInfo = infoMatch ? infoMatch[1].trim() : ''
  const infoParts = rawInfo.split('/').map((p) => p.trim()).filter(Boolean)
  const name = infoParts[3] || 'Unknown'

  return { type, amount, date, name, rawInfo }
}

// ==================== Multi-tenant attribution ====================
//
// BudgetBuddy owns one dedicated inbox (GMAIL_IMAP_USER — must be a mailbox
// created for the app, never a personal one, since every user's forwarded
// bank alerts land here). Each user gets a unique Gmail "plus address" —
// base+<token>@gmail.com — and forwards their bank's alert emails there via
// a Gmail filter. Gmail delivers everything to the one inbox, but the
// +token survives in the raw message (Delivered-To header, forwarding
// wrapper, etc.), which is how we work out whose transaction it is.
//
// This is the one part of the pipeline specific to "Gmail inbox + IMAP
// polling" as the transport. If this ever moves to a real inbound-email
// provider (Mailgun, Cloudflare Email Routing) on a real domain, only
// buildSyncAddress() and getIngestAddressParts() change — parsing and
// attribution (handleTransactionEmail / handleConfirmationEmail) stay the
// same, since they only need a normalized {subject, text, rawSource}.

function getIngestAddressParts() {
  const imapUser = process.env.GMAIL_IMAP_USER || ''
  const [local, domain] = imapUser.split('@')
  return { local, domain }
}

export function buildSyncAddress(token) {
  const { local, domain } = getIngestAddressParts()
  if (!local || !domain) return null
  return `${local}+${token}@${domain}`
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Scans the raw MIME source (headers + body) for our own plus-address
// pattern rather than trying to guess which specific header Gmail's
// automatic forwarding preserves — more robust to forwarding-header
// behavior we can't verify without a live test against a real Gmail
// filter forward.
// Exported for the data-isolation test — this is the one function that
// decides which user a forwarded email's transaction gets attributed to,
// so it's the function that actually needs to be proven correct.
export function extractSyncToken(rawSource) {
  const { local, domain } = getIngestAddressParts()
  if (!local || !domain) return null

  // The lookbehind rules out a match that's merely a substring of a longer,
  // different local part (e.g. "evilbudgetbuddy.ingest+x@gmail.com" or
  // "budgetbuddy.ingestwrong+x@gmail.com") — without it, anything that
  // happened to contain our address as a substring could spoof a token.
  const pattern = new RegExp(
    `(?<![a-zA-Z0-9.])${escapeRegex(local)}\\+([a-zA-Z0-9]{4,32})@${escapeRegex(domain)}(?![a-zA-Z0-9.])`,
    'i'
  )
  const match = String(rawSource).match(pattern)
  return match ? match[1] : null
}

async function findConnectionByToken(token) {
  if (!token) return null
  const result = await db.select().from(emailConnections).where(eq(emailConnections.syncToken, token)).limit(1)
  return result[0] || null
}

function isGmailForwardingConfirmation(parsedEmail) {
  const from = (parsedEmail.from?.value?.[0]?.address || '').toLowerCase()
  const subject = (parsedEmail.subject || '').toLowerCase()
  return from === GMAIL_FORWARDING_SENDER || subject.includes('forwarding confirmation')
}

// Best-effort: we don't have a real sample of Gmail's forwarding-confirmation
// email to verify the exact format against, so this tries a couple of
// reasonable patterns and falls back to storing the raw body — the setup UI
// shows that raw text to the user if automatic extraction comes up empty,
// rather than silently failing.
function extractConfirmationCode(text) {
  if (!text) return null
  const labeled = text.match(/confirmation code[:\s]+([a-z0-9]{4,40})/i)
  if (labeled) return labeled[1]
  const longToken = text.match(/\b([a-z0-9]{20,40})\b/i)
  if (longToken) return longToken[1]
  return null
}

async function handleConfirmationEmail(parsedEmail, rawSource) {
  const token = extractSyncToken(rawSource)
  const connection = await findConnectionByToken(token)
  if (!connection) return

  const text = parsedEmail.text || ''
  const code = extractConfirmationCode(text)

  await db.update(emailConnections)
    .set({
      confirmationCode: code,
      confirmationRawText: text.slice(0, 4000),
      status: connection.status === 'pending' ? 'code_ready' : connection.status,
      updatedAt: new Date()
    })
    .where(eq(emailConnections.id, connection.id))
}

async function handleTransactionEmail(parsedEmail, rawSource, messageId) {
  const token = extractSyncToken(rawSource)
  const connection = await findConnectionByToken(token)
  if (!connection) return false // can't attribute to a real user -> never guess, just skip

  const txn = parseAxisBankEmail(parsedEmail.text || '')
  if (!txn) return false

  const userId = connection.userId

  if (txn.type === 'debit') {
    await db.insert(expenses).values({
      userId,
      amount: txn.amount,
      category: guessCategory(txn.name),
      description: txn.name,
      note: `Auto-imported from bank email: ${txn.rawInfo}`,
      date: txn.date,
      tags: ['auto-imported']
    })
  } else {
    await db.insert(incomes).values({
      userId,
      amount: txn.amount,
      source: txn.name,
      category: 'Transfer',
      note: `Auto-imported from bank email: ${txn.rawInfo}`,
      date: txn.date
    })
  }

  await db.insert(syncedEmails).values({ messageId, userId, type: txn.type, amount: txn.amount })

  await db.update(emailConnections)
    .set({ status: 'active', lastSyncedAt: new Date(), updatedAt: new Date() })
    .where(eq(emailConnections.id, connection.id))

  return true
}

export async function syncBankEmails() {
  const imapUser = process.env.GMAIL_IMAP_USER
  const imapPass = process.env.GMAIL_IMAP_APP_PASSWORD

  if (!imapUser || !imapPass) {
    return { synced: 0, skipped: true, reason: 'GMAIL_IMAP_USER/GMAIL_IMAP_APP_PASSWORD not configured' }
  }

  const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: { user: imapUser, pass: imapPass },
    logger: false
  })

  let syncedCount = 0

  await client.connect()
  try {
    const lock = await client.getMailboxLock('INBOX')
    try {
      // No sender filter here — this inbox only ever receives forwarded bank
      // alerts and Gmail's own system mail, and dispatch below routes each
      // message by content. Keeps adding a new bank's sender address a
      // one-line change to BANK_ALERT_SENDER-style constants, not a query change.
      const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000)
      const uids = await client.search({ since })

      for (const uid of uids || []) {
        const message = await client.fetchOne(uid, { source: true })
        if (!message?.source) continue

        const rawSource = message.source.toString('utf8')
        const parsed = await simpleParser(message.source)
        const messageId = parsed.messageId
        if (!messageId) continue

        const existing = await db.select().from(syncedEmails).where(eq(syncedEmails.messageId, messageId)).limit(1)
        if (existing.length > 0) continue

        if (isGmailForwardingConfirmation(parsed)) {
          await handleConfirmationEmail(parsed, rawSource)
          continue
        }

        const fromAddress = (parsed.from?.value?.[0]?.address || '').toLowerCase()
        if (fromAddress !== BANK_ALERT_SENDER.toLowerCase()) continue

        const inserted = await handleTransactionEmail(parsed, rawSource, messageId)
        if (inserted) syncedCount++
      }
    } finally {
      lock.release()
    }
  } finally {
    await client.logout()
  }

  return { synced: syncedCount, skipped: false }
}

export default { syncBankEmails, buildSyncAddress, extractSyncToken }
