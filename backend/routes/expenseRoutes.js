import express from 'express'
import {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  deleteAllExpenses,
  getExpenseStats
} from '../controllers/expenseController.js'
import { requireAuth } from '../middleware/authMiddleware.js'

const router = express.Router()

// All routes require authentication
router.use(requireAuth)

// Stats and bulk-delete routes (must be before /:id to avoid conflict)
router.get('/stats', getExpenseStats)
router.delete('/all', deleteAllExpenses)

// CRUD routes
router.route('/')
  .get(getExpenses)
  .post(createExpense)

router.route('/:id')
  .get(getExpense)
  .put(updateExpense)
  .delete(deleteExpense)

export default router