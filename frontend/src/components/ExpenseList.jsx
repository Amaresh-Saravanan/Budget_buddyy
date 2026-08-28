import React, { useState } from 'react'
import { Trash2, Mail, AlertTriangle } from 'lucide-react'
import { CATEGORY_ICONS as categoryIcons, EXPENSE_CATEGORIES } from '../constants/categories'

const isAutoImported = (expense) => Array.isArray(expense.tags) && expense.tags.includes('auto-imported')

function ReviewQueue({ expenses, onUpdate }) {
  const needsReview = expenses.filter((exp) => isAutoImported(exp) && exp.category === 'Other')

  if (needsReview.length === 0) return null

  return (
    <div className="bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-xl p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle size={16} className="text-[#FFD700]" />
        <h3 className="text-[#FFD700] font-medium text-sm">
          {needsReview.length} imported transaction{needsReview.length === 1 ? '' : 's'} need{needsReview.length === 1 ? 's' : ''} a category
        </h3>
      </div>
      <div className="space-y-2">
        {needsReview.map((expense) => (
          <div
            key={expense.id}
            className="flex items-center justify-between gap-3 bg-[#0f0f0f] rounded-lg px-4 py-3"
          >
            <div className="min-w-0">
              <div className="font-medium text-[#e0e0e0] truncate">{expense.description}</div>
              <div className="text-[#ff4444] text-sm">-{expense.amount.toFixed(2)}</div>
            </div>
            <select
              value={expense.category}
              onChange={(e) => onUpdate({ ...expense, category: e.target.value })}
              className="bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-sm text-[#e0e0e0] focus:border-[#FFD700] focus:outline-none"
            >
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  )
}

const ExpenseList = ({ expenses, onDelete, onUpdate }) => {
  const getTimeAgo = (date) => {
    const then = new Date(date).getTime()
    if (Number.isNaN(then)) return ''

    const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000))
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

      <ReviewQueue expenses={expenses} onUpdate={onUpdate} />

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
            expenses.map((expense) => {
              const imported = isAutoImported(expense)
              // For manually-added expenses note and description are the same
              // text; for auto-imported ones description is the merchant name
              // and note carries the raw bank-email details, so only show the
              // note separately when it actually differs.
              const title = expense.description || expense.note || expense.category
              const secondaryNote = expense.note && expense.note !== title ? expense.note : null

              return (
                <div
                  key={expense.id}
                  className="group flex items-center justify-between p-4 bg-[#0f0f0f] rounded-lg border border-[#333] hover:border-[#bb86fc] transition-all duration-200 hover:shadow-[0_0_15px_rgba(187,134,252,0.2)]"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 bg-[#1a1a1a] rounded-lg flex items-center justify-center text-2xl border border-[#333] shrink-0">
                      {categoryIcons[expense.category]}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium flex items-center gap-2">
                        <span className="truncate">{title}</span>
                        {imported && (
                          <span title="Auto-imported from a forwarded bank email" className="shrink-0 text-[#4ecdc4]">
                            <Mail size={13} />
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-[#a0a0a0] flex items-center gap-2">
                        <span>{expense.category}</span>
                        <span>•</span>
                        <span>{getTimeAgo(expense.date)}</span>
                      </div>
                      {secondaryNote && (
                        <div className="text-xs text-[#666] truncate mt-0.5">{secondaryNote}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-[#ff4444] font-bold text-lg">-{expense.amount.toFixed(2)}</div>
                    <button
                      onClick={() => onDelete(expense.id)}
                      className="text-[#ff4444] opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

export default ExpenseList;
