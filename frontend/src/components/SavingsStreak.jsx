import React, { useMemo } from 'react';
import { Flame, Trophy, Target } from 'lucide-react';

// Achievement milestones
const ACHIEVEMENTS = [
  { days: 3, emoji: '🌱', title: 'Getting Started', description: 'First 3-day streak!' },
  { days: 7, emoji: '🥷', title: 'Thrifty Ninja', description: 'A whole week of savings!' },
  { days: 14, emoji: '💎', title: 'Savings Master', description: 'Two weeks strong!' },
  { days: 30, emoji: '👑', title: 'Budget Legend', description: 'A month of dedication!' },
];

const SavingsStreak = ({ savings = [] }) => {
  const streakData = useMemo(() => {
    if (savings.length === 0) {
      return { currentStreak: 0, longestStreak: 0, currentAchievement: null, nextMilestone: ACHIEVEMENTS[0] };
    }

    // Get dates with savings
    const savingDates = new Set(
      savings.map(s => new Date(s.date).toDateString())
    );

    // Calculate current streak (consecutive days ending today or yesterday)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let currentStreak = 0;
    let checkDate = new Date(today);
    
    // Check if today has savings, if not, check starting from yesterday
    if (!savingDates.has(checkDate.toDateString())) {
      checkDate.setDate(checkDate.getDate() - 1);
    }
    
    // Count consecutive days backwards
    while (savingDates.has(checkDate.toDateString())) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // Calculate longest streak
    const sortedDates = Array.from(savingDates)
      .map(d => new Date(d))
      .sort((a, b) => a - b);
    
    let longestStreak = 0;
    let tempStreak = 1;
    
    for (let i = 1; i < sortedDates.length; i++) {
      const diffDays = Math.round((sortedDates[i] - sortedDates[i-1]) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

    // Find current achievement
    const currentAchievement = [...ACHIEVEMENTS]
      .reverse()
      .find(a => currentStreak >= a.days) || null;

    // Find next milestone
    const nextMilestone = ACHIEVEMENTS.find(a => a.days > currentStreak) || ACHIEVEMENTS[ACHIEVEMENTS.length - 1];

    return { currentStreak, longestStreak, currentAchievement, nextMilestone };
  }, [savings]);

  const { currentStreak, longestStreak, currentAchievement, nextMilestone } = streakData;
  const progressToNext = currentAchievement 
    ? ((currentStreak - (currentAchievement?.days || 0)) / (nextMilestone.days - (currentAchievement?.days || 0))) * 100
    : (currentStreak / nextMilestone.days) * 100;

  return (
    <div className="bg-gradient-to-br from-[#ff6b6b]/20 via-[#1a1a1a] to-[#ff9f43]/10 border border-[#ff6b6b]/30 rounded-xl p-6 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-[#e0e0e0] flex items-center gap-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          <Flame className="text-[#ff6b6b]" size={24} />
          Savings Streak
        </h3>
        <div className="flex items-center gap-1 text-[#a0a0a0] text-sm">
          <Trophy size={16} className="text-[#FFD700]" />
          Best: {longestStreak} days
        </div>
      </div>

      {/* Main Streak Display */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-5xl font-bold text-[#ff6b6b]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            🔥 {currentStreak}
          </span>
          <span className="text-2xl text-[#a0a0a0]">Days</span>
        </div>
        {currentStreak === 0 && (
          <p className="text-[#666] text-sm">Log savings today to start your streak!</p>
        )}
      </div>

      {/* Current Achievement */}
      {currentAchievement && (
        <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4 mb-4">
          <p className="text-[#a0a0a0] text-xs uppercase tracking-wide mb-2">Achievement Unlocked</p>
          <div className="flex items-center gap-3">
            <span className="text-4xl">{currentAchievement.emoji}</span>
            <div>
              <p className="text-[#e0e0e0] font-bold">{currentAchievement.title}</p>
              <p className="text-[#666] text-sm">{currentAchievement.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* Progress to Next Milestone */}
      {nextMilestone && currentStreak < nextMilestone.days && (
        <div className="bg-[#0f0f0f] rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[#a0a0a0] text-sm">Next milestone: {nextMilestone.days} days</span>
            <span className="text-[#ff6b6b] text-sm font-medium">
              {nextMilestone.days - currentStreak} days to go
            </span>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">{nextMilestone.emoji}</span>
            <span className="text-[#e0e0e0] font-medium">{nextMilestone.title}</span>
          </div>
          <div className="h-2 bg-[#333] rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#ff6b6b] to-[#ff9f43] rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, progressToNext)}%` }}
            />
          </div>
        </div>
      )}

      {/* All Achievements Completed */}
      {currentStreak >= ACHIEVEMENTS[ACHIEVEMENTS.length - 1].days && (
        <div className="text-center py-4">
          <span className="text-3xl">🎊</span>
          <p className="text-[#FFD700] font-bold mt-2">All achievements unlocked!</p>
          <p className="text-[#666] text-sm">You're a true Budget Legend!</p>
        </div>
      )}

      {/* Streak Break Warning */}
      {currentStreak > 0 && (
        <div className="mt-4 bg-[#ff6b6b]/10 border border-[#ff6b6b]/30 rounded-lg p-3">
          <p className="text-[#ff6b6b] text-sm flex items-center gap-2">
            <Target size={16} />
            <span>Save today to keep your streak alive!</span>
          </p>
        </div>
      )}

      {/* Achievement Badges Row */}
      <div className="mt-4 pt-4 border-t border-[#333]">
        <p className="text-[#666] text-xs uppercase tracking-wide mb-3">Milestones</p>
        <div className="flex justify-between">
          {ACHIEVEMENTS.map((achievement) => (
            <div 
              key={achievement.days}
              className={`flex flex-col items-center transition-all ${
                currentStreak >= achievement.days 
                  ? 'opacity-100' 
                  : 'opacity-30 grayscale'
              }`}
            >
              <span className="text-2xl mb-1">{achievement.emoji}</span>
              <span className="text-[#666] text-xs">{achievement.days}d</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SavingsStreak;
