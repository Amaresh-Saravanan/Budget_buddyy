import React, { useState, useEffect, useCallback } from 'react';
import { X, Sparkles, TrendingUp, Heart } from 'lucide-react';

// Confetti particle component
const ConfettiParticle = ({ delay, left }) => {
  const colors = ['#ff6b6b', '#FFD700', '#00ff88', '#bb86fc', '#4ecdc4', '#ff9f43'];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  const size = Math.random() * 10 + 5;
  
  return (
    <div 
      className="absolute animate-confetti-fall"
      style={{
        left: `${left}%`,
        animationDelay: `${delay}ms`,
        top: '-20px'
      }}
    >
      <div 
        className="animate-confetti-spin"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: randomColor,
          borderRadius: Math.random() > 0.5 ? '50%' : '0%',
        }}
      />
    </div>
  );
};

const NoSpendCelebration = ({ 
  show, 
  onClose, 
  dailyAllowance = 500, 
  currency = '₹',
  healthScoreBonus = 10 
}) => {
  const [confetti, setConfetti] = useState([]);
  const [animationPhase, setAnimationPhase] = useState(0);

  // Generate confetti on mount
  useEffect(() => {
    if (show) {
      const particles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        delay: Math.random() * 2000,
        left: Math.random() * 100
      }));
      setConfetti(particles);
      
      // Animation phases
      setAnimationPhase(1);
      setTimeout(() => setAnimationPhase(2), 500);
      setTimeout(() => setAnimationPhase(3), 1000);
    }
  }, [show]);

  // Handle escape key
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (show) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [show, handleKeyDown]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md overflow-hidden">
      {/* Confetti Container */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {confetti.map(particle => (
          <ConfettiParticle key={particle.id} {...particle} />
        ))}
      </div>

      {/* Radial glow effect */}
      <div className="absolute inset-0 bg-gradient-radial from-[#00ff88]/20 via-transparent to-transparent animate-pulse-slow" />

      {/* Close button */}
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 text-[#a0a0a0] hover:text-white transition-colors z-10"
      >
        <X size={32} />
      </button>

      {/* Main Content */}
      <div className="relative text-center px-8 max-w-md mx-auto">
        {/* Emoji celebration */}
        <div 
          className={`text-6xl mb-6 transition-all duration-500 ${
            animationPhase >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
          }`}
        >
          🎉 🎊 ✨
        </div>

        {/* Main title */}
        <h1 
          className={`text-5xl md:text-6xl font-bold text-[#00ff88] mb-4 transition-all duration-500 ${
            animationPhase >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ fontFamily: 'Space Grotesk, sans-serif' }}
        >
          NO-SPEND DAY!
        </h1>

        {/* Subtitle */}
        <p 
          className={`text-xl text-[#e0e0e0] mb-8 transition-all duration-500 delay-100 ${
            animationPhase >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          You saved your entire daily allowance of{' '}
          <span className="text-[#00ff88] font-bold">{currency}{dailyAllowance}</span>!
        </p>

        {/* Stats Cards */}
        <div 
          className={`space-y-4 mb-8 transition-all duration-500 delay-200 ${
            animationPhase >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="bg-[#1a1a1a]/80 border border-[#00ff88]/30 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#00ff88]/20 rounded-lg flex items-center justify-center">
                <Sparkles className="text-[#00ff88]" size={24} />
              </div>
              <span className="text-[#a0a0a0]">Added to savings</span>
            </div>
            <span className="text-[#00ff88] font-bold text-xl">+{currency}{dailyAllowance}</span>
          </div>

          <div className="bg-[#1a1a1a]/80 border border-[#bb86fc]/30 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#bb86fc]/20 rounded-lg flex items-center justify-center">
                <Heart className="text-[#bb86fc]" size={24} />
              </div>
              <span className="text-[#a0a0a0]">Health Score points</span>
            </div>
            <span className="text-[#bb86fc] font-bold text-xl">+{healthScoreBonus}</span>
          </div>
        </div>

        {/* Motivational message */}
        <p 
          className={`text-[#666] text-sm mb-8 transition-all duration-500 delay-300 ${
            animationPhase >= 3 ? 'opacity-100' : 'opacity-0'
          }`}
        >
          Every no-spend day brings you closer to your financial goals! 💪
        </p>

        {/* CTA Button */}
        <button
          onClick={onClose}
          className={`w-full bg-[#00ff88] hover:bg-[#00dd77] text-[#0f0f0f] font-bold py-4 px-8 rounded-xl text-xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,136,0.5)] ${
            animationPhase >= 3 ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        >
          Awesome! 🎯
        </button>
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        
        @keyframes confetti-spin {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.2); }
          100% { transform: rotate(360deg) scale(1); }
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        
        .animate-confetti-fall {
          animation: confetti-fall 4s ease-out forwards;
        }
        
        .animate-confetti-spin {
          animation: confetti-spin 2s linear infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
        
        .bg-gradient-radial {
          background: radial-gradient(circle at center, var(--tw-gradient-from), var(--tw-gradient-via), var(--tw-gradient-to));
        }
      `}</style>
    </div>
  );
};

// Hook to check for no-spend days
export const useNoSpendDetection = (expenses = []) => {
  const checkYesterdayNoSpend = useCallback(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const yesterdayStr = yesterday.toDateString();
    const hasExpensesYesterday = expenses.some(exp => {
      const expDate = new Date(exp.date);
      expDate.setHours(0, 0, 0, 0);
      return expDate.toDateString() === yesterdayStr;
    });
    
    return !hasExpensesYesterday;
  }, [expenses]);

  return { checkYesterdayNoSpend };
};

export default NoSpendCelebration;
