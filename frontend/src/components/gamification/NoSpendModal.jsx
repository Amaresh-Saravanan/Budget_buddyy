import React from "react";
import { X, Sparkles } from "lucide-react";

export default function NoSpendModal({
    open,
    onClose,
}) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">

            {/* Modal Card */}
            <div className="bg-[#1a1a1a] rounded-xl p-8 w-full max-w-md border border-[#00ff88] shadow-2xl relative overflow-hidden">

                {/* Neon Glow Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#00ff88]/10 to-transparent pointer-events-none" />

                {/* Header */}
                <div className="flex items-center justify-between mb-6 relative z-10">
                    <h2
                        className="text-2xl font-bold flex items-center gap-2 text-green-400"
                        style={{
                            fontFamily:
                                "Space Grotesk, sans-serif",
                        }}
                    >
                        <Sparkles size={22} />
                        Achievement Unlocked
                    </h2>

                    <button
                        onClick={onClose}
                        className="text-[#a0a0a0] hover:text-white transition-colors"
                    >
                        <X size={22} />
                    </button>
                </div>

                {/* Content */}
                <div className="text-center space-y-4 relative z-10">

                    {/* Emoji Burst */}
                    <div className="text-6xl animate-bounce">
                        🎉
                    </div>

                    <h1 className="text-3xl font-bold text-green-400">
                        NO-SPEND DAY!
                    </h1>

                    <p className="text-[#a0a0a0] text-sm">
                        You didn’t log any expenses yesterday.
                        That’s elite money discipline 💪
                    </p>

                    {/* Rewards Box */}
                    <div className="bg-[#0f0f0f] border border-[#00ff88]/40 rounded-lg p-4 space-y-1">
                        <p className="text-green-400 font-medium">
                            +₹500 Added to Savings
                        </p>
                        <p className="text-green-400 font-medium">
                            +10 Health Score
                        </p>
                    </div>

                    {/* CTA */}
                    <button
                        onClick={onClose}
                        className="
              w-full mt-4
              bg-[#00ff88]
              hover:bg-[#00e67a]
              text-black
              font-bold
              py-3
              rounded-lg
              transition-all
              duration-200
              hover:shadow-[0_0_25px_rgba(0,255,136,0.6)]
            "
                    >
                        Awesome 🚀
                    </button>
                </div>
            </div>
        </div>
    );
}
