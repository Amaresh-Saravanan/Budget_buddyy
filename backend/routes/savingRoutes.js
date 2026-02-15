import express from 'express'
import { 
  getSavings, 
  createSaving, 
  updateSaving, 
  deleteSaving,
  getSavingGoals,
  createSavingGoal,
  updateSavingGoal,
  deleteSavingGoal
} from '../controllers/savingController.js'
import { requireAuth } from '../middleware/authMiddleware.js'

const router = express.Router()

// All routes require authentication
router.use(requireAuth)

// Saving goals routes (must be before /:id)
router.route('/goals')
  .get(getSavingGoals)
  .post(createSavingGoal)

router.route('/goals/:id')
  .put(updateSavingGoal)
  .delete(deleteSavingGoal)

// Savings CRUD routes
router.route('/')
  .get(getSavings)
  .post(createSaving)

router.route('/:id')
  .put(updateSaving)
  .delete(deleteSaving)

export default router
