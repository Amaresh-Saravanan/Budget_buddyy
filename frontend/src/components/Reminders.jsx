import React, { useState } from 'react';
import { Bell, Plus, Edit2, Trash2, X, Calendar, Clock, Check, RotateCcw } from 'lucide-react';

// Midnight today, for comparing against a reminder's timestamp. The stored
// value is a full timestamp, so comparing it to a date-only string would be
// a string comparison that only works by accident.
const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const Reminders = ({ reminders = [], onAddReminder, onUpdateReminder, onDeleteReminder, onToggleComplete }) => {
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);

  // Sort reminders by date
  const sortedReminders = [...reminders].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const today = startOfToday().getTime();
  const unpaid = sortedReminders.filter(r => !r.isCompleted);
  const paid = sortedReminders.filter(r => r.isCompleted);
  const overdueReminders = unpaid.filter(r => new Date(r.date).getTime() < today);
  const upcomingReminders = unpaid.filter(r => new Date(r.date).getTime() >= today);

  const totalDue = unpaid.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Reminders
        </h1>
        <p className="text-[#a0a0a0] text-sm">Set reminders for bills, payments, and important dates.</p>
      </div>

      {/* Summary + Add */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <button
          onClick={() => setShowAddReminder(true)}
          className="bg-[#FFD700] hover:bg-[#F0C800] text-[#0f0f0f] px-6 py-3 rounded-lg flex items-center gap-2 font-bold transition-all duration-200 hover:shadow-[0_0_20px_rgba(255,215,0,0.5)]"
        >
          <Plus size={20} />
          Add Reminder
        </button>
        {unpaid.length > 0 && (
          <div className="text-sm text-[#a0a0a0]">
            <span className="text-[#FFD700] font-semibold">{unpaid.length}</span> unpaid
            {totalDue > 0 && <> · <span className="text-[#FFD700] font-semibold">₹{totalDue.toLocaleString('en-IN')}</span> due</>}
          </div>
        )}
      </div>

      {/* Overdue */}
      {overdueReminders.length > 0 && (
        <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#ff6b6b]/40 shadow-lg mb-6">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-[#ff6b6b]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            <Bell size={24} />
            Overdue
          </h2>
          <div className="space-y-3">
            {overdueReminders.map((reminder) => (
              <ReminderCard
                key={reminder.id}
                reminder={reminder}
                onEdit={setEditingReminder}
                onToggleComplete={onToggleComplete}
                isOverdue={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Reminders */}
      <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333] shadow-lg mb-6">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          <Bell className="text-[#FFD700]" size={24} />
          Upcoming Reminders
        </h2>

        <div className="space-y-3">
          {upcomingReminders.length === 0 ? (
            <div className="text-center py-12 text-[#a0a0a0]">
              <div className="text-5xl mb-4">🔔</div>
              <p className="text-lg mb-2">No upcoming reminders</p>
              <p className="text-sm">Click "Add Reminder" to create one</p>
            </div>
          ) : (
            upcomingReminders.map((reminder) => (
              <ReminderCard
                key={reminder.id}
                reminder={reminder}
                onEdit={setEditingReminder}
                onToggleComplete={onToggleComplete}
                isOverdue={false}
              />
            ))
          )}
        </div>
      </div>

      {/* Paid */}
      {paid.length > 0 && (
        <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333] shadow-lg">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-[#00ff88]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            <Check size={22} />
            Paid
          </h2>

          <div className="space-y-3">
            {paid.map((reminder) => (
              <ReminderCard
                key={reminder.id}
                reminder={reminder}
                onEdit={setEditingReminder}
                onToggleComplete={onToggleComplete}
                isOverdue={false}
              />
            ))}
          </div>
        </div>
      )}

      {/* Add Reminder Modal */}
      {showAddReminder && (
        <AddReminderModal 
          onClose={() => setShowAddReminder(false)}
          onAddReminder={(reminder) => {
            onAddReminder(reminder);
            setShowAddReminder(false);
          }}
        />
      )}

      {/* Edit Reminder Modal */}
      {editingReminder && (
        <EditReminderModal
          reminder={editingReminder}
          onClose={() => setEditingReminder(null)}
          onUpdate={(updated) => {
            onUpdateReminder(updated);
            setEditingReminder(null);
          }}
          onDelete={(id) => {
            onDeleteReminder(id);
            setEditingReminder(null);
          }}
        />
      )}
    </div>
  );
};

// Reminder Card Component
const ReminderCard = ({ reminder, onEdit, onToggleComplete, isOverdue }) => {
  const isPaid = Boolean(reminder.isCompleted);

  const getDaysUntil = (date) => {
    const today = startOfToday();
    const reminderDate = new Date(date);
    reminderDate.setHours(0, 0, 0, 0);
    const diffDays = Math.round((reminderDate.getTime() - today.getTime()) / 86400000);

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
    return `In ${diffDays} days`;
  };

  const accent = isPaid ? '#00ff88' : isOverdue ? '#ff6b6b' : '#FFD700';

  return (
    <div
      className={`group flex items-center justify-between gap-3 p-4 bg-[#0f0f0f] rounded-lg border transition-all duration-200 ${
        isPaid ? 'border-[#333] opacity-60' : 'border-[#333] hover:border-[#FFD700] hover:shadow-[0_0_15px_rgba(255,215,0,0.2)]'
      }`}
    >
      <button
        onClick={() => onToggleComplete(reminder)}
        title={isPaid ? 'Mark as unpaid' : 'Mark as paid'}
        className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center border transition-all ${
          isPaid
            ? 'bg-[#00ff88]/15 border-[#00ff88] text-[#00ff88] hover:bg-[#00ff88]/25'
            : 'bg-[#1a1a1a] border-[#444] text-[#666] hover:border-[#00ff88] hover:text-[#00ff88]'
        }`}
      >
        {isPaid ? <Check size={18} /> : <span className="text-lg">🔔</span>}
      </button>

      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onEdit({ ...reminder })}>
        <div className={`font-medium truncate ${isPaid ? 'line-through text-[#a0a0a0]' : ''}`}>
          {reminder.title}
        </div>
        <div className="text-sm text-[#a0a0a0] flex items-center gap-2 flex-wrap">
          <Calendar size={14} />
          <span>{new Date(reminder.date).toLocaleDateString()}</span>
          {reminder.time && (
            <>
              <span>•</span>
              <Clock size={14} />
              <span>{reminder.time}</span>
            </>
          )}
          {reminder.amount > 0 && (
            <>
              <span>•</span>
              <span>₹{parseFloat(reminder.amount).toLocaleString('en-IN')}</span>
            </>
          )}
        </div>
        {reminder.description && (
          <div className="text-xs text-[#a0a0a0] mt-1 truncate">{reminder.description}</div>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="font-bold text-sm" style={{ color: accent }}>
          {isPaid ? 'Paid' : getDaysUntil(reminder.date)}
        </div>
        {isPaid ? (
          <button
            onClick={() => onToggleComplete(reminder)}
            title="Mark as unpaid"
            className="text-[#a0a0a0] opacity-0 group-hover:opacity-100 transition-opacity hover:text-[#FFD700]"
          >
            <RotateCcw size={16} />
          </button>
        ) : (
          <Edit2
            size={18}
            onClick={() => onEdit({ ...reminder })}
            className="text-[#a0a0a0] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:text-[#FFD700]"
          />
        )}
      </div>
    </div>
  );
};

// Add Reminder Modal Component
const AddReminderModal = ({ onClose, onAddReminder }) => {
  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    description: ''
  });

  const handleSubmit = () => {
    if (!formData.title || !formData.date) return;

    const newReminder = {
      title: formData.title,
      date: formData.date,
      time: formData.time,
      description: formData.description
    };

    onAddReminder(newReminder);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] rounded-xl p-6 w-full max-w-md border border-[#333] shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Add Reminder
          </h2>
          <button onClick={onClose} className="text-[#a0a0a0] hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        <p className="text-[#a0a0a0] text-sm mb-6">Set a reminder for bills, payments, or important dates.</p>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2 uppercase tracking-wide">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-[#0f0f0f] border-2 border-[#FFD700] rounded-lg px-4 py-3 focus:outline-none focus:shadow-[0_0_15px_rgba(255,215,0,0.5)] transition-all"
              placeholder="Pay rent, Buy groceries..."
              autoFocus
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium mb-2 uppercase tracking-wide">
              Date *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full bg-[#0f0f0f] border border-[#333] focus:border-[#FFD700] rounded-lg px-4 py-3 focus:outline-none focus:shadow-[0_0_15px_rgba(255,215,0,0.3)] transition-all"
            />
          </div>

          {/* Time */}
          <div>
            <label className="block text-sm font-medium mb-2 uppercase tracking-wide">
              Time (Optional)
            </label>
            <input
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              className="w-full bg-[#0f0f0f] border border-[#333] focus:border-[#FFD700] rounded-lg px-4 py-3 focus:outline-none focus:shadow-[0_0_15px_rgba(255,215,0,0.3)] transition-all"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium mb-2 uppercase tracking-wide">
              Note (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-[#0f0f0f] border border-[#333] focus:border-[#FFD700] rounded-lg px-4 py-3 focus:outline-none focus:shadow-[0_0_15px_rgba(255,215,0,0.3)] transition-all resize-none"
              placeholder="Additional details..."
              rows={3}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 bg-[#0f0f0f] border border-[#333] hover:border-[#FFD700] text-white py-3 rounded-lg font-medium transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!formData.title || !formData.date}
              className="flex-1 bg-[#FFD700] hover:bg-[#F0C800] disabled:bg-[#333] disabled:cursor-not-allowed text-[#0f0f0f] py-3 rounded-lg font-bold transition-all duration-200 hover:shadow-[0_0_20px_rgba(255,215,0,0.5)]"
            >
              Save Reminder
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Edit Reminder Modal Component
const EditReminderModal = ({ reminder, onClose, onUpdate, onDelete }) => {
  const [formData, setFormData] = useState({
    title: reminder.title,
    date: reminder.date,
    time: reminder.time || '',
    description: reminder.description || ''
  });

  const handleUpdate = () => {
    onUpdate({
      ...reminder,
      title: formData.title,
      date: formData.date,
      time: formData.time,
      description: formData.description
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] rounded-xl p-6 w-full max-w-md border border-[#333] shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Edit Reminder
          </h2>
          <button onClick={onClose} className="text-[#a0a0a0] hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2 uppercase tracking-wide">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-[#0f0f0f] border-2 border-[#FFD700] rounded-lg px-4 py-3 focus:outline-none focus:shadow-[0_0_15px_rgba(255,215,0,0.5)] transition-all"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium mb-2 uppercase tracking-wide">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full bg-[#0f0f0f] border border-[#333] focus:border-[#FFD700] rounded-lg px-4 py-3 focus:outline-none focus:shadow-[0_0_15px_rgba(255,215,0,0.3)] transition-all"
            />
          </div>

          {/* Time */}
          <div>
            <label className="block text-sm font-medium mb-2 uppercase tracking-wide">Time</label>
            <input
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              className="w-full bg-[#0f0f0f] border border-[#333] focus:border-[#FFD700] rounded-lg px-4 py-3 focus:outline-none focus:shadow-[0_0_15px_rgba(255,215,0,0.3)] transition-all"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium mb-2 uppercase tracking-wide">Note</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-[#0f0f0f] border border-[#333] focus:border-[#FFD700] rounded-lg px-4 py-3 focus:outline-none focus:shadow-[0_0_15px_rgba(255,215,0,0.3)] transition-all resize-none"
              rows={3}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => onDelete(reminder.id)}
              className="flex-1 bg-[#ff4444] hover:bg-[#ff3333] text-white py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-[0_0_20px_rgba(255,68,68,0.5)] flex items-center justify-center gap-2"
            >
              <Trash2 size={18} />
              Delete
            </button>
            <button
              onClick={handleUpdate}
              className="flex-1 bg-[#FFD700] hover:bg-[#F0C800] text-[#0f0f0f] py-3 rounded-lg font-bold transition-all duration-200 hover:shadow-[0_0_20px_rgba(255,215,0,0.5)]"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reminders
