import React, { useMemo, useState } from 'react';
import { Trophy, Target, CheckCircle, XCircle, ChevronDown, ChevronUp, Award, Sparkles } from 'lucide-react';

const MonthlyChallenge = ({ categoryBreakdown = {}, currency = '₹' }) => {
  const [expanded, setExpanded] = useState(false);

  const challengeData = useMemo(() => {
    const categories = Object.entries(categoryBreakdown).map(([name, data]) => {
      const percentage = data.budget > 0 ? Math.round((data.spent / data.budget) * 100) : 0;
      const isUnderBudget = percentage <= 100;
      return {
        name,
        spent: data.spent,
        budget: data.budget,
        percentage,
        isUnderBudget,
        icon: data.icon || '📦',
        color: data.color || '#a0a0a0'
      };
    }).filter(cat => cat.budget > 0);

    const totalCategories = categories.length;
    const categoriesUnderBudget = categories.filter(c => c.isUnderBudget).length;
    const isComplete = categoriesUnderBudget === totalCategories && totalCategories > 0;
    const progressPercent = totalCategories > 0 ? (categoriesUnderBudget / totalCategories) * 100 : 0;

    return {
      categories: categories.sort((a, b) => b.percentage - a.percentage),
      totalCategories,
      categoriesUnderBudget,
      isComplete,
      progressPercent
    };
  }, [categoryBreakdown]);

  const { categories, totalCategories, categoriesUnderBudget, isComplete, progressPercent } = challengeData;

  // Get status message
  const getStatusMessage = () => {
    if (isComplete) return "🎊 CHALLENGE COMPLETE!";
    if (categoriesUnderBudget === totalCategories - 1) return "SO CLOSE! One category to go!";
    if (progressPercent >= 50) return "Great progress! Keep going!";
    return "Stay focused on your budget!";
  };

  // Get badge color based on progress
  const getBadgeColor = () => {
    if (isComplete) return '#FFD700';
    if (progressPercent >= 80) return '#00ff88';
    if (progressPercent >= 50) return '#4ecdc4';
    return '#bb86fc';
  };

  return (
    <div className={`rounded-xl border shadow-lg overflow-hidden transition-all duration-300 ${
      isComplete 
        ? 'bg-gradient-to-br from-[#FFD700]/20 via-[#1a1a1a] to-[#FFD700]/10 border-[#FFD700]/50' 
        : 'bg-[#1a1a1a] border-[#333]'
    }`}>
      {/* Header */}
      <div 
        className="p-6 cursor-pointer hover:bg-[#252525]/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isComplete ? 'bg-[#FFD700]/20 border border-[#FFD700]' : 'bg-[#bb86fc]/20 border border-[#bb86fc]'
            }`}>
              <Trophy className={isComplete ? 'text-[#FFD700]' : 'text-[#bb86fc]'} size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#e0e0e0]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                MONTHLY CHALLENGE
              </h3>
              <p className="text-[#666] text-sm">Stay in Lane</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#a0a0a0] text-sm">
              {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </span>
          </div>
        </div>

        {/* Goal */}
        <div className="bg-[#0f0f0f] rounded-lg p-3 mb-4">
          <p className="text-[#a0a0a0] text-sm">
            <Target size={14} className="inline mr-2" />
            Goal: Keep ALL categories under 100% budget
          </p>
        </div>

        {/* Progress Summary */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[#e0e0e0] font-bold text-xl">
            {categoriesUnderBudget}/{totalCategories} Complete
          </span>
          <span className="text-[#a0a0a0] text-sm">
            {Math.round(progressPercent)}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-3 bg-[#333] rounded-full overflow-hidden mb-3">
          <div 
            className="h-full rounded-full transition-all duration-500"
            style={{ 
              width: `${progressPercent}%`,
              backgroundColor: getBadgeColor()
            }}
          />
        </div>

        {/* Status Message */}
        <p className={`text-center text-sm font-medium ${isComplete ? 'text-[#FFD700]' : 'text-[#a0a0a0]'}`}>
          {getStatusMessage()}
        </p>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="px-6 pb-6 pt-2 border-t border-[#333]">
          {/* Category Progress List */}
          <div className="space-y-3 mb-6">
            {categories.map(category => (
              <div 
                key={category.name}
                className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                  category.isUnderBudget 
                    ? 'bg-[#00ff88]/10 border border-[#00ff88]/30' 
                    : 'bg-[#ff6b6b]/10 border border-[#ff6b6b]/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  {category.isUnderBudget ? (
                    <CheckCircle className="text-[#00ff88]" size={20} />
                  ) : (
                    <XCircle className="text-[#ff6b6b]" size={20} />
                  )}
                  <span className="text-xl">{category.icon}</span>
                  <span className="text-[#e0e0e0] font-medium">{category.name}</span>
                </div>
                <div className="text-right">
                  <span className={`font-bold ${
                    category.isUnderBudget ? 'text-[#00ff88]' : 'text-[#ff6b6b]'
                  }`}>
                    {category.percentage}%
                  </span>
                  <p className="text-[#666] text-xs">
                    {currency}{category.spent.toLocaleString()} / {currency}{category.budget.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Rewards Section */}
          <div className="bg-[#0f0f0f] rounded-xl p-4">
            <h4 className="text-[#a0a0a0] text-sm uppercase tracking-wide mb-3 flex items-center gap-2">
              <Award size={16} />
              Challenge Rewards
            </h4>
            <div className="space-y-2">
              <div className={`flex items-center justify-between py-2 ${isComplete ? 'text-[#FFD700]' : 'text-[#666]'}`}>
                <span className="flex items-center gap-2">
                  <span>👑</span> Budget Master badge
                </span>
                {isComplete && <CheckCircle size={16} />}
              </div>
              <div className={`flex items-center justify-between py-2 ${isComplete ? 'text-[#00ff88]' : 'text-[#666]'}`}>
                <span className="flex items-center gap-2">
                  <span>+20</span> Bonus Health Score points
                </span>
                {isComplete && <CheckCircle size={16} />}
              </div>
              <div className={`flex items-center justify-between py-2 ${isComplete ? 'text-[#bb86fc]' : 'text-[#666]'}`}>
                <span className="flex items-center gap-2">
                  <Sparkles size={14} /> Special confetti celebration
                </span>
                {isComplete && <CheckCircle size={16} />}
              </div>
            </div>
          </div>

          {/* Completion Banner */}
          {isComplete && (
            <div className="mt-4 bg-gradient-to-r from-[#FFD700]/20 to-[#ff9f43]/20 border border-[#FFD700]/50 rounded-xl p-4 text-center">
              <div className="text-4xl mb-2">👑🎊✨</div>
              <p className="text-[#FFD700] font-bold text-lg">You're a Budget Master!</p>
              <p className="text-[#a0a0a0] text-sm">All categories under budget this month!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MonthlyChallenge;
