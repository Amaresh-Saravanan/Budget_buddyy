import React, { useMemo } from 'react';
import { Calendar, TrendingUp, TrendingDown, Target, Clock, CheckCircle } from 'lucide-react';

const WeeklyProgress = ({ expenses = [], monthlyBudget = 25000, currency = '₹' }) => {
  const weeklyStats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Calculate which week of the month we're in
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const dayOfMonth = now.getDate();
    const weekOfMonth = Math.ceil(dayOfMonth / 7);
    
    // Calculate weekly budget (monthly / 4.33 weeks average)
    const weeklyBudget = Math.round(monthlyBudget / 4.33);
    
    // Get start of current week (Sunday)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Get end of week (Saturday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    // Filter expenses for current week
    const weeklyExpenses = expenses.filter(exp => {
      const expDate = new Date(exp.date);
      return expDate >= startOfWeek && expDate <= endOfWeek;
    });
    
    const weeklySpent = weeklyExpenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
    const remaining = weeklyBudget - weeklySpent;
    const percentUsed = Math.round((weeklySpent / weeklyBudget) * 100);
    
    // Days remaining in the week
    const dayOfWeek = now.getDay(); // 0 = Sunday
    const daysRemaining = 6 - dayOfWeek + 1; // Including today
    const daysElapsed = dayOfWeek + 1;
    
    // Daily allowance for remaining days
    const dailyAllowance = daysRemaining > 0 ? Math.round(remaining / daysRemaining) : 0;
    
    // Determine status
    let status, statusColor, statusIcon, statusBg;
    if (percentUsed < 80) {
      status = 'On Track';
      statusColor = '#4ecdc4';
      statusIcon = '👍';
      statusBg = 'from-[#4ecdc4]/20';
    } else if (percentUsed < 100) {
      status = 'Be Careful';
      statusColor = '#FFD700';
      statusIcon = '⚠️';
      statusBg = 'from-[#FFD700]/20';
    } else {
      status = 'Over Budget';
      statusColor = '#ff6b6b';
      statusIcon = '🚨';
      statusBg = 'from-[#ff6b6b]/20';
    }
    
    // Get month name
    const monthName = now.toLocaleString('default', { month: 'long' });
    
    // Calculate ideal progress for this point in the week
    const idealPercent = Math.round((daysElapsed / 7) * 100);
    const isAheadOfPace = percentUsed > idealPercent;
    
    return {
      weekOfMonth,
      monthName,
      weeklyBudget,
      weeklySpent,
      remaining,
      percentUsed,
      daysRemaining,
      daysElapsed,
      dailyAllowance,
      status,
      statusColor,
      statusIcon,
      statusBg,
      idealPercent,
      isAheadOfPace,
      startOfWeek,
      endOfWeek
    };
  }, [expenses, monthlyBudget]);

  const {
    weekOfMonth,
    monthName,
    weeklyBudget,
    weeklySpent,
    remaining,
    percentUsed,
    daysRemaining,
    dailyAllowance,
    status,
    statusColor,
    statusIcon,
    statusBg,
    idealPercent,
    isAheadOfPace
  } = weeklyStats;

  // Get progress bar color
  const getProgressColor = () => {
    if (percentUsed < 80) return '#4ecdc4';
    if (percentUsed < 100) return '#FFD700';
    return '#ff6b6b';
  };

  return (
    <div className={`bg-gradient-to-br ${statusBg} to-[#1a1a1a] border border-[#333] rounded-xl p-6 shadow-lg`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#4ecdc4]/20 rounded-lg flex items-center justify-center border border-[#4ecdc4]">
            <Calendar className="text-[#4ecdc4]" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#e0e0e0]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              📅 Week {weekOfMonth} of {monthName}
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full" style={{ backgroundColor: `${statusColor}20` }}>
          <span className="text-lg">{statusIcon}</span>
          <span className="text-sm font-medium" style={{ color: statusColor }}>{status}</span>
        </div>
      </div>

      {/* Main Progress */}
      <div className="bg-[#0f0f0f] rounded-xl p-4 mb-4">
        {/* Amount Display */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-3xl font-bold text-[#e0e0e0]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {currency}{weeklySpent.toLocaleString()}
            </span>
            <span className="text-[#666] text-lg"> / {currency}{weeklyBudget.toLocaleString()}</span>
          </div>
          <span className={`text-lg font-bold ${
            percentUsed <= 100 ? 'text-[#00ff88]' : 'text-[#ff6b6b]'
          }`}>
            {percentUsed}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="relative h-4 bg-[#333] rounded-full overflow-hidden mb-4">
          {/* Ideal pace marker */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-white/50 z-10"
            style={{ left: `${idealPercent}%` }}
          />
          {/* Actual progress */}
          <div 
            className="h-full rounded-full transition-all duration-500"
            style={{ 
              width: `${Math.min(100, percentUsed)}%`,
              backgroundColor: getProgressColor()
            }}
          />
        </div>

        {/* Pace indicator */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#666]">
            Ideal pace: {idealPercent}%
          </span>
          <span className={isAheadOfPace ? 'text-[#ff6b6b]' : 'text-[#00ff88]'}>
            {isAheadOfPace ? (
              <span className="flex items-center gap-1">
                <TrendingUp size={14} /> {percentUsed - idealPercent}% ahead of pace
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <TrendingDown size={14} /> {idealPercent - percentUsed}% under pace ✓
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Remaining */}
        <div className="bg-[#0f0f0f] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target size={16} className="text-[#bb86fc]" />
            <span className="text-[#666] text-sm">Remaining</span>
          </div>
          <p className={`text-xl font-bold ${remaining >= 0 ? 'text-[#00ff88]' : 'text-[#ff6b6b]'}`}>
            {remaining >= 0 ? currency : '-' + currency}{Math.abs(remaining).toLocaleString()}
          </p>
          <p className="text-[#666] text-xs mt-1">for {daysRemaining} days</p>
        </div>

        {/* Daily Allowance */}
        <div className="bg-[#0f0f0f] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-[#4ecdc4]" />
            <span className="text-[#666] text-sm">Daily Allowance</span>
          </div>
          <p className={`text-xl font-bold ${dailyAllowance >= 0 ? 'text-[#4ecdc4]' : 'text-[#ff6b6b]'}`}>
            {dailyAllowance >= 0 ? currency : '-' + currency}{Math.abs(dailyAllowance).toLocaleString()}
          </p>
          <p className="text-[#666] text-xs mt-1">per day</p>
        </div>
      </div>

      {/* Tips based on status */}
      <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: `${statusColor}10`, borderColor: `${statusColor}30`, borderWidth: 1 }}>
        {percentUsed < 80 && (
          <p className="text-[#4ecdc4] text-sm flex items-center gap-2">
            <CheckCircle size={16} />
            Great job! You're well within your weekly budget.
          </p>
        )}
        {percentUsed >= 80 && percentUsed < 100 && (
          <p className="text-[#FFD700] text-sm flex items-center gap-2">
            ⚠️ Approaching limit. Try to keep daily spending under {currency}{dailyAllowance}.
          </p>
        )}
        {percentUsed >= 100 && (
          <p className="text-[#ff6b6b] text-sm flex items-center gap-2">
            🚨 Weekly budget exceeded. Consider a no-spend day to recover!
          </p>
        )}
      </div>

      {/* Color Legend */}
      <div className="mt-4 pt-4 border-t border-[#333]">
        <p className="text-[#666] text-xs uppercase tracking-wide mb-2">Status Guide</p>
        <div className="flex flex-wrap gap-4 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-[#4ecdc4]"></span>
            <span className="text-[#4ecdc4]">0-79% Safe</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-[#FFD700]"></span>
            <span className="text-[#FFD700]">80-99% Careful</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-[#ff6b6b]"></span>
            <span className="text-[#ff6b6b]">100%+ Danger</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default WeeklyProgress;
