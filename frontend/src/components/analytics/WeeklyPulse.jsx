import { useState } from "react";
import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

const MOCK_MODE = true;

// 🔥 Mock Weekly Data
const MOCK_DATA = {
    spent: 2340,
    saved: 680,
    comparison: 12, // % less than last week

    categoryBreakdown: [
        { category: "Food", amount: 1053 },
        { category: "Transport", amount: 585 },
        { category: "Fun", amount: 468 },
        { category: "Bills", amount: 117 },
        { category: "Other", amount: 117 },
    ],
};

// 🎨 Category Colors
const COLORS = [
    "#ff6b6b",
    "#4ecdc4",
    "#bb86fc",
    "#FFD700",
    "#00ff88",
];

export default function WeeklyPulse() {

    const [data] = useState(
        MOCK_MODE ? MOCK_DATA : null
    );

    if (!data) return null;

    const total =
        data.spent + data.saved;

    return (
        <div className="bg-[#1a1a1a] p-6 rounded-xl border border-[#333] shadow-lg space-y-6">

            {/* HEADER */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#bb86fc]">
                    📊 Weekly Financial Pulse
                </h2>

                <span className="text-green-400 text-sm font-medium">
                    {data.comparison}% LESS 📉
                </span>
            </div>

            {/* SPENT VS SAVED */}
            <div className="bg-[#0f0f0f] p-4 rounded-xl border border-[#333]">

                <p className="text-[#a0a0a0] text-sm mb-3">
                    Spent vs Saved
                </p>

                <div className="h-[220px] w-full">

                    <ResponsiveContainer>
                        <BarChart
                            data={[
                                {
                                    name: "Spent",
                                    value: data.spent,
                                },
                                {
                                    name: "Saved",
                                    value: data.saved,
                                },
                            ]}
                        >
                            <XAxis
                                dataKey="name"
                                stroke="#a0a0a0"
                            />

                            <Tooltip
                                contentStyle={{
                                    background: "#0f0f0f",
                                    border: "1px solid #333",
                                }}
                            />

                            <Bar
                                dataKey="value"
                                fill="#bb86fc"
                                radius={[6, 6, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>

                </div>

                <div className="flex justify-between text-sm mt-3">
                    <span className="text-red-400">
                        Spent: ₹{data.spent}
                    </span>
                    <span className="text-green-400">
                        Saved: ₹{data.saved}
                    </span>
                </div>
            </div>

            {/* CATEGORY PIE */}
            <div className="bg-[#0f0f0f] p-4 rounded-xl border border-[#333]">

                <p className="text-[#a0a0a0] text-sm mb-3">
                    Category Breakdown
                </p>

                <div className="h-[240px] w-full">

                    <ResponsiveContainer>
                        <PieChart>

                            <Pie
                                data={data.categoryBreakdown}
                                dataKey="amount"
                                nameKey="category"
                                outerRadius={90}
                            >
                                {data.categoryBreakdown.map(
                                    (_, i) => (
                                        <Cell
                                            key={i}
                                            fill={COLORS[i]}
                                        />
                                    )
                                )}
                            </Pie>

                            <Tooltip
                                contentStyle={{
                                    background: "#0f0f0f",
                                    border: "1px solid #333",
                                }}
                            />

                        </PieChart>
                    </ResponsiveContainer>

                </div>

                {/* Legend */}
                <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
                    {data.categoryBreakdown.map(
                        (c, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-2"
                            >
                                <div
                                    className="w-3 h-3 rounded"
                                    style={{
                                        background:
                                            COLORS[i],
                                    }}
                                />

                                <span className="text-[#a0a0a0]">
                                    {c.category}
                                </span>

                                <span className="ml-auto">
                                    ₹{c.amount}
                                </span>
                            </div>
                        )
                    )}
                </div>
            </div>

            {/* INSIGHT */}
            <div className="bg-[#bb86fc]/10 border border-[#bb86fc]/30 p-4 rounded-xl text-sm">

                <p className="text-[#bb86fc]">
                    💡 You spent{" "}
                    <strong>
                        {data.comparison}% less
                    </strong>{" "}
                    than last week. Great
                    control — keep the streak
                    going!
                </p>

            </div>
        </div>
    );
}
