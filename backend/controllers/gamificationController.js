import SavingsLog from "../models/SavingsLog.js";
import Expense from "../models/Expense.js";

//
// 🔥 SAVINGS STREAK
//
export const getSavingsStreak = async (req, res) => {
  try {
    const logs = await SavingsLog.find({
      user: req.user.id,
    }).sort({ createdAt: -1 });

    if (!logs.length)
      return res.json({
        streak: 0,
        achievement: resolveAchievement(0),
      });

    let streak = 0;
    let current = new Date();

    for (const log of logs) {
      const logDate = new Date(log.createdAt);

      const diff =
        (current - logDate) /
        (1000 * 60 * 60 * 24);

      if (Math.floor(diff) <= 1) {
        streak++;
        current = logDate;
      } else break;
    }

    res.json({
      streak,
      achievement: resolveAchievement(streak),
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

//
// 🏆 ACHIEVEMENT RESOLVER
//
function resolveAchievement(streak) {
  if (streak >= 30)
    return {
      title: "Budget Legend",
      icon: "👑",
    };

  if (streak >= 14)
    return {
      title: "Savings Master",
      icon: "💎",
    };

  if (streak >= 7)
    return {
      title: "Thrifty Ninja",
      icon: "🥷",
    };

  if (streak >= 3)
    return {
      title: "Getting Started",
      icon: "🌱",
    };

  return {
    title: "None",
    icon: "—",
  };
}

//
// 🎉 NO SPEND DAY
//
export const checkNoSpendDay = async (
  req,
  res
) => {
  try {
    const yesterday = new Date();
    yesterday.setDate(
      yesterday.getDate() - 1
    );
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expenses = await Expense.find({
      user: req.user.id,
      createdAt: {
        $gte: yesterday,
        $lt: today,
      },
    });

    res.json({
      noSpend: expenses.length === 0,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

//
// 📅 WEEKLY PROGRESS
//
export const getWeeklyProgress =
  async (req, res) => {
    try {
      const {
        spent,
        budget,
        daysLeft,
      } = req.body;

      const percent =
        (spent / budget) * 100;

      let status = "On Track";

      if (percent >= 100)
        status = "Danger";
      else if (percent >= 80)
        status = "Careful";

      res.json({
        percent,
        remaining: budget - spent,
        perDay:
          (budget - spent) /
          daysLeft,
        status,
      });
    } catch (err) {
      res.status(500).json({
        message: err.message,
      });
    }
  };
