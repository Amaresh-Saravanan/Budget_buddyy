import React, { useState, useMemo } from 'react'
import { Trash2, Mail, AlertTriangle, Edit2, X, Search } from 'lucide-react'
import { CATEGORY_ICONS as categoryIcons, EXPENSE_CATEGORIES } from '../constants/categories'

const isAutoImported = (expense) => Array.isArray(expense.tags) && expense.tags.includes('auto-imported')

// The stored date is a full timestamp; <input type="date"> needs YYYY-MM-DD.
const toDateInputValue = (date) => {
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  const offset = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - offset).toISOString().slice(0, 10)
}

function EditExpenseModal({ expense, onClose, onSave }) {
  const [form, setForm] = useState({
    amount: String(expense.amount ?? ''),
    category: expense.category || 'Other',
    description: expense.description || expense.note || '',
    date: toDateInputValue(expense.date)
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const amount = parseFloat(form.amount)
    if (!Number.isFinite(amount) || amount <= 0) return

    onSave({
      ...expense,
      amount,
      category: form.category,
      description: form.description,
      date: form.date ? new Date(form.date).toISOString() : expense.date
    })
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-[#1a1a1a] rounded-xl p-6 w-full max-w-md border border-[#333] shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Edit Expense
          </h2>
          <button onClick={onClose} className="text-[#a0a0a0] hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 uppercase tracking-wide text-[#a0a0a0]">Amount</label>
            <input
              type="number"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="w-full bg-[#0f0f0f] border border-[#333] focus:border-[#bb86fc] rounded-lg px-4 py-3 text-[#e0e0e0] focus:outline-none transition-all"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 uppercase tracking-wide text-[#a0a0a0]">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full bg-[#0f0f0f] border border-[#333] focus:border-[#bb86fc] rounded-lg px-4 py-3 text-[#e0e0e0] focus:outline-none transition-all"
            >
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{categoryIcons[cat]} {cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 uppercase tracking-wide text-[#a0a0a0]">Description</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-[#0f0f0f] border border-[#333] focus:border-[#bb86fc] rounded-lg px-4 py-3 text-[#e0e0e0] focus:outline-none transition-all"
              placeholder="What was it for?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 uppercase tracking-wide text-[#a0a0a0]">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full bg-[#0f0f0f] border border-[#333] focus:border-[#bb86fc] rounded-lg px-4 py-3 text-[#e0e0e0] focus:outline-none transition-all"
            />
          </div>

          {isAutoImported(expense) && expense.note && (
            <div className="bg-[#0f0f0f] border border-[#333] rounded-lg px-3 py-2">
              <p className="text-[#666] text-xs mb-1">From your bank email</p>
              <p className="text-[#a0a0a0] text-xs break-words">{expense.note}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[#333] text-[#e0e0e0] py-3 rounded-lg font-medium hover:bg-[#444] transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-[#bb86fc] hover:bg-[#a370e6] text-white py-3 rounded-lg font-medium transition-all"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

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
  const [editingExpense, setEditingExpense] = useState(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

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

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    // Date inputs give a local calendar day; widen the bounds to the whole
    // day so an expense recorded at 19:25 still matches a "to" of that date.
    const from = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : null
    const to = toDate ? new Date(`${toDate}T23:59:59.999`).getTime() : null

    return expenses.filter((exp) => {
      if (category !== 'All' && exp.category !== category) return false

      if (term) {
        const haystack = `${exp.description || ''} ${exp.note || ''} ${exp.category || ''}`.toLowerCase()
        if (!haystack.includes(term)) return false
      }

      const when = new Date(exp.date).getTime()
      if (from !== null && when < from) return false
      if (to !== null && when > to) return false

      return true
    })
  }, [expenses, search, category, fromDate, toDate])

  const filterActive = search.trim() !== '' || category !== 'All' || fromDate !== '' || toDate !== ''
  const filteredTotal = filtered.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0)

  const clearFilters = () => {
    setSearch('')
    setCategory('All')
    setFromDate('')
    setToDate('')
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

      {/* Search and filters */}
      <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#333] mb-4 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666]" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search description, note, or category…"
            className="w-full bg-[#0f0f0f] border border-[#333] focus:border-[#bb86fc] rounded-lg pl-9 pr-4 py-2.5 text-[#e0e0e0] focus:outline-none transition-all"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-[#0f0f0f] border border-[#333] focus:border-[#bb86fc] rounded-lg px-3 py-2 text-sm text-[#e0e0e0] focus:outline-none"
          >
            <option value="All">All categories</option>
            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <label className="text-[#666] text-xs uppercase tracking-wide">From</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-[#0f0f0f] border border-[#333] focus:border-[#bb86fc] rounded-lg px-3 py-2 text-sm text-[#e0e0e0] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-[#666] text-xs uppercase tracking-wide">To</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-[#0f0f0f] border border-[#333] focus:border-[#bb86fc] rounded-lg px-3 py-2 text-sm text-[#e0e0e0] focus:outline-none"
            />
          </div>

          {filterActive && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-sm text-[#a0a0a0] hover:text-[#bb86fc] transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {filterActive && (
          <p className="text-[#666] text-sm">
            {filtered.length} of {expenses.length} expenses ·{' '}
            <span className="text-[#ff6b6b]">₹{filteredTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span> total
          </p>
        )}
      </div>

      <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333] shadow-lg">
        <h2 className="text-xl font-bold mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          {filterActive ? 'Matching Expenses' : 'Recent Expenses'}
        </h2>

        <div className="space-y-3">
          {expenses.length === 0 ? (
            <div className="text-center py-12 text-[#a0a0a0]">
              <div className="text-5xl mb-4">💸</div>
              <p className="text-lg mb-2">No expenses yet</p>
              <p className="text-sm">Click "Add Expense" to start tracking</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-[#a0a0a0]">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-lg mb-2">Nothing matches those filters</p>
              <button onClick={clearFilters} className="text-sm text-[#bb86fc] hover:underline">
                Clear filters
              </button>
            </div>
          ) : (
            filtered.map((expense) => {
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
                      onClick={() => setEditingExpense(expense)}
                      title="Edit expense"
                      className="text-[#a0a0a0] opacity-0 group-hover:opacity-100 transition-opacity hover:text-[#bb86fc] hover:scale-110"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => onDelete(expense.id)}
                      title="Delete expense"
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

      {editingExpense && (
        <EditExpenseModal
          expense={editingExpense}
          onClose={() => setEditingExpense(null)}
          onSave={(updated) => {
            onUpdate(updated)
            setEditingExpense(null)
          }}
        />
      )}
    </div>
  )
}

export default ExpenseList;
