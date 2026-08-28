import express from 'express'
import { getConnection, checkNow } from '../controllers/emailConnectionController.js'
import { requireAuth } from '../middleware/authMiddleware.js'

const router = express.Router()

router.use(requireAuth)

router.get('/', getConnection)
router.post('/check', checkNow)

export default router
