import React, { useState } from 'react';
import { Plus, Target, TrendingUp, Edit2, Trash2, X, PiggyBank } from 'lucide-react';

const Savings = ({ savings = [], onAddSaving, onUpdateSaving, onDeleteSaving }) => {
  const [showAddSaving, setShowAddSaving] = useState(false);
  const [editingSaving, setEditingSaving] = useState(null);

  // Calculate total saved
  const totalSaved = savings.reduce((sum, saving) => sum + saving.amount, 0);

  // Get time ago
  const getTimeAgo = (timestamp) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Savings
        </h1>
        <p className="text-[#a0a0a0] text-sm">Track your savings and watch your money grow.</p>
      </div>

      {/* Add Saving Button */}
      <button
        onClick={() => setShowAddSaving(true)}
        className="mb-6 bg-[#00ff88] hover:bg-[#00dd77] text-[#0f0f0f] px-6 py-3 rounded-lg flex items-center gap-2 font-bold transition-all duration-200 hover:shadow-[0_0_20px_rgba(0,255,136,0.5)]"
      >
        <Plus size={20} />
        Add Saving
      </button>

      {/* Total Saved Card */}
      <div className="bg-gradient-to-r from-[#00ff88]/20 to-[#00ff88]/10 rounded-xl p-6 border border-[#00ff88] shadow-lg mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[#a0a0a0] text-sm uppercase tracking-wide mb-2">Total Saved</p>
            <h2 className="text-4xl font-bold text-[#00ff88]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {totalSaved.toFixed(2)}
            </h2>
          </div>
          <div className="w-16 h-16 bg-[#00ff88] rounded-full flex items-center justify-center">
            <PiggyBank size={32} className="text-[#0f0f0f]" />
          </div>
        </div>
      </div>

      {/* Savings List */}
      <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333] shadow-lg">
        <h2 className="text-xl font-bold mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Recent Savings
        </h2>
        
        <div className="space-y-3">
          {savings.length === 0 ? (
            <div className="text-center py-12 text-[#a0a0a0]">
              <div className="text-5xl mb-4">🐷</div>
              <p className="text-lg mb-2">No savings yet</p>
              <p className="text-sm">Click "Add Saving" to start saving money</p>
            </div>
          ) : (
            savings.slice(0, 10).map((saving) => (
              <div
                key={saving.id}
                onClick={() => setEditingSaving({ ...saving })}
                className="group flex items-center justify-between p-4 bg-[#0f0f0f] rounded-lg border border-[#333] hover:border-[#00ff88] transition-all duration-200 cursor-pointer hover:shadow-[0_0_15px_rgba(0,255,136,0.2)]"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#00ff88]/20 rounded-lg flex items-center justify-center text-2xl border border-[#00ff88]">
                    💰
                  </div>
                  <div>
                    <div className="font-medium">{saving.note}</div>
                    <div className="text-sm text-[#a0a0a0] flex items-center gap-2">
                      <span>{new Date(saving.date).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{getTimeAgo(saving.timestamp)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-[#00ff88] font-bold text-lg">+{saving.amount.toFixed(2)}</div>
                  <Edit2 size={18} className="text-[#a0a0a0] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))
          )}
        </div>

        {savings.length > 0 && (
          <button className="w-full mt-6 text-[#00ff88] hover:text-[#00dd77] font-medium py-3 border border-[#333] rounded-lg hover:border-[#00ff88] transition-all duration-200">
            View All Savings →
          </button>
        )}
      </div>

      {/* Add Saving Modal */}
      {showAddSaving && (
        <AddSavingModal 
          onClose={() => setShowAddSaving(false)}
          onAddSaving={(saving) => {
            onAddSaving(saving);
            setShowAddSaving(false);
          }}
        />
      )}

      {/* Edit Saving Modal */}
      {editingSaving && (
        <EditSavingModal
          saving={editingSaving}
          onClose={() => setEditingSaving(null)}
          onUpdate={(updated) => {
            onUpdateSaving(updated);
            setEditingSaving(null);
          }}
          onDelete={(id) => {
            onDeleteSaving(id);
            setEditingSaving(null);
          }}
        />
      )}
    </div>
  );
};

// Add Saving Modal Component
const AddSavingModal = ({ onClose, onAddSaving }) => {
  const [formData, setFormData] = useState({
    amount: '',
    note: '',
    date: new Date().toISOString().split('T')[0]
  });

  const quickAmounts = [100, 500, 1000];

  const handleSubmit = () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) return;

    const newSaving = {
      id: Date.now(),
      amount: parseFloat(formData.amount),
      note: formData.note || 'Saved money',
      date: formData.date,
      timestamp: Date.now()
    };

    onAddSaving(newSaving);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] rounded-xl p-6 w-full max-w-md border border-[#333] shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Add Saving
          </h2>
          <button onClick={onClose} className="text-[#a0a0a0] hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        <p className="text-[#a0a0a0] text-sm mb-6">Track money you've saved.</p>

        <div className="space-y-6">
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium mb-3 uppercase tracking-wide">
              Amount
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full bg-[#0f0f0f] border-2 border-[#00ff88] rounded-lg px-4 py-3 text-lg focus:outline-none focus:shadow-[0_0_15px_rgba(0,255,136,0.5)] transition-all"
              placeholder="0"
              autoFocus
            />
          </div>

          {/* Quick Amounts */}
          <div>
            <p className="text-sm text-[#a0a0a0] mb-2 uppercase tracking-wide">Quick amounts:</p>
            <div className="flex gap-2">
              {quickAmounts.map((amount) => (
                <button
                  key={amount}
                  onClick={() => setFormData({ ...formData, amount: amount.toString() })}
                  className="flex-1 bg-[#0f0f0f] border border-[#333] hover:border-[#00ff88] rounded-lg py-2 transition-all hover:shadow-[0_0_10px_rgba(0,255,136,0.3)]"
                >
                  {amount}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium mb-2 uppercase tracking-wide">
              Note (Optional)
            </label>
            <input
              type="text"
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              className="w-full bg-[#0f0f0f] border border-[#333] focus:border-[#00ff88] rounded-lg px-4 py-3 focus:outline-none focus:shadow-[0_0_15px_rgba(0,255,136,0.3)] transition-all"
              placeholder="Emergency fund, Vacation..."
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium mb-2 uppercase tracking-wide">
              Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full bg-[#0f0f0f] border border-[#333] focus:border-[#00ff88] rounded-lg px-4 py-3 focus:outline-none focus:shadow-[0_0_15px_rgba(0,255,136,0.3)] transition-all"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-[#0f0f0f] border border-[#333] hover:border-[#00ff88] text-white py-3 rounded-lg font-medium transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!formData.amount || parseFloat(formData.amount) <= 0}
              className="flex-1 bg-[#00ff88] hover:bg-[#00dd77] disabled:bg-[#333] disabled:cursor-not-allowed text-[#0f0f0f] py-3 rounded-lg font-bold transition-all duration-200 hover:shadow-[0_0_20px_rgba(0,255,136,0.5)]"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Edit Saving Modal Component
const EditSavingModal = ({ saving, onClose, onUpdate, onDelete }) => {
  const [formData, setFormData] = useState({
    amount: saving.amount,
    note: saving.note,
    date: saving.date
  });

  const handleUpdate = () => {
    onUpdate({
      ...saving,
      amount: parseFloat(formData.amount),
      note: formData.note,
      date: formData.date
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] rounded-xl p-6 w-full max-w-md border border-[#333] shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Edit Saving
          </h2>
          <button onClick={onClose} className="text-[#a0a0a0] hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium mb-2 uppercase tracking-wide">Amount</label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
              className="w-full bg-[#0f0f0f] border-2 border-[#00ff88] rounded-lg px-4 py-3 focus:outline-none focus:shadow-[0_0_15px_rgba(0,255,136,0.5)] transition-all"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium mb-2 uppercase tracking-wide">Note</label>
            <input
              type="text"
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              className="w-full bg-[#0f0f0f] border border-[#333] focus:border-[#00ff88] rounded-lg px-4 py-3 focus:outline-none focus:shadow-[0_0_15px_rgba(0,255,136,0.3)] transition-all"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium mb-2 uppercase tracking-wide">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full bg-[#0f0f0f] border border-[#333] focus:border-[#00ff88] rounded-lg px-4 py-3 focus:outline-none focus:shadow-[0_0_15px_rgba(0,255,136,0.3)] transition-all"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => onDelete(saving.id)}
              className="flex-1 bg-[#ff4444] hover:bg-[#ff3333] text-white py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-[0_0_20px_rgba(255,68,68,0.5)] flex items-center justify-center gap-2"
            >
              <Trash2 size={18} />
              Delete
            </button>
            <button
              onClick={handleUpdate}
              className="flex-1 bg-[#00ff88] hover:bg-[#00dd77] text-[#0f0f0f] py-3 rounded-lg font-bold transition-all duration-200 hover:shadow-[0_0_20px_rgba(0,255,136,0.5)]"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Savings;