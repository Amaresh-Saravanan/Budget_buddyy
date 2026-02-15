import React from "react";
import { CalendarDays } from "lucide-react";

export default function WeeklyProgress({
    data,
}) {
    if (!data) return null;

    // Status color logic
    const getStatusColor = () => {
        if (data.percent >= 100)
            return "from-red-500 to-red-400";

        if (data.percent >= 80)
            return "from-amber-500 to-yellow-400";

        return "from-blue-500 to-purple-400";
    };

    const getStatusLabel = () => {
        if (data.percent >= 100)
            return "Danger";

        if (data.percent >= 80)
            return "Careful";

        return "On Track";
    };

    return (
        <div
            className="
        relative
        bg-[#1a1a1a]
        p-6
        rounded-xl
        border border-[#333]
        overflow-hidden
        transition-all duration-300
        hover:border-[#bb86fc]
        hover:shadow-[0_0_25px_rgba(187,134,252,0.35)]
      "
        >
            {/* Glow Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between relative z-10">
                <h2
                    className="text-xl font-bold flex items-center gap-2 text-purple-400"
                    style={{
                        fontFamily:
                            "Space Grotesk, sans-serif",
                    }}
                >
                    <CalendarDays size={22} />
                    Weekly Budget
                </h2>

                {/* Status Pill */}
                <span
                    className={`
            text-xs px-3 py-1 rounded-full font-medium
            ${data.percent >= 100
                            ? "bg-red-500/20 text-red-400 border border-red-500"
                            : data.percent >= 80
                                ? "bg-amber-500/20 text-amber-400 border border-amber-500"
                                : "bg-blue-500/20 text-blue-400 border border-blue-500"
                        }
          `}
                >
                    {getStatusLabel()}
                </span>
            </div>

            {/* Progress Section */}
            <div className="mt-6 relative z-10">

                {/* Numbers */}
                <div className="flex items-end justify-between mb-2">
                    <p className="text-3xl font-bold">
                        {Math.round(data.percent)}%
                    </p>

                    <p className="text-sm text-[#a0a0a0]">
                        Budget Used
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-[#333] h-3 rounded-full overflow-hidden">
                    <div
                        className={`
              h-3 rounded-full
              bg-gradient-to-r ${getStatusColor()}
              transition-all duration-500
            `}
                        style={{
                            width: `${Math.min(
                                data.percent,
                                100
                            )}%`,
                        }}
                    />
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mt-6 relative z-10">

                <div className="bg-[#0f0f0f] border border-[#333] rounded-lg p-3">
                    <p className="text-xs text-[#a0a0a0] uppercase">
                        Remaining
                    </p>
                    <p className="text-lg font-bold text-green-400">
                        ₹{data.remaining}
                    </p>
                </div>

                <div className="bg-[#0f0f0f] border border-[#333] rounded-lg p-3">
                    <p className="text-xs text-[#a0a0a0] uppercase">
                        Per Day
                    </p>
                    <p className="text-lg font-bold text-purple-400">
                        ₹{Math.round(data.perDay)}
                    </p>
                </div>
            </div>

            {/* Footer Insight */}
            <p className="text-xs text-[#a0a0a0] mt-4 relative z-10">
                Spend wisely to stay within your weekly lane 📊
            </p>
        </div>
    );
}
