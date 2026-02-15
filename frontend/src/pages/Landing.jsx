import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, Sun, Moon } from 'lucide-react'

export default function Landing() {
  const [isDark, setIsDark] = useState(true)
  
  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
  }

  // Theme colors
  const theme = {
    bg: isDark ? 'bg-[#0f0f0f]' : 'bg-[#f5f5f5]',
    bgAlt: isDark ? 'bg-[#1a1a1a]' : 'bg-white',
    bgCard: isDark ? 'bg-[#1a1a1a]' : 'bg-[#f9f9f9]',
    text: isDark ? 'text-[#e0e0e0]' : 'text-[#333]',
    textMuted: isDark ? 'text-[#a0a0a0]' : 'text-[#666]',
    border: isDark ? 'border-[#333]' : 'border-[#e5e5e5]',
    navBg: isDark ? 'bg-[#0f0f0f]/90' : 'bg-white/80',
  }

  return (
    <div className={`min-h-screen ${theme.bg} transition-colors duration-300`}>
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 ${theme.navBg} backdrop-blur-md border-b ${theme.border}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 border-2 ${isDark ? 'border-[#bb86fc]' : 'border-[#333]'} flex items-center justify-center`}>
              <div className={`text-[10px] font-bold ${isDark ? 'text-[#bb86fc]' : 'text-[#333]'} leading-tight text-center`}>
                <div>BUD</div>
                <div>GET</div>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className={`${isDark ? 'text-[#bb86fc]' : 'text-[#333]'} font-medium text-sm tracking-wider hover:text-[#bb86fc] transition-colors`}>
              HOME
            </Link>
            <a href="#features" className={`${theme.textMuted} font-medium text-sm tracking-wider hover:text-[#bb86fc] transition-colors`}>
              FEATURES
            </a>
            <a href="#about" className={`${theme.textMuted} font-medium text-sm tracking-wider hover:text-[#bb86fc] transition-colors`}>
              ABOUT
            </a>
            <a href="#testimonials" className={`${theme.textMuted} font-medium text-sm tracking-wider hover:text-[#bb86fc] transition-colors`}>
              REVIEWS
            </a>
            <Link to="/login" className={`${theme.textMuted} font-medium text-sm tracking-wider hover:text-[#bb86fc] transition-colors`}>
              LOGIN
            </Link>
          </div>

          {/* Theme Toggle & Social */}
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={() => setIsDark(!isDark)}
              className={`p-2 rounded-lg ${isDark ? 'bg-[#1a1a1a] text-[#FFD700]' : 'bg-[#f0f0f0] text-[#333]'} hover:scale-110 transition-all`}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            <div className="hidden sm:flex items-center gap-4">
              <a href="#" className={`${theme.textMuted} hover:text-[#bb86fc] transition-colors`}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="#" className={`${theme.textMuted} hover:text-[#bb86fc] transition-colors`}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
              <a href="#" className={`${theme.textMuted} hover:text-[#bb86fc] transition-colors`}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Full Screen */}
      <section 
        className="min-h-screen flex flex-col items-center justify-center relative"
        style={{
          backgroundImage: `linear-gradient(${isDark ? 'rgba(0,0,0,0.7), rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.3), rgba(255,255,255,0.4)'}), url('https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1920&q=80')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        {/* Content */}
        <div className="text-center px-6 max-w-4xl mx-auto">
          {/* Main Heading */}
          <h1 
            className={`text-5xl md:text-7xl lg:text-8xl font-light ${isDark ? 'text-white' : 'text-[#1a1a1a]'} tracking-[0.2em] mb-8`}
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            BUDGET BUDDY
          </h1>

          {/* Subtitle */}
          <p className={`${isDark ? 'text-white/90' : 'text-[#333]'} text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed`}>
            BudgetBuddy is a Smart Financial Tracking App. It is Fully Responsive and 
            <br className="hidden md:block" />
            Feature Rich. Start Managing Your Money Now.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to="/register"
              className={`px-10 py-4 ${isDark ? 'bg-[#bb86fc] text-white border-[#bb86fc]' : 'bg-[#1a1a1a] text-white border-[#1a1a1a]'} border-2 font-medium tracking-wider hover:shadow-[0_0_30px_rgba(187,134,252,0.5)] transition-all duration-300 min-w-[200px]`}
            >
              GET STARTED
            </Link>
            <Link 
              to="/login"
              className={`px-10 py-4 bg-transparent border-2 ${isDark ? 'border-white/50 text-white hover:border-[#bb86fc] hover:text-[#bb86fc]' : 'border-[#333]/50 text-[#333] hover:border-[#bb86fc] hover:text-[#bb86fc]'} font-medium tracking-wider transition-all duration-300 min-w-[200px]`}
            >
              SIGN IN
            </Link>
          </div>
        </div>

        {/* Scroll Indicator */}
        <button 
          onClick={scrollToFeatures}
          className={`absolute bottom-10 left-1/2 -translate-x-1/2 ${isDark ? 'text-white/60 hover:text-white' : 'text-[#333]/60 hover:text-[#333]'} transition-colors animate-bounce`}
        >
          <ChevronDown size={32} />
        </button>
      </section>

      {/* Features Section */}
      <section id="features" className={`py-24 ${theme.bgAlt} transition-colors duration-300`}>
        <div className="max-w-6xl mx-auto px-6">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className={`text-4xl md:text-5xl font-light ${theme.text} tracking-wider mb-4`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              FEATURES
            </h2>
            <div className="w-16 h-0.5 bg-[#bb86fc] mx-auto mb-6"></div>
            <p className={theme.textMuted}>
              Everything you need to take control of your finances
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className={`text-center p-8 group ${isDark ? 'hover:bg-[#252525]' : 'hover:bg-[#f0f0f0]'} transition-colors rounded-lg`}>
              <div className="w-16 h-16 bg-[#bb86fc]/20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-[#bb86fc]/30 transition-colors">
                <svg className="w-8 h-8 text-[#bb86fc]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className={`text-xl font-medium ${theme.text} mb-3 tracking-wide`}>EXPENSE TRACKING</h3>
              <p className={`${theme.textMuted} leading-relaxed`}>
                Track every expense with smart categorization. Know exactly where your money goes.
              </p>
            </div>

            {/* Feature 2 */}
            <div className={`text-center p-8 group ${isDark ? 'hover:bg-[#252525]' : 'hover:bg-[#f0f0f0]'} transition-colors rounded-lg`}>
              <div className="w-16 h-16 bg-[#00ff88]/20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-[#00ff88]/30 transition-colors">
                <svg className="w-8 h-8 text-[#00ff88]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className={`text-xl font-medium ${theme.text} mb-3 tracking-wide`}>SAVINGS GOALS</h3>
              <p className={`${theme.textMuted} leading-relaxed`}>
                Set and achieve your savings goals. Watch your money grow with visual progress.
              </p>
            </div>

            {/* Feature 3 */}
            <div className={`text-center p-8 group ${isDark ? 'hover:bg-[#252525]' : 'hover:bg-[#f0f0f0]'} transition-colors rounded-lg`}>
              <div className="w-16 h-16 bg-[#FFD700]/20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-[#FFD700]/30 transition-colors">
                <svg className="w-8 h-8 text-[#FFD700]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3 className={`text-xl font-medium ${theme.text} mb-3 tracking-wide`}>SMART ALERTS</h3>
              <p className={`${theme.textMuted} leading-relaxed`}>
                Get notified before you overspend. Never miss a bill payment again.
              </p>
            </div>

            {/* Feature 4 */}
            <div className={`text-center p-8 group ${isDark ? 'hover:bg-[#252525]' : 'hover:bg-[#f0f0f0]'} transition-colors rounded-lg`}>
              <div className="w-16 h-16 bg-[#ff6b6b]/20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-[#ff6b6b]/30 transition-colors">
                <svg className="w-8 h-8 text-[#ff6b6b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
              </div>
              <h3 className={`text-xl font-medium ${theme.text} mb-3 tracking-wide`}>ANALYTICS</h3>
              <p className={`${theme.textMuted} leading-relaxed`}>
                Beautiful charts and insights. Understand your spending patterns at a glance.
              </p>
            </div>

            {/* Feature 5 */}
            <div className={`text-center p-8 group ${isDark ? 'hover:bg-[#252525]' : 'hover:bg-[#f0f0f0]'} transition-colors rounded-lg`}>
              <div className="w-16 h-16 bg-[#4ecdc4]/20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-[#4ecdc4]/30 transition-colors">
                <svg className="w-8 h-8 text-[#4ecdc4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className={`text-xl font-medium ${theme.text} mb-3 tracking-wide`}>CALENDAR VIEW</h3>
              <p className={`${theme.textMuted} leading-relaxed`}>
                See all your transactions, bills, and reminders on an intuitive calendar.
              </p>
            </div>

            {/* Feature 6 */}
            <div className={`text-center p-8 group ${isDark ? 'hover:bg-[#252525]' : 'hover:bg-[#f0f0f0]'} transition-colors rounded-lg`}>
              <div className="w-16 h-16 bg-[#bb86fc]/20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-[#bb86fc]/30 transition-colors">
                <svg className="w-8 h-8 text-[#bb86fc]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h3 className={`text-xl font-medium ${theme.text} mb-3 tracking-wide`}>GAMIFICATION</h3>
              <p className={`${theme.textMuted} leading-relaxed`}>
                Earn badges, maintain streaks, and make saving money fun and rewarding.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className={`py-24 ${theme.bg} transition-colors duration-300`}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* Image */}
            <div className="relative">
              <div 
                className="aspect-[4/3] rounded-lg shadow-2xl"
                style={{
                  backgroundImage: `url('https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=800&q=80')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              />
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-[#bb86fc] rounded-lg flex items-center justify-center shadow-lg">
                <div className="text-white text-center">
                  <div className="text-3xl font-bold">100%</div>
                  <div className="text-xs tracking-wider">FREE</div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div>
              <h2 className={`text-4xl font-light ${theme.text} tracking-wider mb-6`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                ABOUT US
              </h2>
              <div className="w-16 h-0.5 bg-[#bb86fc] mb-6"></div>
              <p className={`${theme.textMuted} leading-relaxed mb-6`}>
                BudgetBuddy was created with a simple mission: to make personal finance 
                management accessible, intuitive, and even enjoyable for everyone.
              </p>
              <p className={`${theme.textMuted} leading-relaxed mb-8`}>
                Whether you're a student managing your first budget, a young professional 
                saving for goals, or anyone looking to gain control over their finances, 
                BudgetBuddy provides the tools you need without the complexity.
              </p>
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-3xl font-bold text-[#bb86fc]">10K+</div>
                  <div className={theme.textMuted + " text-sm"}>Users</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-[#00ff88]">₹50L+</div>
                  <div className={theme.textMuted + " text-sm"}>Tracked</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-[#FFD700]">4.9★</div>
                  <div className={theme.textMuted + " text-sm"}>Rating</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className={`py-24 ${theme.bgAlt} transition-colors duration-300`}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className={`text-4xl font-light ${theme.text} tracking-wider mb-4`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              REVIEWS
            </h2>
            <div className="w-16 h-0.5 bg-[#bb86fc] mx-auto mb-6"></div>
            <p className={theme.textMuted}>What our users say about BudgetBuddy</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className={`${theme.bgCard} p-8 rounded-lg border ${theme.border} transition-colors duration-300`}>
              <div className="flex items-center gap-1 mb-4">
                {[1,2,3,4,5].map(i => (
                  <svg key={i} className="w-5 h-5 text-[#FFD700]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className={`${theme.textMuted} mb-6 italic`}>
                "Finally an app that doesn't overwhelm me. I've saved ₹15,000 in just 3 months!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#bb86fc] rounded-full flex items-center justify-center text-white font-medium">
                  P
                </div>
                <div>
                  <div className={`font-medium ${theme.text}`}>Priya Sharma</div>
                  <div className={`${theme.textMuted} text-sm`}>Student, Delhi</div>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className={`${theme.bgCard} p-8 rounded-lg border ${theme.border} transition-colors duration-300`}>
              <div className="flex items-center gap-1 mb-4">
                {[1,2,3,4,5].map(i => (
                  <svg key={i} className="w-5 h-5 text-[#FFD700]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className={`${theme.textMuted} mb-6 italic`}>
                "The gamification features make budgeting fun. I'm on a 45-day savings streak!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#00ff88] rounded-full flex items-center justify-center text-[#0f0f0f] font-medium">
                  R
                </div>
                <div>
                  <div className={`font-medium ${theme.text}`}>Rahul Verma</div>
                  <div className={`${theme.textMuted} text-sm`}>Software Engineer, Bangalore</div>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className={`${theme.bgCard} p-8 rounded-lg border ${theme.border} transition-colors duration-300`}>
              <div className="flex items-center gap-1 mb-4">
                {[1,2,3,4,5].map(i => (
                  <svg key={i} className="w-5 h-5 text-[#FFD700]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className={`${theme.textMuted} mb-6 italic`}>
                "Smart alerts saved me from overspending multiple times. Highly recommend!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#FFD700] rounded-full flex items-center justify-center text-[#0f0f0f] font-medium">
                  A
                </div>
                <div>
                  <div className={`font-medium ${theme.text}`}>Ananya Patel</div>
                  <div className={`${theme.textMuted} text-sm`}>Designer, Mumbai</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section 
        className="py-24 relative"
        style={{
          backgroundImage: `linear-gradient(${isDark ? 'rgba(0,0,0,0.8), rgba(15,15,15,0.95)' : 'rgba(255,255,255,0.8), rgba(245,245,245,0.95)'}), url('https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1920&q=80')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className={`text-4xl md:text-5xl font-light ${theme.text} tracking-wider mb-6`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            START YOUR JOURNEY
          </h2>
          <p className={`${theme.textMuted} text-lg mb-10 max-w-xl mx-auto`}>
            Join thousands of users who have taken control of their finances. It's free, forever.
          </p>
          <Link 
            to="/register"
            className={`inline-block px-12 py-4 ${isDark ? 'bg-[#bb86fc] text-white hover:bg-[#a370e6]' : 'bg-[#1a1a1a] text-white hover:bg-[#333]'} font-medium tracking-wider transition-all duration-300 hover:shadow-[0_0_30px_rgba(187,134,252,0.5)]`}
          >
            GET STARTED NOW
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className={`${isDark ? 'bg-[#0a0a0a]' : 'bg-[#1a1a1a]'} text-white py-12 transition-colors duration-300`}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 border border-white/30 flex items-center justify-center">
                <div className="text-[8px] font-bold leading-tight text-center">
                  <div>BUD</div>
                  <div>GET</div>
                </div>
              </div>
              <span className="text-lg font-medium tracking-wider">BUDGETBUDDY</span>
            </div>

            {/* Links */}
            <div className="flex items-center gap-8 text-sm text-white/60">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>

            {/* Copyright */}
            <div className="text-white/40 text-sm">
              © 2026 BudgetBuddy. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
