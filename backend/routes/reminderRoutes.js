import express from 'express'
import {
  getReminders,
  getReminder,
  createReminder,
  updateReminder,
  completeReminder,
  deleteReminder,
  deleteAllReminders,
  getUpcomingReminders
} from '../controllers/reminderController.js'
import { requireAuth } from '../middleware/authMiddleware.js'

const router = express.Router()

// All routes require authentication
router.use(requireAuth)

// Special routes (must be before /:id)
router.get('/upcoming', getUpcomingReminders)
router.delete('/all', deleteAllReminders)

// CRUD routes
router.route('/')
  .get(getReminders)
  .post(createReminder)

router.route('/:id')
  .get(getReminder)
  .put(updateReminder)
  .delete(deleteReminder)

// Mark as complete
router.put('/:id/complete', completeReminder)

export default router
