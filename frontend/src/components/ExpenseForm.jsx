import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

// Category icons mapping
const categoryIcons = {
  Food: '🍔',
  Transport: '🚗',
  Fun: '🎮',
  Bills: '📱',
  Others: '➕'
};

const ExpenseForm = ({ show, onClose, onAddExpense }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    note: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Quick amounts
  const quickAmounts = [50, 100, 200];

  // Handle form submission
  const handleSubmit = () => {
    const newExpense = {
      id: Date.now(),
      category: formData.category,
      amount: parseFloat(formData.amount),
      note: formData.note || formData.category,
      date: formData.date,
      timestamp: Date.now()
    };

    onAddExpense(newExpense);
    handleClose();
  };

  // Reset and close
  const handleClose = () => {
    setCurrentStep(1);
    setFormData({
      amount: '',
      category: '',
      note: '',
      date: new Date().toISOString().split('T')[0]
    });
    onClose();
  };

  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (!show) return;

    const previouslyFocused = document.activeElement;
    if (!modalRef.current?.contains(document.activeElement)) {
      closeButtonRef.current?.focus();
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
        return;
      }
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="expense-form-title"
        className="bg-[#1a1a1a] rounded-xl p-6 w-full max-w-md border border-[#333] shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 id="expense-form-title" className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Add New Expense
          </h2>
          <button
            ref={closeButtonRef}
            onClick={handleClose}
            aria-label="Close"
            className="text-[#a0a0a0] hover:text-white transition-colors"
          >
            <X size={24} aria-hidden="true" />
          </button>
        </div>
        <p className="text-[#a0a0a0] text-sm mb-6">Track where your money is going.</p>

        {/* Step 1: Amount */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <label htmlFor="expense-amount" className="block text-sm font-medium mb-3 uppercase tracking-wide">
                Amount
              </label>
              <div className="relative">
                <input
                  id="expense-amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full bg-[#0f0f0f] border-2 border-[#bb86fc] rounded-lg px-4 py-3 text-lg focus:outline-none focus:shadow-[0_0_15px_rgba(187,134,252,0.5)] transition-all"
                  placeholder="0"
                  aria-required="true"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <p className="text-sm text-[#a0a0a0] mb-2 uppercase tracking-wide">Quick amounts:</p>
              <div className="flex gap-2">
                {quickAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setFormData({ ...formData, amount: amount.toString() })}
                    className="flex-1 bg-[#0f0f0f] border border-[#333] hover:border-[#bb86fc] rounded-lg py-2 transition-all hover:shadow-[0_0_10px_rgba(187,134,252,0.3)]"
                  >
                    {amount}
                  </button>
                ))}
                <button className="flex-1 bg-[#0f0f0f] border border-[#333] hover:border-[#bb86fc] rounded-lg py-2 transition-all hover:shadow-[0_0_10px_rgba(187,134,252,0.3)]">
                  Custom
                </button>
              </div>
            </div>

            <button
              onClick={() => setCurrentStep(2)}
              disabled={!formData.amount}
              className="w-full bg-[#bb86fc] hover:bg-[#a370e6] disabled:bg-[#333] disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-[0_0_20px_rgba(187,134,252,0.5)]"
            >
              Next →
            </button>
          </div>
        )}

        {/* Step 2: Category */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-3 uppercase tracking-wide">
                Category
              </label>
              <div className="grid grid-cols-2 gap-3">
                {Object.keys(categoryIcons).map((category) => (
                  <button
                    key={category}
                    onClick={() => setFormData({ ...formData, category })}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      formData.category === category
                        ? 'border-[#bb86fc] bg-[#bb86fc]/10 shadow-[0_0_15px_rgba(187,134,252,0.3)]'
                        : 'border-[#333] bg-[#0f0f0f] hover:border-[#bb86fc]/50'
                    }`}
                  >
                    <div className="text-3xl mb-2">{categoryIcons[category]}</div>
                    <div className="text-sm font-medium">{category}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep(1)}
                className="flex-1 bg-[#0f0f0f] border border-[#333] hover:border-[#bb86fc] text-white py-3 rounded-lg font-medium transition-all"
              >
                ← Back
              </button>
              <button
                onClick={() => setCurrentStep(3)}
                disabled={!formData.category}
                className="flex-1 bg-[#bb86fc] hover:bg-[#a370e6] disabled:bg-[#333] disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-[0_0_20px_rgba(187,134,252,0.5)]"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Optional Details */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <label htmlFor="expense-note" className="block text-sm font-medium mb-2 uppercase tracking-wide">
                Description
              </label>
              <input
                id="expense-note"
                type="text"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                className="w-full bg-[#0f0f0f] border border-[#333] focus:border-[#bb86fc] rounded-lg px-4 py-3 focus:outline-none focus:shadow-[0_0_15px_rgba(187,134,252,0.3)] transition-all"
                placeholder="Lunch, Uber, Netflix..."
              />
            </div>

            <div>
              <label htmlFor="expense-date" className="block text-sm font-medium mb-2 uppercase tracking-wide">
                Date
              </label>
              <input
                id="expense-date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full bg-[#0f0f0f] border border-[#333] focus:border-[#bb86fc] rounded-lg px-4 py-3 focus:outline-none focus:shadow-[0_0_15px_rgba(187,134,252,0.3)] transition-all"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSubmit}
                className="flex-1 bg-[#0f0f0f] border border-[#333] hover:border-[#bb86fc] text-white py-3 rounded-lg font-medium transition-all"
              >
                Skip
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 bg-[#bb86fc] hover:bg-[#a370e6] text-white py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-[0_0_20px_rgba(187,134,252,0.5)]"
              >
                Save Expense
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseForm;
