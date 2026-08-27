import { useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { Trash2, RefreshCw, Plus } from 'lucide-react'
import { syncAPI } from '../services/api'

const CATEGORY_ICONS = {
  Salary: '💼',
  Transfer: '🔁',
  Refund: '↩️',
  Other: '💵'
}

function getTimeAgo(date) {
  const diffMs = Date.now() - new Date(date).getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return new Date(date).toLocaleDateString()
}

function Income({ incomes = [], onAddIncome, onDeleteIncome, onSyncComplete, currency = '₹' }) {
  const { getToken } = useAuth()
  const [showForm, setShowForm] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')
  const [form, setForm] = useState({ amount: '', source: '', category: 'Other', note: '' })

  const total = incomes.reduce((sum, inc) => sum + (parseFloat(inc.amount) || 0), 0)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.amount || !form.source) return
    onAddIncome({
      amount: parseFloat(form.amount),
      source: form.source,
      category: form.category,
      note: form.note,
      date: new Date().toISOString()
    })
    setForm({ amount: '', source: '', category: 'Other', note: '' })
    setShowForm(false)
  }

  const handleSyncNow = async () => {
    setIsSyncing(true)
    setSyncMessage('')
    try {
      const token = await getToken()
      const response = await syncAPI.triggerGmailSync(token)
      if (response.success) {
        const { synced, skipped, reason } = response.data
        if (skipped) {
          setSyncMessage(reason || 'Sync not configured yet')
        } else {
          setSyncMessage(synced > 0 ? `Imported ${synced} new transaction(s)` : 'No new transactions found')
          if (synced > 0 && onSyncComplete) onSyncComplete()
        }
      }
    } catch (error) {
      setSyncMessage('Sync failed — check backend logs')
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-[#00ff88]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            💵 Income
          </h2>
          <p className="text-[#666] text-sm">Money coming in — manual or auto-imported from bank alerts.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSyncNow}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-[#333] text-[#4ecdc4] rounded-lg font-medium hover:border-[#4ecdc4] transition-all disabled:opacity-50"
          >
            <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'Syncing…' : 'Sync Bank Emails'}
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-[#00ff88] text-[#0f0f0f] rounded-lg font-medium hover:bg-[#00e67a] transition-all"
          >
            <Plus size={16} /> Add Income
          </button>
        </div>
      </div>

      {syncMessage && (
        <div className="bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-3 text-sm text-[#a0a0a0]">
          {syncMessage}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 space-y-4 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[#666] text-sm mb-1 block">Amount</label>
              <input
                type="number"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full bg-[#0f0f0f] border border-[#333] rounded-lg px-4 py-3 text-[#e0e0e0] focus:border-[#00ff88] focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="text-[#666] text-sm mb-1 block">Source</label>
              <input
                type="text"
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                placeholder="e.g. Salary, Freelance client"
                className="w-full bg-[#0f0f0f] border border-[#333] rounded-lg px-4 py-3 text-[#e0e0e0] focus:border-[#00ff88] focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="text-[#666] text-sm mb-1 block">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full bg-[#0f0f0f] border border-[#333] rounded-lg px-4 py-3 text-[#e0e0e0] focus:border-[#00ff88] focus:outline-none"
              >
                {Object.keys(CATEGORY_ICONS).map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[#666] text-sm mb-1 block">Note (optional)</label>
              <input
                type="text"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                className="w-full bg-[#0f0f0f] border border-[#333] rounded-lg px-4 py-3 text-[#e0e0e0] focus:border-[#00ff88] focus:outline-none"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="px-6 py-2 bg-[#00ff88] text-[#0f0f0f] rounded-lg font-medium hover:bg-[#00e67a] transition-all">
              Save
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 bg-[#333] text-[#e0e0e0] rounded-lg font-medium hover:bg-[#444] transition-all">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="bg-gradient-to-r from-[#00ff88]/10 to-[#1a1a1a] border border-[#333] rounded-2xl p-6 text-center">
        <p className="text-[#a0a0a0] text-sm mb-1">Total Income</p>
        <p className="text-5xl font-bold text-[#00ff88]">{currency}{total.toLocaleString('en-IN')}</p>
        <p className="text-[#666] mt-1">{incomes.length} entries</p>
      </div>

      <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333]">
        <h3 className="text-xl font-semibold text-[#e0e0e0] mb-4">All Income</h3>
        {incomes.length === 0 ? (
          <div className="text-center py-12 text-[#a0a0a0]">
            <div className="text-5xl mb-4">💵</div>
            <p className="text-lg mb-2">No income yet</p>
            <p className="text-sm">Add manually, or sync your bank alert emails above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {incomes.map((income) => (
              <div
                key={income.id}
                className="group flex items-center justify-between p-4 bg-[#0f0f0f] rounded-lg border border-[#333] hover:border-[#00ff88] transition-all duration-200"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#1a1a1a] rounded-lg flex items-center justify-center text-2xl border border-[#333]">
                    {CATEGORY_ICONS[income.category] || CATEGORY_ICONS.Other}
                  </div>
                  <div>
                    <div className="font-medium text-[#e0e0e0]">{income.source}</div>
                    <div className="text-sm text-[#a0a0a0] flex items-center gap-2">
                      <span>{income.category}</span>
                      <span>•</span>
                      <span>{getTimeAgo(income.date)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-[#00ff88] font-bold text-lg">+{currency}{parseFloat(income.amount).toLocaleString('en-IN')}</div>
                  <button
                    onClick={() => onDeleteIncome(income.id)}
                    className="text-[#ff6b6b] opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Income
