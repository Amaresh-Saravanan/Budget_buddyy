import crypto from 'crypto'
import { syncBankEmails } from '../services/emailSync.js'

// Constant-time comparison so a wrong secret can't be discovered by timing
// how long the rejection takes. timingSafeEqual throws on length mismatch,
// so lengths are compared first — that leak (the secret's length) is not
// worth defending against and is unavoidable here.
function secretMatches(provided, expected) {
  if (typeof provided !== 'string' || typeof expected !== 'string') return false
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

// @desc    Manually trigger a bank-email sync
// @route   POST /api/sync/gmail
// @access  Private
export const triggerGmailSync = async (req, res) => {
  try {
    const result = await syncBankEmails()
    res.json({ success: true, data: result })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Sync failed',
      error: error.message
    })
  }
}

// @desc    Trigger a sync from an external scheduler.
//          Free hosting suspends idle instances, which stops any in-process
//          timer, so the schedule has to come from outside. A scheduled
//          request here both wakes the instance and runs the sync.
// @route   POST /api/sync/cron
// @access  Shared secret (SYNC_CRON_SECRET), not a user session
export const cronSync = async (req, res) => {
  const expected = process.env.SYNC_CRON_SECRET

  if (!expected) {
    // Refuse rather than running unauthenticated: this endpoint reads a
    // mailbox and writes to every user's ledger.
    return res.status(503).json({
      success: false,
      message: 'SYNC_CRON_SECRET is not configured on this server'
    })
  }

  const header = req.headers.authorization || ''
  const bearer = header.startsWith('Bearer ') ? header.slice(7) : null
  const provided = bearer || req.query.secret || req.body?.secret

  if (!secretMatches(provided, expected)) {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }

  try {
    const result = await syncBankEmails()
    res.json({ success: true, data: result })
  } catch (error) {
    console.error('Cron sync failed:', error.message)
    res.status(500).json({
      success: false,
      message: 'Sync failed',
      error: error.message
    })
  }
}

export default { triggerGmailSync, cronSync }
