import crypto from 'crypto'
import { db } from '../config/db.js'
import { emailConnections } from '../models/schema.js'
import { eq } from 'drizzle-orm'
import { syncBankEmails, buildSyncAddress } from '../services/emailSync.js'

function generateToken() {
  return crypto.randomBytes(6).toString('hex') // 12 hex chars
}

async function getOrCreateConnection(userId) {
  const existing = await db.select().from(emailConnections).where(eq(emailConnections.userId, userId)).limit(1)
  if (existing.length > 0) return existing[0]

  // Collision odds are astronomically low (48 bits of randomness), but the
  // token has a unique constraint, so retry rather than trust luck.
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const inserted = await db.insert(emailConnections)
        .values({ userId, syncToken: generateToken() })
        .returning()
      return inserted[0]
    } catch (error) {
      if (attempt === 4) throw error
    }
  }
}

function serializeConnection(connection) {
  const syncAddress = buildSyncAddress(connection.syncToken)
  return {
    syncAddress,
    status: connection.status,
    confirmationCode: connection.confirmationCode || null,
    confirmationRawText: connection.confirmationRawText || null,
    lastSyncedAt: connection.lastSyncedAt,
    ingestConfigured: Boolean(syncAddress)
  }
}

// @desc    Get (or create) the user's forwarding address + connection status
// @route   GET /api/email-connection
// @access  Private
export const getConnection = async (req, res) => {
  try {
    const connection = await getOrCreateConnection(req.userId)
    res.json({ success: true, data: serializeConnection(connection) })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    })
  }
}

// @desc    Trigger an immediate mailbox check (used while the user is on the
//          setup screen waiting for Gmail's confirmation code, or their
//          first forwarded transaction)
// @route   POST /api/email-connection/check
// @access  Private
export const checkNow = async (req, res) => {
  try {
    await syncBankEmails()
    const connection = await getOrCreateConnection(req.userId)
    res.json({ success: true, data: serializeConnection(connection) })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Sync check failed',
      error: error.message
    })
  }
}

export default { getConnection, checkNow }
