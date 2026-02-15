import express from 'express'
import { 
  syncUser, 
  getMe, 
  updateSettings, 
  updateGamification,
  handleWebhook 
} from '../controllers/authController.js'
import { requireAuth, verifyWebhook } from '../middleware/authMiddleware.js'

const router = express.Router()

// Public webhook route (verified by Clerk signature)
router.post('/webhook', express.raw({ type: 'application/json' }), verifyWebhook, handleWebhook)

// Protected routes
router.post('/sync', requireAuth, syncUser)
router.get('/me', requireAuth, getMe)
router.put('/settings', requireAuth, updateSettings)
router.put('/gamification', requireAuth, updateGamification)

export default router