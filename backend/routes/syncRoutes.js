import express from 'express'
import { triggerGmailSync, cronSync } from '../controllers/syncController.js'
import { requireAuth } from '../middleware/authMiddleware.js'

const router = express.Router()

// Scheduler-facing route. Authenticated by a shared secret rather than a
// user session, so it is mounted before requireAuth.
router.post('/cron', cronSync)

// Everything below requires a signed-in user.
router.use(requireAuth)

router.post('/gmail', triggerGmailSync)

export default router
