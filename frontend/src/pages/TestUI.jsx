import { useState } from "react";

import StreakCard from
  "../components/gamification/StreakCard";

import WeeklyProgress from
  "../components/gamification/WeeklyProgress";

import NoSpendModal from
  "../components/gamification/NoSpendModal";

import WeeklyPulse from
  "../components/analytics/WeeklyPulse";

import MonthlyTrends from
  "../components/analytics/MonthlyTrends";

import CategoryDeepDive from
  "../components/analytics/CategoryDeepDive";

export default function TestUI() {

  const [open, setOpen] =
    useState(true);

  return (
    <div className="p-10 space-y-10 bg-[#0f0f0f] min-h-screen">

      {/* 🔥 SECTION 6 — GAMIFICATION */}

      <h1 className="text-2xl text-white font-bold">
        Section 6 — Gamification
      </h1>

      <StreakCard />

      <WeeklyProgress
        data={{
          percent: 67,
          remaining: 1160,
          perDay: 290,
        }}
      />

      <button
        onClick={() => setOpen(true)}
        className="bg-green-500 px-4 py-2 rounded"
      >
        Trigger No-Spend Modal
      </button>

      <NoSpendModal
        open={open}
        onClose={() =>
          setOpen(false)
        }
      />

      {/* 📊 SECTION 7 — ANALYTICS */}

      <h1 className="text-2xl text-white font-bold pt-10">
        Section 7 — Analytics
      </h1>

      <WeeklyPulse />

      <MonthlyTrends />

      {/* Deep Dive Mock */}
      <CategoryDeepDive />

    </div>
  );
}
