import { useState } from "react";
import {
    LineChart,
    Line,
    XAxis,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

const MOCK_MODE = true;

// 📊 Mock Data (3-Month Trend)
const MOCK_DATA = [
    { month: "Dec", total: 5600 },
    { month: "Jan", total: 4800 },
    { month: "Feb", total: 4200 },
];

export default function MonthlyTrends() {

    const [data] = useState(
        MOCK_MODE ? MOCK_DATA : []
    );

    const trendDown =
        data.length >= 2 &&
        data[data.length - 1].total <
        data[0].total;

    const avg =
        data.reduce((a, b) => a + b.total, 0) /
        data.length;

    return (
        <div className="bg-[#1a1a1a] p-6 rounded-xl border border-[#333] shadow-lg space-y-4">

            {/* HEADER */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#bb86fc]">
                    📈 Spending Trend
                </h2>

                <span
                    className={`text-sm font-medium ${trendDown
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                >
                    {trendDown
                        ? "Trending Down 🎉"
                        : "Trending Up ⚠️"}
                </span>
            </div>

            {/* CHART */}
            <div className="h-[260px] w-full">

                <ResponsiveContainer>
                    <LineChart data={data}>

                        <XAxis
                            dataKey="month"
                            stroke="#a0a0a0"
                        />

                        <Tooltip
                            contentStyle={{
                                background: "#0f0f0f",
                                border: "1px solid #333",
                            }}
                        />

                        <Line
                            type="monotone"
                            dataKey="total"
                            stroke="#bb86fc"
                            strokeWidth={3}
                            dot={{ r: 5 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* SUMMARY */}
            <div className="bg-[#0f0f0f] p-4 rounded-lg border border-[#333] text-sm">

                <p className="text-[#a0a0a0]">
                    Average Monthly Spend
                </p>

                <p className="text-lg font-bold text-white">
                    ₹{Math.round(avg).toLocaleString()}
                </p>

                <p className="text-xs text-[#666] mt-1">
                    {data[0]?.total} →{" "}
                    {data[data.length - 1]?.total}
                </p>
            </div>
        </div>
    );
}
