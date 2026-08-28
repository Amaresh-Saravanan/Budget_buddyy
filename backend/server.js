import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { testConnection } from './config/db.js'
import { syncBankEmails } from './services/emailSync.js'

// Route imports
import authRoutes from './routes/authRoutes.js'
import expenseRoutes from './routes/expenseRoutes.js'
import savingRoutes from './routes/savingRoutes.js'
import reminderRoutes from './routes/reminderRoutes.js'
import incomeRoutes from './routes/incomeRoutes.js'
import syncRoutes from './routes/syncRoutes.js'
import emailConnectionRoutes from './routes/emailConnectionRoutes.js'

// Load env vars
dotenv.config()

// Fail fast on missing configuration rather than starting up and then
// erroring on the first request — a deploy that boots and then 500s on
// everything is much harder to diagnose than one that refuses to start.
const REQUIRED_ENV = ['DATABASE_URL', 'CLERK_SECRET_KEY']
const missing = REQUIRED_ENV.filter((key) => !process.env[key])
if (missing.length > 0) {
  console.error(`\n❌ Missing required environment variable(s): ${missing.join(', ')}`)
  console.error('   Set them in backend/.env locally, or in your host\'s environment settings.\n')
  process.exit(1)
}

// Not fatal, but each one silently disables a feature, so say so at boot.
const OPTIONAL_ENV = {
  GMAIL_IMAP_USER: 'bank-email sync is disabled',
  GMAIL_IMAP_APP_PASSWORD: 'bank-email sync is disabled',
  SYNC_CRON_SECRET: 'the scheduled-sync endpoint will refuse requests',
  FRONTEND_URL: 'only localhost origins are allowed through CORS'
}
for (const [key, consequence] of Object.entries(OPTIONAL_ENV)) {
  if (!process.env[key]) console.warn(`⚠️  ${key} is not set — ${consequence}`)
}

// Test database connection
testConnection()

const app = express()

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  // Capacitor mobile app: the webview serves the bundle from these origins
  'https://localhost',
  'capacitor://localhost',
  process.env.FRONTEND_URL
].filter(Boolean)

// In development, also accept private-LAN origins so you can open the app on a
// phone on the same Wi-Fi (e.g. http://192.168.1.5:5173) without hardcoding an
// IP that changes with DHCP. Never enabled in production.
const PRIVATE_LAN_ORIGIN = /^https?:\/\/(?:192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(?::\d+)?$/

app.use(cors({
  origin: (origin, callback) => {
    // Requests with no Origin header (curl, native HTTP clients) are not
    // subject to the browser same-origin policy, so there's nothing to block.
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) return callback(null, true)
    if (process.env.NODE_ENV !== 'production' && PRIVATE_LAN_ORIGIN.test(origin)) {
      return callback(null, true)
    }
    return callback(new Error(`Not allowed by CORS: ${origin}`))
  },
  credentials: true
}))

// Body parser (except for webhook route which needs raw body)
app.use((req, res, next) => {
  if (req.originalUrl === '/api/auth/webhook') {
    next()
  } else {
    express.json()(req, res, next)
  }
})

// Liveness: is the process up? Deliberately cheap — a hosting platform may
// poll this frequently, and it must not depend on the database.
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  })
})

// Readiness: can the app actually serve requests? Hits the database, so use
// this for a deploy gate, not for a frequent poll.
app.get('/api/health/ready', async (req, res) => {
  const dbOk = await testConnection()
  if (!dbOk) {
    return res.status(503).json({ status: 'unavailable', database: 'unreachable' })
  }
  res.json({ status: 'ready', database: 'ok', timestamp: new Date().toISOString() })
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/expenses', expenseRoutes)
app.use('/api/savings', savingRoutes)
app.use('/api/reminders', reminderRoutes)
app.use('/api/income', incomeRoutes)
app.use('/api/sync', syncRoutes)
app.use('/api/email-connection', emailConnectionRoutes)

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err)
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  })
})

// Automatic bank-email sync (runs shortly after startup, then on a fixed interval).
// GMAIL_IMAP_USER/GMAIL_IMAP_APP_PASSWORD must point at a mailbox dedicated
// to BudgetBuddy — every user's forwarded bank alerts land in this one inbox,
// attributed to the right person via their unique +token address (see
// services/emailSync.js). Never point this at a personal Gmail account once
// more than one person uses the app.
const EMAIL_SYNC_INTERVAL_MINUTES = parseInt(process.env.EMAIL_SYNC_INTERVAL_MINUTES || '15', 10)

const runEmailSync = async () => {
  try {
    const result = await syncBankEmails()
    if (result.skipped) {
      console.log(`⏭  Email sync skipped: ${result.reason}`)
    } else if (result.synced > 0) {
      console.log(`📧 Email sync: imported ${result.synced} new transaction(s)`)
    }
  } catch (error) {
    console.error('❌ Email sync error:', error.message)
  }
}

// An in-process timer only runs while the process is awake, so it is not a
// dependable schedule on hosting that suspends idle instances — there,
// POST /api/sync/cron driven by an external scheduler is the real one.
// Set EMAIL_SYNC_INTERVAL_MINUTES=0 to turn this off and rely on that.
if (EMAIL_SYNC_INTERVAL_MINUTES > 0) {
  setTimeout(runEmailSync, 5000)
  setInterval(runEmailSync, EMAIL_SYNC_INTERVAL_MINUTES * 60 * 1000)
}

const PORT = process.env.PORT || 5000
// Bind all interfaces: container platforms route to the published port from
// outside the container, and a loopback-only bind is unreachable there.
const HOST = process.env.HOST || '0.0.0.0'

app.listen(PORT, HOST, () => {
  const mode = process.env.NODE_ENV || 'development'
  console.log(`\n  BudgetBuddy API — running on ${HOST}:${PORT} (${mode})`)

  if (mode === 'production') {
    const syncMode = EMAIL_SYNC_INTERVAL_MINUTES > 0
      ? `in-process every ${EMAIL_SYNC_INTERVAL_MINUTES}m (unreliable if this host suspends idle instances)`
      : 'external scheduler only, via POST /api/sync/cron'
    console.log(`  Email sync: ${syncMode}\n`)
    return
  }

  console.log(`
  Endpoints:
  - GET    /api/health                 - Liveness
  - GET    /api/health/ready           - Readiness (checks the database)
  - POST   /api/auth/sync              - Sync user from Clerk
  - GET    /api/auth/me                - Get current user
  - DELETE /api/auth/me                - Delete account and all its data
  - PUT    /api/auth/settings          - Update settings
  - GET    /api/expenses               - Get all expenses
  - POST   /api/expenses               - Create expense
  - DELETE /api/expenses/all           - Delete all expenses
  - GET    /api/expenses/stats         - Get expense stats
  - GET    /api/savings                - Get all savings
  - GET    /api/savings/goals          - Get saving goals
  - GET    /api/reminders              - Get all reminders
  - PUT    /api/reminders/:id/complete - Mark a bill paid or unpaid
  - GET    /api/income                 - Get all income entries
  - POST   /api/sync/gmail             - Trigger sync (signed-in user)
  - POST   /api/sync/cron              - Trigger sync (external scheduler)
  - GET    /api/email-connection       - Get/create your forwarding address
  - POST   /api/email-connection/check - Check for a confirmation code / transaction
  `)
})

export default app