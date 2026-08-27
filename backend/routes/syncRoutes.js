import express from 'express'
import { triggerGmailSync } from '../controllers/syncController.js'
import { requireAuth } from '../middleware/authMiddleware.js'

const router = express.Router()

router.use(requireAuth)

router.post('/gmail', triggerGmailSync)

export default router
