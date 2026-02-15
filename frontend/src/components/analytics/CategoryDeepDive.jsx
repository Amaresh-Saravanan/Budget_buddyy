import { useState } from "react";
import { useParams } from "react-router-dom";

const MOCK_MODE = true; // 👈 TOGGLE

// 🔥 Mock Data
const MOCK_DATA = {
    Food: {
        total: 5200,
        budget: 6000,
        weekly: [1200, 1500, 1800, 700],
        topExpenses: [
            {
                _id: 1,
                title: "Restaurant Dinner",
                amount: 850,
                createdAt: "2026-02-10",
            },
            {
                _id: 2,
                title: "Groceries",
                amount: 650,
                createdAt: "2026-02-07",
            },
            {
                _id: 3,
                title: "Fast Food",
                amount: 540,
                createdAt: "2026-02-14",
            },
        ],
    },

    Transport: {
        total: 2800,
        budget: 3000,
        weekly: [600, 900, 700, 600],
        topExpenses: [
            {
                _id: 1,
                title: "Uber Rides",
                amount: 1200,
                createdAt: "2026-02-12",
            },
        ],
    },
};

export default function CategoryDeepDive() {
    const { category = "Food" } =
        useParams();

    const [data] = useState(
        MOCK_MODE
            ? MOCK_DATA[category] ||
            MOCK_DATA["Food"]
            : null
    );

    if (!data) return null;

    const percentUsed =
        (data.total / data.budget) * 100;

    const getStatusColor = () => {
        if (percentUsed >= 90) return "bg-red-500";
        if (percentUsed >= 70)
            return "bg-yellow-400";
        return "bg-green-400";
    };

    return (
        <div className="bg-[#1a1a1a] p-6 rounded-xl border border-[#333] shadow-lg space-y-6">

            {/* HEADER */}
            <div className="flex items-center justify-between">
                <h2
                    className="text-2xl font-bold text-[#bb86fc]"
                    style={{ fontFamily: "Space Grotesk, sans-serif" }}
                >
                    📊 {category.toUpperCase()} Analytics
                </h2>

                <span className="text-sm text-[#666]">
                    Monthly Deep Dive
                </span>
            </div>

            {/* BUDGET OVERVIEW */}
            <div className="bg-[#0f0f0f] rounded-xl p-4 border border-[#333]">

                <div className="flex justify-between mb-2 text-sm">
                    <span className="text-[#a0a0a0]">
                        Budget Used
                    </span>
                    <span className="text-[#e0e0e0] font-medium">
                        ₹{data.total} / ₹{data.budget}
                    </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-[#333] h-3 rounded-full overflow-hidden">
                    <div
                        className={`h-3 rounded-full ${getStatusColor()}`}
                        style={{
                            width: `${Math.min(
                                percentUsed,
                                100
                            )}%`,
                        }}
                    />
                </div>

                <p className="text-xs text-[#666] mt-2">
                    {Math.round(percentUsed)}% used • ₹
                    {data.budget - data.total} remaining
                </p>
            </div>

            {/* WEEKLY BREAKDOWN */}
            <div>
                <h3 className="text-lg font-semibold text-[#e0e0e0] mb-3">
                    📅 Weekly Breakdown
                </h3>

                <div className="space-y-3">
                    {data.weekly.map((w, i) => {
                        const spike =
                            w > Math.max(...data.weekly) * 0.8;

                        return (
                            <div
                                key={i}
                                className="bg-[#0f0f0f] p-3 rounded-lg border border-[#333] flex justify-between items-center"
                            >
                                <span className="text-[#a0a0a0]">
                                    Week {i + 1}
                                </span>

                                <div className="flex items-center gap-2">
                                    <span className="text-[#e0e0e0] font-medium">
                                        ₹{w}
                                    </span>

                                    {spike && (
                                        <span className="text-red-400 text-xs">
                                            🚨 Spike
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* TOP EXPENSES */}
            <div>
                <h3 className="text-lg font-semibold text-green-400 mb-3">
                    🏆 Top Expenses
                </h3>

                <div className="space-y-2">
                    {data.topExpenses.map((e) => (
                        <div
                            key={e._id}
                            className="bg-[#0f0f0f] border border-[#333] p-3 rounded-lg flex justify-between items-center hover:border-[#bb86fc] transition-all"
                        >
                            <div>
                                <p className="text-[#e0e0e0] font-medium">
                                    {e.title}
                                </p>
                                <p className="text-[#666] text-xs">
                                    {new Date(
                                        e.createdAt
                                    ).toLocaleDateString()}
                                </p>
                            </div>

                            <p className="text-red-400 font-semibold">
                                ₹{e.amount}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* INSIGHT BOX */}
            <div className="bg-[#bb86fc]/10 border border-[#bb86fc]/30 p-4 rounded-xl">
                <p className="text-[#bb86fc] text-sm">
                    💡 Insight: Your spending in{" "}
                    <strong>{category}</strong>{" "}
                    increased compared to last month.
                    Consider setting a lower weekly cap.
                </p>
            </div>
        </div>
    );
}
