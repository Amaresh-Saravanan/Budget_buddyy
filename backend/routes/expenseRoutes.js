import express from 'express'
import { 
  getExpenses, 
  getExpense, 
  createExpense, 
  updateExpense, 
  deleteExpense,
  getExpenseStats 
} from '../controllers/expenseController.js'
import { requireAuth } from '../middleware/authMiddleware.js'

const router = express.Router()

// All routes require authentication
router.use(requireAuth)

// Stats route (must be before /:id to avoid conflict)
router.get('/stats', getExpenseStats)

// CRUD routes
router.route('/')
  .get(getExpenses)
  .post(createExpense)

router.route('/:id')
  .get(getExpense)
  .put(updateExpense)
  .delete(deleteExpense)

export default router