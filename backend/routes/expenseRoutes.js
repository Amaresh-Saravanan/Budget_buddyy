import express from "express";
import auth from "../middleware/authMiddleware.js";
import {
  getExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
} from "../controllers/expenseController.js";

const router = express.Router();

router.get("/", auth, getExpenses);
router.post("/", auth, addExpense);
router.put("/:id", auth, updateExpense);
router.delete("/:id", auth, deleteExpense);

export default router;
