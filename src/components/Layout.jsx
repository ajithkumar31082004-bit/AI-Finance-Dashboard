import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAlerts } from '../context/AlertContext'
import { 
  LayoutGrid, Star, TrendingUp, BrainCircuit, Newspaper, 
  Sliders, Coins, Grid3X3, Calendar, Target, ShieldAlert, 
  MessageSquare, LogOut, User, Menu, X, Wallet, BarChart2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import ChatBot from './ChatBot'

export default function Layout({ children }) {
  const { user, profile, logout } = useAuth()
  const { triggerToast } = useAlerts()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutGrid },
    { name: 'Watchlist', path: '/watchlist', icon: Star },
    { name: 'AI Forecast', path: '/forecast', icon: BrainCircuit },
    { name: 'News Sentiment', path: '/news', icon: Newspaper },
    { name: 'Stock Screener', path: '/screener', icon: Sliders },
    { name: 'Paper Trading', path: '/paper-trading', icon: Coins },
    { name: 'Market Heatmap', path: '/heatmap', icon: Grid3X3 },
    { name: 'IPO Tracker', path: '/ipo', icon: Calendar },
    { name: 'Goal Investing', path: '/goals', icon: Target },
    { name: 'Risk Engine', path: '/risk', icon: ShieldAlert },
  ]

  const handleLogout = async () => {
    try {
      await logout()
      triggerToast('Logged Out', 'Successfully logged out.', 'info')
      navigate('/auth')
    } catch (err) {
      triggerToast('Logout Error', err.message, 'error')
    }
  }

  // Format currency
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(val || 0)
  }

  return (
    <div className="flex min-h-screen bg-[#05060a]">
      {/* 1. SIDEBAR (DESKTOP) */}
      <aside className="hidden lg:flex flex-col w-64 fixed inset-y-0 left-0 bg-[#0b0f19]/70 border-r border-slate-800/60 backdrop-blur-xl z-30">
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-850 flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-blue-600 to-emerald-500 rounded-lg shadow-md">
            <BarChart2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-wider bg-gradient-to-r from-slate-50 to-slate-300 bg-clip-text text-transparent font-display">
            APEX FINANCE
          </span>
        </div>

        {/* Paper Balance Widget */}
        {profile && (
          <div className="mx-4 my-4 p-4 rounded-xl bg-gradient-to-br from-blue-950/40 to-slate-900/60 border border-blue-900/20 shadow-inner flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Wallet className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Mock Balance</p>
              <p className="text-sm font-bold text-slate-100 font-display">
                {formatCurrency(profile.paper_balance)}
              </p>
            </div>
          </div>
        )}

        {/* Menu Items */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-blue-600/10 text-blue-400 border-l-2 border-blue-500 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/50'
                }`}
              >
                <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-350'}`} />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Footer Profile & Logout */}
        {profile && (
          <div className="p-4 border-t border-slate-850 flex flex-col gap-3">
            <div className="flex items-center gap-3 px-2">
              <div className="p-1.5 bg-slate-850 rounded-full border border-slate-700">
                <User className="w-4 h-4 text-slate-300" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-semibold text-slate-200 truncate font-display">{profile.name}</p>
                <p className="text-[10px] text-slate-500 truncate">{profile.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> Log Out
            </button>
          </div>
        )}
      </aside>

      {/* 2. MOBILE TOP HEADER */}
      <header className="lg:hidden fixed top-0 inset-x-0 h-16 bg-[#0b0f19]/80 border-b border-slate-850/50 backdrop-blur-xl z-30 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-tr from-blue-600 to-emerald-500 rounded-lg">
            <BarChart2 className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold tracking-wider text-slate-100 font-display">APEX</span>
        </div>

        {profile && (
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 bg-blue-950/20 border border-blue-900/10 rounded-lg flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[11px] font-bold text-slate-200">
                {formatCurrency(profile.paper_balance)}
              </span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        )}
      </header>

      {/* MOBILE NAV OVERLAY */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="lg:hidden fixed inset-0 top-16 bg-[#06070a]/95 z-20 flex flex-col p-6 overflow-y-auto"
          >
            <nav className="flex-1 space-y-2 mt-4">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-medium ${
                      isActive
                        ? 'bg-blue-600/10 text-blue-400 border-l-2 border-blue-500 font-bold'
                        : 'text-slate-400 hover:bg-slate-900'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
            {profile && (
              <div className="border-t border-slate-800 pt-6 mt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-sm font-semibold text-slate-200">{profile.name}</p>
                    <p className="text-xs text-slate-500">{profile.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    handleLogout()
                  }}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-red-950/20 hover:bg-red-900/10 border border-red-900/10 rounded-xl text-sm font-medium text-red-400 transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" /> Log Out
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        <main className="flex-1 p-4 md:p-8 pt-20 lg:pt-8 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* 4. AI FLOATING CHAT ASSISTANT WIDGET */}
      {profile && (
        <>
          <div className="fixed bottom-6 left-6 z-40">
            <button
              onClick={() => setChatOpen(!chatOpen)}
              className="p-4 bg-gradient-to-tr from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-full shadow-lg shadow-blue-900/50 flex items-center justify-center text-white cursor-pointer active:scale-95 transition-all glow-effect"
            >
              <MessageSquare className="w-6 h-6 animate-pulse" />
            </button>
          </div>
          
          <AnimatePresence>
            {chatOpen && (
              <ChatBot onClose={() => setChatOpen(false)} />
            )}
          </AnimatePresence>
        </>
      )}

      {/* 5. MOBILE BOTTOM NAVIGATION (QUICK ACCESS BAR) */}
      {profile && (
        <nav className="lg:hidden fixed bottom-0 inset-x-0 h-16 bg-[#0b0f19]/90 border-t border-slate-850/60 backdrop-blur-xl z-30 px-6 flex items-center justify-between">
          <Link
            to="/"
            className={`flex flex-col items-center gap-1 ${
              location.pathname === '/' ? 'text-blue-400 font-bold' : 'text-slate-500'
            }`}
          >
            <LayoutGrid className="w-5 h-5" />
            <span className="text-[10px]">Home</span>
          </Link>
          <Link
            to="/watchlist"
            className={`flex flex-col items-center gap-1 ${
              location.pathname === '/watchlist' ? 'text-blue-400 font-bold' : 'text-slate-500'
            }`}
          >
            <Star className="w-5 h-5" />
            <span className="text-[10px]">Watch</span>
          </Link>
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className={`flex flex-col items-center gap-1 ${
              chatOpen ? 'text-blue-400 font-bold' : 'text-slate-500'
            }`}
          >
            <MessageSquare className="w-5 h-5 text-purple-400" />
            <span className="text-[10px]">AI Chat</span>
          </button>
          <Link
            to="/paper-trading"
            className={`flex flex-col items-center gap-1 ${
              location.pathname === '/paper-trading' ? 'text-blue-400 font-bold' : 'text-slate-500'
            }`}
          >
            <Coins className="w-5 h-5" />
            <span className="text-[10px]">Trade</span>
          </Link>
          <Link
            to="/forecast"
            className={`flex flex-col items-center gap-1 ${
              location.pathname === '/forecast' ? 'text-blue-400 font-bold' : 'text-slate-500'
            }`}
          >
            <BrainCircuit className="w-5 h-5" />
            <span className="text-[10px]">Forecast</span>
          </Link>
        </nav>
      )}
    </div>
  )
}
