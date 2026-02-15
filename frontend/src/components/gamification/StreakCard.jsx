import { useEffect, useState } from "react";
import { Flame, Trophy } from "lucide-react";
import API from "../../services/api";

export default function StreakCard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] =
        useState(true);

    useEffect(() => {
        setData({
            streak: 7,
            achievement: {
                title: "Thrifty Ninja",
                icon: "🥷",
            },
        });
        setLoading(false);
    }, []);


    if (loading) {
        return (
            <div className="bg-[#1a1a1a] p-6 rounded-xl border border-[#333] animate-pulse">
                <div className="h-6 w-40 bg-[#333] rounded mb-4" />
                <div className="h-10 w-24 bg-[#333] rounded" />
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="
      relative
      bg-[#1a1a1a]
      p-6
      rounded-xl
      border border-[#333]
      overflow-hidden
      transition-all duration-300
      hover:border-[#bb86fc]
      hover:shadow-[0_0_25px_rgba(187,134,252,0.4)]
    ">

            {/* Glow Accent */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#bb86fc]/10 to-transparent pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between relative z-10">
                <h2
                    className="text-xl font-bold flex items-center gap-2 text-purple-400"
                    style={{
                        fontFamily:
                            "Space Grotesk, sans-serif",
                    }}
                >
                    <Flame size={22} />
                    Savings Streak
                </h2>

                <span className="text-xs text-[#a0a0a0] uppercase tracking-wide">
                    Active
                </span>
            </div>

            {/* Streak Number */}
            <div className="mt-6 relative z-10">

                <div className="flex items-end gap-2">

                    <span className="text-5xl font-bold text-white">
                        {data.streak}
                    </span>

                    <span className="text-[#a0a0a0] mb-1">
                        days
                    </span>
                </div>

                {/* Progress Bar to Next Milestone */}
                <div className="mt-4">
                    <div className="w-full bg-[#333] h-2 rounded-full overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-purple-500 to-green-400 h-2 rounded-full transition-all duration-500"
                            style={{
                                width: `${Math.min(
                                    (data.streak / 30) * 100,
                                    100
                                )}%`,
                            }}
                        />
                    </div>

                    <p className="text-xs text-[#a0a0a0] mt-1">
                        Road to 30-day legend
                    </p>
                </div>
            </div>

            {/* Achievement Box */}
            <div className="
        mt-6
        bg-[#0f0f0f]
        border border-[#bb86fc]/40
        rounded-lg
        p-4
        flex items-center gap-3
        relative z-10
      ">

                <div className="
          w-12 h-12
          bg-purple-500/20
          border border-purple-500
          rounded-lg
          flex items-center justify-center
          text-2xl
        ">
                    {data.achievement?.icon || "🏆"}
                </div>

                <div>
                    <p className="text-xs text-[#a0a0a0] uppercase tracking-wide">
                        Achievement Unlocked
                    </p>

                    <p className="text-green-400 font-bold">
                        {data.achievement?.title ||
                            "Getting Started"}
                    </p>
                </div>
            </div>

            {/* Motivational Footer */}
            <div className="mt-4 text-xs text-[#a0a0a0] relative z-10">
                Keep saving daily to maintain your streak 🔥
            </div>
        </div>
    );
}
