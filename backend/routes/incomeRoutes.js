import express from 'express'
import {
  getIncomes,
  createIncome,
  updateIncome,
  deleteIncome
} from '../controllers/incomeController.js'
import { requireAuth } from '../middleware/authMiddleware.js'

const router = express.Router()

router.use(requireAuth)

router.route('/')
  .get(getIncomes)
  .post(createIncome)

router.route('/:id')
  .put(updateIncome)
  .delete(deleteIncome)

export default router
