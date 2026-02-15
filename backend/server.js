import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { testConnection } from './config/db.js'

// Route imports
import authRoutes from './routes/authRoutes.js'
import expenseRoutes from './routes/expenseRoutes.js'
import savingRoutes from './routes/savingRoutes.js'
import reminderRoutes from './routes/reminderRoutes.js'

// Load env vars
dotenv.config()

// Test database connection
testConnection()

const app = express()

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    process.env.FRONTEND_URL
  ].filter(Boolean),
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
  `)
})

export default app