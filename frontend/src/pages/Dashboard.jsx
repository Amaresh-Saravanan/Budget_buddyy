import { useMemo } from 'react'

function Dashboard({ expenses, savings, reminders }) {
  const stats = useMemo(() => {
    const totalExpenses = expenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0)
    const totalSavings = savings.reduce((sum, sav) => sum + (parseFloat(sav.amount) || 0), 0)
    const pendingReminders = reminders.filter(rem => !rem.completed).length
    
    // Get this month's expenses
    const now = new Date()
    const thisMonthExpenses = expenses.filter(exp => {
      const expDate = new Date(exp.date)
      return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear()
    })
    const monthlyTotal = thisMonthExpenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0)

    // Get expense categories breakdown
    const categoryBreakdown = expenses.reduce((acc, exp) => {
      const category = exp.category || 'Other'
      acc[category] = (acc[category] || 0) + (parseFloat(exp.amount) || 0)
      return acc
    }, {})

    return {
      totalExpenses,
      totalSavings,
      pendingReminders,
      monthlyTotal,
      expenseCount: expenses.length,
      savingsCount: savings.length,
      categoryBreakdown,
      netBalance: totalSavings - totalExpenses
    }
  }, [expenses, savings, reminders])

  const recentExpenses = expenses.slice(0, 5)

  return (
    <div className="max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold text-[#bb86fc] mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
        Dashboard Overview
      </h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Expenses Card */}
        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 hover:border-[#bb86fc] transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[#a0a0a0] text-sm">Total Expenses</span>
            <span className="text-2xl">💸</span>
          </div>
          <p className="text-3xl font-bold text-[#ff6b6b]">
            ${stats.totalExpenses.toFixed(2)}
          </p>
          <p className="text-[#666] text-sm mt-1">{stats.expenseCount} transactions</p>
        </div>

        {/* Total Savings Card */}
        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 hover:border-[#00ff88] transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[#a0a0a0] text-sm">Total Savings</span>
            <span className="text-2xl">💰</span>
          </div>
          <p className="text-3xl font-bold text-[#00ff88]">
            ${stats.totalSavings.toFixed(2)}
          </p>
          <p className="text-[#666] text-sm mt-1">{stats.savingsCount} goals</p>
        </div>

        {/* This Month Card */}
        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 hover:border-[#bb86fc] transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[#a0a0a0] text-sm">This Month</span>
            <span className="text-2xl">📅</span>
          </div>
          <p className="text-3xl font-bold text-[#bb86fc]">
            ${stats.monthlyTotal.toFixed(2)}
          </p>
          <p className="text-[#666] text-sm mt-1">spent this month</p>
        </div>

        {/* Pending Reminders Card */}
        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 hover:border-[#FFD700] transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[#a0a0a0] text-sm">Pending Reminders</span>
            <span className="text-2xl">🔔</span>
          </div>
          <p className="text-3xl font-bold text-[#FFD700]">
            {stats.pendingReminders}
          </p>
          <p className="text-[#666] text-sm mt-1">tasks to complete</p>
        </div>
      </div>

      {/* Net Balance Banner */}
      <div className={`rounded-xl p-6 mb-8 ${stats.netBalance >= 0 ? 'bg-gradient-to-r from-[#00ff88]/20 to-[#1a1a1a]' : 'bg-gradient-to-r from-[#ff6b6b]/20 to-[#1a1a1a]'}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[#a0a0a0] text-sm mb-1">Net Balance</p>
            <p className={`text-4xl font-bold ${stats.netBalance >= 0 ? 'text-[#00ff88]' : 'text-[#ff6b6b]'}`}>
              {stats.netBalance >= 0 ? '+' : '-'}${Math.abs(stats.netBalance).toFixed(2)}
            </p>
          </div>
          <div className="text-6xl opacity-50">
            {stats.netBalance >= 0 ? '📈' : '📉'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Expenses */}
        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6">
          <h3 className="text-xl font-semibold text-[#e0e0e0] mb-4">Recent Expenses</h3>
          {recentExpenses.length > 0 ? (
            <div className="space-y-3">
              {recentExpenses.map((expense, index) => (
                <div key={expense.id || index} className="flex items-center justify-between py-2 border-b border-[#333] last:border-0">
                  <div>
                    <p className="text-[#e0e0e0]">{expense.description || 'Untitled'}</p>
                    <p className="text-[#666] text-sm">{expense.category || 'Other'}</p>
                  </div>
                  <p className="text-[#ff6b6b] font-semibold">-${parseFloat(expense.amount || 0).toFixed(2)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#666] text-center py-8">No expenses yet. Start tracking!</p>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6">
          <h3 className="text-xl font-semibold text-[#e0e0e0] mb-4">Spending by Category</h3>
          {Object.keys(stats.categoryBreakdown).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(stats.categoryBreakdown)
                .sort(([,a], [,b]) => b - a)
                .map(([category, amount]) => {
                  const percentage = stats.totalExpenses > 0 ? (amount / stats.totalExpenses) * 100 : 0
                  return (
                    <div key={category}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-[#e0e0e0]">{category}</span>
                        <span className="text-[#a0a0a0]">${amount.toFixed(2)} ({percentage.toFixed(0)}%)</span>
                      </div>
                      <div className="h-2 bg-[#333] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[#bb86fc] to-[#00ff88] rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
            </div>
          ) : (
            <p className="text-[#666] text-center py-8">No categories to display yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
