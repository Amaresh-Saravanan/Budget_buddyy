import React, { useState } from 'react'
import { Edit2, Trash2, Plus } from 'lucide-react'

const categoryIcons = {
  Food: '🍔',
  Transport: '🚗',
  Fun: '🎮',
  Bills: '📱',
  Others: '➕'
}

const ExpenseList = ({ expenses, onDelete, onUpdate }) => {
  const [editingExpense, setEditingExpense] = useState(null)

  const getTimeAgo = (timestamp) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'Just now'
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Expenses
        </h1>
        <p className="text-[#a0a0a0] text-sm">Detailed list of your transactions.</p>
      </div>

      <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333] shadow-lg">
        <h2 className="text-xl font-bold mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Recent Expenses
        </h2>
        
        <div className="space-y-3">
          {expenses.length === 0 ? (
            <div className="text-center py-12 text-[#a0a0a0]">
              <div className="text-5xl mb-4">💸</div>
              <p className="text-lg mb-2">No expenses yet</p>
              <p className="text-sm">Click "Add Expense" to start tracking</p>
            </div>
          ) : (
            expenses.map((expense) => (
              <div
                key={expense.id}
                className="group flex items-center justify-between p-4 bg-[#0f0f0f] rounded-lg border border-[#333] hover:border-[#bb86fc] transition-all duration-200 hover:shadow-[0_0_15px_rgba(187,134,252,0.2)]"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#1a1a1a] rounded-lg flex items-center justify-center text-2xl border border-[#333]">
                    {categoryIcons[expense.category]}
                  </div>
                  <div>
                    <div className="font-medium">{expense.note}</div>
                    <div className="text-sm text-[#a0a0a0] flex items-center gap-2">
                      <span>{expense.category}</span>
                      <span>•</span>
                      <span>{getTimeAgo(expense.timestamp)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-[#ff4444] font-bold text-lg">-{expense.amount.toFixed(2)}</div>
                  <button 
                    onClick={() => onDelete(expense.id)}
                    className="text-[#ff4444] opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default ExpenseList;