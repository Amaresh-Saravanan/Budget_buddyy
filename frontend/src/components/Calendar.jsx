import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X, Edit2, TrendingDown, TrendingUp } from 'lucide-react';

// Category icons mapping
const categoryIcons = {
  Food: '🍔',
  Transport: '🚗',
  Fun: '🎮',
  Bills: '📱',
  Others: '➕'
};

const Calendar = ({ expenses = [] }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showComparison, setShowComparison] = useState(false);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  
  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // Process expenses into daily data
  const processExpensesForCalendar = () => {
    const dailyData = {};
    
    expenses.forEach(expense => {
      const dateStr = expense.date;
      if (!dailyData[dateStr]) {
        dailyData[dateStr] = {
          expenses: [],
          totalSpent: 0,
          saved: 0,
          dailyAllowance: 500 // This should come from user settings
        };
      }
      
      dailyData[dateStr].expenses.push(expense);
      dailyData[dateStr].totalSpent += expense.amount;
    });
    
    return dailyData;
  };

  const expenseData = processExpensesForCalendar();

  // Get days in month
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  // Get date string
  const getDateString = (year, month, day) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  // Navigate months
  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Get day status
  const getDayStatus = (dateStr, data) => {
    if (!data) return null;
    
    const { totalSpent, saved, dailyAllowance } = data;
    
    if (totalSpent === 0 && saved > 0) return 'double-win';
    if (totalSpent === 0) return 'no-spend';
    if (saved > 0) return 'saved';
    if (totalSpent > dailyAllowance) return 'overspent';
    return 'normal';
  };

  // Get border color
  const getBorderColor = (status) => {
    switch (status) {
      case 'double-win': return 'border-[#FFD700] shadow-[0_0_10px_rgba(255,215,0,0.3)]';
      case 'no-spend': return 'border-[#FFD700]';
      case 'saved': return 'border-[#00ff88]';
      case 'overspent': return 'border-[#ff4444]';
      default: return 'border-[#333]';
    }
  };

  // Render calendar
  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
    const days = [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const today = new Date();

    // Empty cells
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square" />);
    }

    // Actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = getDateString(year, month, day);
      const dayData = expenseData[dateStr];
      const status = getDayStatus(dateStr, dayData);
      const isToday = today.getDate() === day && 
                      today.getMonth() === month && 
                      today.getFullYear() === year;
      
      days.push(
        <div
          key={day}
          onClick={() => dayData && setSelectedDate({ date: dateStr, data: dayData })}
          className={`aspect-square p-2 rounded-lg border-2 transition-all cursor-pointer
            ${getBorderColor(status)}
            ${isToday ? 'bg-[#bb86fc]/20' : 'bg-[#1a1a1a]'}
            ${dayData ? 'hover:border-[#bb86fc] hover:shadow-[0_0_15px_rgba(187,134,252,0.2)]' : 'opacity-50'}
          `}
        >
          <div className="flex flex-col items-center justify-center h-full text-xs">
            <div className="font-bold mb-1">{day}</div>
            
            {dayData && (
              <>
                <div className="flex items-center gap-1 text-[10px]">
                  {status === 'double-win' && <span>🏆</span>}
                  {status === 'no-spend' && <span>⭐</span>}
                  {status !== 'double-win' && status !== 'no-spend' && (
                    <span className="text-[#ff4444]">💸{dayData.totalSpent}</span>
                  )}
                </div>
                {dayData.saved > 0 && (
                  <div className="text-[10px] text-[#00ff88]">💰{dayData.saved}</div>
                )}
              </>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  return (
    <div className="space-y-6">
      {/* Calendar Card */}
      <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333] shadow-lg">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={previousMonth}
            className="w-10 h-10 rounded-lg bg-[#0f0f0f] border border-[#333] hover:border-[#bb86fc] flex items-center justify-center transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          
          <h2 className="text-xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          
          <button
            onClick={nextMonth}
            className="w-10 h-10 rounded-lg bg-[#0f0f0f] border border-[#333] hover:border-[#bb86fc] flex items-center justify-center transition-all"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Day Names */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {dayNames.map(day => (
            <div key={day} className="text-center text-[#a0a0a0] text-sm font-medium">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {renderCalendar()}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-6 border-t border-[#333]">
          <p className="text-xs text-[#a0a0a0] uppercase tracking-wide mb-3">Legend</p>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 border-[#00ff88]" />
              <span>Saved money</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 border-[#ff4444]" />
              <span>Overspent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 border-[#FFD700]" />
              <span className="flex items-center gap-1">No-spend day <span>⭐</span></span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 border-[#FFD700] shadow-[0_0_10px_rgba(255,215,0,0.3)]" />
              <span className="flex items-center gap-1">Double win <span>🏆</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Detail Drawer */}
      {selectedDate && (
        <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-50 backdrop-blur-sm" onClick={() => setSelectedDate(null)}>
          <div className="bg-[#1a1a1a] rounded-t-2xl w-full max-w-2xl border-t-2 border-[#bb86fc] shadow-2xl animate-slide-up max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {new Date(selectedDate.date).toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </h2>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="text-[#a0a0a0] hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Spending Summary */}
              <div className="bg-[#0f0f0f] rounded-lg p-4 mb-6 border border-[#333]">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[#a0a0a0] text-sm uppercase tracking-wide">💸 Spent</span>
                  <span className="text-2xl font-bold text-[#ff4444]">
                    {selectedDate.data.totalSpent.toFixed(2)}
                  </span>
                </div>

                {/* Expense List */}
                <div className="space-y-2 mb-4">
                  {selectedDate.data.expenses.map(expense => (
                    <div key={expense.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span>{categoryIcons[expense.category]}</span>
                        <span>{expense.note}</span>
                      </div>
                      <span className="text-[#ff4444]">-{expense.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {selectedDate.data.expenses.length === 0 && (
                  <div className="text-center py-4 text-[#a0a0a0]">
                    <span className="text-3xl mb-2 block">⭐</span>
                    <p>No expenses today!</p>
                  </div>
                )}
              </div>

              {/* Savings */}
              <div className="bg-[#0f0f0f] rounded-lg p-4 mb-6 border border-[#333]">
                <div className="flex items-center justify-between">
                  <span className="text-[#a0a0a0] text-sm uppercase tracking-wide">💰 Saved</span>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-[#00ff88]">
                      {selectedDate.data.saved.toFixed(2)}
                    </span>
                    <button className="text-[#bb86fc] hover:text-[#a370e6] transition-colors">
                      <Edit2 size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="bg-[#0f0f0f] rounded-lg p-4 border border-[#333]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[#a0a0a0] text-sm">Daily Allowance</span>
                  <span className="font-bold">{selectedDate.data.dailyAllowance.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#a0a0a0] text-sm">Status</span>
                  <span className={`font-bold flex items-center gap-2 ${
                    selectedDate.data.totalSpent <= selectedDate.data.dailyAllowance
                      ? 'text-[#00ff88]'
                      : 'text-[#ff4444]'
                  }`}>
                    {selectedDate.data.totalSpent <= selectedDate.data.dailyAllowance
                      ? 'Under budget ✅'
                      : 'Over budget ⚠️'}
                  </span>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setSelectedDate(null)}
                className="w-full mt-6 bg-[#bb86fc] hover:bg-[#a370e6] text-white py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-[0_0_20px_rgba(187,134,252,0.5)]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
