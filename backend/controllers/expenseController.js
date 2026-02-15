import Expense from "../models/Expense.js";

export const getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({ user: req.user.id }).sort({
      createdAt: -1,
    });
    return res.json(expenses);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const addExpense = async (req, res) => {
  try {
    const { title, amount, category, date } = req.body;

    if (!title || amount == null || !category) {
      return res
        .status(400)
        .json({ message: "title, amount and category are required" });
    }

    const expense = await Expense.create({
      user: req.user.id,
      title,
      amount,
      category,
      date: date || undefined,
    });

    return res.status(201).json(expense);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    const fields = ["title", "amount", "category", "date"];
    fields.forEach((key) => {
      if (req.body[key] !== undefined) {
        expense[key] = req.body[key];
      }
    });

    await expense.save();
    return res.json(expense);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    return res.json({ message: "Expense removed" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
