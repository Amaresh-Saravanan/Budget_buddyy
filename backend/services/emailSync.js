import { ImapFlow } from 'imapflow'
import { simpleParser } from 'mailparser'
import { db } from '../config/db.js'
import { expenses, incomes, syncedEmails, users } from '../models/schema.js'
import { eq } from 'drizzle-orm'

const BANK_ALERT_SENDER = process.env.BANK_ALERT_SENDER || 'alerts@axis.bank.in'
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

// Personal-use app: there's exactly one BudgetBuddy user, so default to
// whoever has logged in at least once, unless SYNC_USER_ID pins it explicitly.
async function getSyncUserId() {
  if (process.env.SYNC_USER_ID) return process.env.SYNC_USER_ID
  const result = await db.select().from(users).limit(1)
  return result[0]?.clerkId || null
}

export async function syncBankEmails() {
  const imapUser = process.env.GMAIL_IMAP_USER
  const imapPass = process.env.GMAIL_IMAP_APP_PASSWORD

  if (!imapUser || !imapPass) {
    return { synced: 0, skipped: true, reason: 'GMAIL_IMAP_USER/GMAIL_IMAP_APP_PASSWORD not configured' }
  }

  const userId = await getSyncUserId()
  if (!userId) {
    return { synced: 0, skipped: true, reason: 'No BudgetBuddy user found yet — log in once first' }
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
      const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000)
      const uids = await client.search({ from: BANK_ALERT_SENDER, since })

      for (const uid of uids || []) {
        const message = await client.fetchOne(uid, { source: true })
        if (!message?.source) continue

        const parsed = await simpleParser(message.source)
        const messageId = parsed.messageId
        if (!messageId) continue

        const existing = await db.select().from(syncedEmails).where(eq(syncedEmails.messageId, messageId)).limit(1)
        if (existing.length > 0) continue

        const txn = parseAxisBankEmail(parsed.text || '')
        if (!txn) continue

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

        await db.insert(syncedEmails).values({
          messageId,
          userId,
          type: txn.type,
          amount: txn.amount
        })

        syncedCount++
      }
    } finally {
      lock.release()
    }
  } finally {
    await client.logout()
  }

  return { synced: syncedCount, skipped: false }
}

export default { syncBankEmails }
