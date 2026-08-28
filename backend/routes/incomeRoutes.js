import express from 'express'
import {
  getIncomes,
  createIncome,
  updateIncome,
  deleteIncome,
  deleteAllIncome
} from '../controllers/incomeController.js'
import { requireAuth } from '../middleware/authMiddleware.js'

const router = express.Router()

router.use(requireAuth)

// Bulk delete (must be before /:id)
router.delete('/all', deleteAllIncome)

router.route('/')
  .get(getIncomes)
  .post(createIncome)

router.route('/:id')
  .put(updateIncome)
  .delete(deleteIncome)

export default router
