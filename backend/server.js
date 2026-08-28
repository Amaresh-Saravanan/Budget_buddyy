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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  })
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
const EMAIL_SYNC_INTERVAL_MS = (parseInt(process.env.EMAIL_SYNC_INTERVAL_MINUTES || '15', 10)) * 60 * 1000

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

setTimeout(runEmailSync, 5000)
setInterval(runEmailSync, EMAIL_SYNC_INTERVAL_MS)

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════════════════╗
  ║   BudgetBuddy API Server                           ║
  ╠════════════════════════════════════════════════════╣
  ║   Status:  Running                                 ║
  ║   Port:    ${PORT}                                    ║
  ║   Mode:    ${process.env.NODE_ENV || 'development'}                            ║
  ╚════════════════════════════════════════════════════╝
  
  Available endpoints:
  - GET    /api/health          - Health check
  - POST   /api/auth/sync       - Sync user from Clerk
  - GET    /api/auth/me         - Get current user
  - PUT    /api/auth/settings   - Update settings
  - PUT    /api/auth/gamification - Update gamification
  - GET    /api/expenses        - Get all expenses
  - POST   /api/expenses        - Create expense
  - GET    /api/expenses/stats  - Get expense stats
  - GET    /api/savings         - Get all savings
  - POST   /api/savings         - Create saving
  - GET    /api/savings/goals   - Get saving goals
  - POST   /api/savings/goals   - Create saving goal
  - GET    /api/reminders       - Get all reminders
  - POST   /api/reminders       - Create reminder
  - GET    /api/reminders/upcoming - Get upcoming reminders
  - GET    /api/income           - Get all income entries
  - POST   /api/income           - Create income entry
  - POST   /api/sync/gmail       - Manually trigger bank-email sync
  - GET    /api/email-connection       - Get/create your forwarding address
  - POST   /api/email-connection/check - Check for a new confirmation code / transaction
  `)
})

export default app