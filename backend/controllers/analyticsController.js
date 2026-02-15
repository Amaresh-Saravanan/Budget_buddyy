import Expense from "../models/Expense.js";
import SavingsLog from "../models/SavingsLog.js";

export const getWeeklyPulse = async (req, res) => {
  const userId = req.user.id;

  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 7);

  const expenses = await Expense.find({
    user: userId,
    createdAt: { $gte: start, $lte: end },
  });

  const savings = await SavingsLog.find({
    user: userId,
    createdAt: { $gte: start, $lte: end },
  });

  const spent = expenses.reduce(
    (sum, e) => sum + e.amount,
    0
  );

  const saved = savings.reduce(
    (sum, s) => sum + s.amount,
    0
  );

  const categoryTotals = {};

  expenses.forEach((e) => {
    if (!categoryTotals[e.category])
      categoryTotals[e.category] = 0;

    categoryTotals[e.category] += e.amount;
  });

  const categoryBreakdown =
    Object.entries(categoryTotals).map(
      ([category, amount]) => ({
        category,
        amount,
        percent: Math.round(
          (amount / spent) * 100
        ),
      })
    );

  // last week comparison
  const lastStart = new Date(start);
  lastStart.setDate(lastStart.getDate() - 7);

  const lastExpenses = await Expense.find({
    user: userId,
    createdAt: {
      $gte: lastStart,
      $lt: start,
    },
  });

  const lastSpent = lastExpenses.reduce(
    (sum, e) => sum + e.amount,
    0
  );

  const diffPercent = lastSpent
    ? Math.round(
        ((lastSpent - spent) /
          lastSpent) *
          100
      )
    : 0;

  res.json({
    spent,
    saved,
    categoryBreakdown,
    comparison: diffPercent,
  });
};

export const getMonthlyTrends =
  async (req, res) => {
    const userId = req.user.id;

    const months = [];

    for (let i = 2; i >= 0; i--) {
      const start = new Date();
      start.setMonth(start.getMonth() - i);
      start.setDate(1);

      const end = new Date(
        start.getFullYear(),
        start.getMonth() + 1,
        0
      );

      const expenses =
        await Expense.find({
          user: userId,
          createdAt: {
            $gte: start,
            $lte: end,
          },
        });

      const total = expenses.reduce(
        (sum, e) => sum + e.amount,
        0
      );

      months.push({
        month: start.toLocaleString(
          "default",
          { month: "short" }
        ),
        total,
      });
    }

    res.json(months);
  };

  export const getCategoryDeepDive =
  async (req, res) => {
    const { category } = req.params;
    const userId = req.user.id;

    const start = new Date();
    start.setDate(1);

    const expenses =
      await Expense.find({
        user: userId,
        category,
        createdAt: { $gte: start },
      }).sort({ amount: -1 });

    const total = expenses.reduce(
      (sum, e) => sum + e.amount,
      0
    );

    const weekly = [0, 0, 0, 0];

    expenses.forEach((e) => {
      const week =
        Math.floor(
          (new Date(e.createdAt).getDate() -
            1) /
            7
        );

      weekly[week] += e.amount;
    });

    const topExpenses =
      expenses.slice(0, 3);

    res.json({
      total,
      weekly,
      topExpenses,
    });
  };
