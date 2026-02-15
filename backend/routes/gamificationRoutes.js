import express from "express";
import {
  getSavingsStreak,
  checkNoSpendDay,
} from "../controllers/gamificationController.js";
import auth from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/streak", auth, getSavingsStreak);

router.get(
  "/no-spend",
  auth,
  checkNoSpendDay
);

export default router;
