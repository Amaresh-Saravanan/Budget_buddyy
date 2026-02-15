import React, { useState } from 'react';
import { Bell, Plus, Edit2, Trash2, X, Calendar, Clock } from 'lucide-react';

const Reminders = ({ reminders = [], onAddReminder, onUpdateReminder, onDeleteReminder }) => {
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);

  // Sort reminders by date
  const sortedReminders = [...reminders].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Separate upcoming and past reminders
  const today = new Date().toISOString().split('T')[0];
  const upcomingReminders = sortedReminders.filter(r => r.date >= today);
  const pastReminders = sortedReminders.filter(r => r.date < today);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Reminders
        </h1>
        <p className="text-[#a0a0a0] text-sm">Set reminders for bills, payments, and important dates.</p>
      </div>

      {/* Add Reminder Button */}
      <button
        onClick={() => setShowAddReminder(true)}
        className="mb-6 bg-[#FFD700] hover:bg-[#F0C800] text-[#0f0f0f] px-6 py-3 rounded-lg flex items-center gap-2 font-bold transition-all duration-200 hover:shadow-[0_0_20px_rgba(255,215,0,0.5)]"
      >
        <Plus size={20} />
        Add Reminder
      </button>

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
                onDelete={onDeleteReminder}
                isUpcoming={true}
              />
            ))
          )}
        </div>
      </div>

      {/* Past Reminders */}
      {pastReminders.length > 0 && (
        <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333] shadow-lg opacity-60">
          <h2 className="text-xl font-bold mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Past Reminders
          </h2>
          
          <div className="space-y-3">
            {pastReminders.map((reminder) => (
              <ReminderCard
                key={reminder.id}
                reminder={reminder}
                onEdit={setEditingReminder}
                onDelete={onDeleteReminder}
                isUpcoming={false}
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
const ReminderCard = ({ reminder, onEdit, onDelete, isUpcoming }) => {
  const getDaysUntil = (date) => {
    const today = new Date();
    const reminderDate = new Date(date);
    const diffTime = reminderDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
    return `In ${diffDays} days`;
  };

  return (
    <div
      onClick={() => onEdit({ ...reminder })}
      className="group flex items-center justify-between p-4 bg-[#0f0f0f] rounded-lg border border-[#333] hover:border-[#FFD700] transition-all duration-200 cursor-pointer hover:shadow-[0_0_15px_rgba(255,215,0,0.2)]"
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-[#FFD700]/20 rounded-lg flex items-center justify-center text-2xl border border-[#FFD700]">
          🔔
        </div>
        <div>
          <div className="font-medium">{reminder.title}</div>
          <div className="text-sm text-[#a0a0a0] flex items-center gap-2">
            <Calendar size={14} />
            <span>{new Date(reminder.date).toLocaleDateString()}</span>
            {reminder.time && (
              <>
                <span>•</span>
                <Clock size={14} />
                <span>{reminder.time}</span>
              </>
            )}
          </div>
          {reminder.note && (
            <div className="text-xs text-[#a0a0a0] mt-1">{reminder.note}</div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className={`font-bold text-sm ${isUpcoming ? 'text-[#FFD700]' : 'text-[#a0a0a0]'}`}>
          {getDaysUntil(reminder.date)}
        </div>
        <Edit2 size={18} className="text-[#a0a0a0] opacity-0 group-hover:opacity-100 transition-opacity" />
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
    note: ''
  });

  const handleSubmit = () => {
    if (!formData.title || !formData.date) return;

    const newReminder = {
      id: Date.now(),
      title: formData.title,
      date: formData.date,
      time: formData.time,
      note: formData.note,
      timestamp: Date.now()
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
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
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
    note: reminder.note || ''
  });

  const handleUpdate = () => {
    onUpdate({
      ...reminder,
      title: formData.title,
      date: formData.date,
      time: formData.time,
      note: formData.note
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
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
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
