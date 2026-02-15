import React, { useMemo } from 'react';
import { Medal, Award, Sparkles } from 'lucide-react';

// Badge definitions
const BADGES = {
  gold: { emoji: '🥇', label: 'GOLD', color: '#FFD700', bgColor: '#FFD700/20', message: 'Amazing self-control!', threshold: 50 },
  silver: { emoji: '🥈', label: 'SILVER', color: '#C0C0C0', bgColor: '#C0C0C0/20', message: 'Great budget control!', threshold: 80 },
  bronze: { emoji: '🥉', label: 'BRONZE', color: '#CD7F32', bgColor: '#CD7F32/20', message: 'Just made it!', threshold: 100 }
};

const getBadge = (percentUsed) => {
  if (percentUsed <= BADGES.gold.threshold) return BADGES.gold;
  if (percentUsed <= BADGES.silver.threshold) return BADGES.silver;
  if (percentUsed <= BADGES.bronze.threshold) return BADGES.bronze;
  return null;
};

// Individual Category Card with Badge
const CategoryBadgeCard = ({ category, data, currency = '₹' }) => {
  const percentUsed = data.budget > 0 ? Math.round((data.spent / data.budget) * 100) : 0;
  const badge = getBadge(percentUsed);
  const remaining = Math.max(0, data.budget - data.spent);
  const isOverBudget = percentUsed > 100;

  return (
    <div className={`bg-[#1a1a1a] border rounded-xl p-4 transition-all hover:shadow-lg ${
      badge 
        ? `border-[${badge.color}]/30 hover:border-[${badge.color}]`
        : 'border-[#ff6b6b]/30 hover:border-[#ff6b6b]'
    }`}>
      {/* Header with badge */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{data.icon || '📦'}</span>
          <span className="text-[#e0e0e0] font-bold uppercase text-sm">{category}</span>
        </div>
        {badge && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full" style={{ backgroundColor: `${badge.color}20` }}>
            <span>{badge.emoji}</span>
            <span className="text-xs font-bold" style={{ color: badge.color }}>{badge.label}</span>
          </div>
        )}
        {isOverBudget && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#ff6b6b]/20">
            <span>⚠️</span>
            <span className="text-xs font-bold text-[#ff6b6b]">OVER</span>
          </div>
        )}
      </div>

      {/* Amount */}
      <div className="mb-2">
        <span className="text-[#a0a0a0] text-sm">
          {currency}{data.spent.toLocaleString()} / {currency}{data.budget.toLocaleString()}
        </span>
        <span className={`ml-2 text-sm font-medium ${
          isOverBudget ? 'text-[#ff6b6b]' : badge?.color === '#FFD700' ? 'text-[#FFD700]' : 'text-[#00ff88]'
        }`}>
          ({percentUsed}% used)
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-[#333] rounded-full overflow-hidden mb-3">
        <div 
          className="h-full rounded-full transition-all duration-500"
          style={{ 
            width: `${Math.min(100, percentUsed)}%`,
            backgroundColor: badge?.color || '#ff6b6b'
          }}
        />
      </div>

      {/* Message */}
      <p className="text-sm" style={{ color: badge?.color || '#ff6b6b' }}>
        {badge ? badge.message : `Over budget by ${currency}${Math.abs(remaining).toLocaleString()}`}
      </p>
    </div>
  );
};

// Main component showing all category badges
const CategoryBadges = ({ categoryBreakdown = {}, currency = '₹' }) => {
  const badgeStats = useMemo(() => {
    const categories = Object.entries(categoryBreakdown)
      .filter(([_, data]) => data.budget > 0)
      .map(([name, data]) => {
        const percentUsed = Math.round((data.spent / data.budget) * 100);
        return { name, ...data, percentUsed, badge: getBadge(percentUsed) };
      });

    const goldCount = categories.filter(c => c.badge === BADGES.gold).length;
    const silverCount = categories.filter(c => c.badge === BADGES.silver).length;
    const bronzeCount = categories.filter(c => c.badge === BADGES.bronze).length;
    const overBudgetCount = categories.filter(c => !c.badge).length;

    return { categories, goldCount, silverCount, bronzeCount, overBudgetCount };
  }, [categoryBreakdown]);

  const { categories, goldCount, silverCount, bronzeCount, overBudgetCount } = badgeStats;

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-[#e0e0e0] flex items-center gap-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          <Medal className="text-[#FFD700]" size={24} />
          Category Champions
        </h3>
      </div>

      {/* Badge Summary */}
      <div className="flex items-center justify-center gap-6 mb-6 p-4 bg-[#0f0f0f] rounded-xl">
        <div className="text-center">
          <div className="text-2xl mb-1">🥇</div>
          <div className="text-[#FFD700] font-bold text-xl">{goldCount}</div>
          <div className="text-[#666] text-xs">Gold</div>
        </div>
        <div className="text-center">
          <div className="text-2xl mb-1">🥈</div>
          <div className="text-[#C0C0C0] font-bold text-xl">{silverCount}</div>
          <div className="text-[#666] text-xs">Silver</div>
        </div>
        <div className="text-center">
          <div className="text-2xl mb-1">🥉</div>
          <div className="text-[#CD7F32] font-bold text-xl">{bronzeCount}</div>
          <div className="text-[#666] text-xs">Bronze</div>
        </div>
        {overBudgetCount > 0 && (
          <div className="text-center">
            <div className="text-2xl mb-1">⚠️</div>
            <div className="text-[#ff6b6b] font-bold text-xl">{overBudgetCount}</div>
            <div className="text-[#666] text-xs">Over</div>
          </div>
        )}
      </div>

      {/* Badge Criteria */}
      <div className="mb-6 p-3 bg-[#0f0f0f] rounded-lg">
        <p className="text-[#666] text-xs uppercase tracking-wide mb-2">How badges are earned:</p>
        <div className="flex flex-wrap gap-4 text-sm">
          <span className="text-[#FFD700]">🥇 0-50% spent</span>
          <span className="text-[#C0C0C0]">🥈 51-80% spent</span>
          <span className="text-[#CD7F32]">🥉 81-100% spent</span>
        </div>
      </div>

      {/* Category Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories
          .sort((a, b) => a.percentUsed - b.percentUsed)
          .map(category => (
            <CategoryBadgeCard 
              key={category.name}
              category={category.name}
              data={category}
              currency={currency}
            />
          ))}
      </div>

      {/* Achievement message */}
      {goldCount >= 3 && (
        <div className="mt-6 bg-gradient-to-r from-[#FFD700]/10 to-[#1a1a1a] border border-[#FFD700]/30 rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="text-[#FFD700]" size={20} />
            <span className="text-[#FFD700] font-bold">Triple Gold Champion!</span>
            <Sparkles className="text-[#FFD700]" size={20} />
          </div>
          <p className="text-[#a0a0a0] text-sm">You earned 3+ gold badges this month!</p>
        </div>
      )}
    </div>
  );
};

export default CategoryBadges;
export { CategoryBadgeCard, getBadge, BADGES };
