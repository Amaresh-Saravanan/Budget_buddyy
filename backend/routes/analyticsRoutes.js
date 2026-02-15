import express from "express";
import auth from "../middleware/authMiddleware.js";
import {
  getWeeklyPulse,
  getMonthlyTrends,
  getCategoryDeepDive,
} from "../controllers/analyticsController.js";

const router = express.Router();

router.get(
  "/weekly-pulse",
  auth,
  getWeeklyPulse
);
router.get(
  "/monthly-trends",
  auth,
  getMonthlyTrends
);
router.get(
  "/category/:category",
  auth,
  getCategoryDeepDive
);

export default router;
