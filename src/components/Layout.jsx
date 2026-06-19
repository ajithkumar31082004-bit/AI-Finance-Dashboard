import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAlerts } from '../context/AlertContext'
import { useTheme } from '../context/ThemeContext'
import { 
  LayoutGrid, Star, TrendingUp, BrainCircuit, Newspaper, 
  Sliders, Coins, Grid3X3, Calendar, Target, ShieldAlert, 
  MessageSquare, LogOut, User, Menu, X, Wallet, BarChart2,
  Bitcoin, GitCompare, Calculator, Scan, Receipt, RefreshCw,
  Share2, Sun, Moon
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import ChatBot from './ChatBot'
import ShareCard from './ShareCard'

export default function Layout({ children }) {
  const { user, profile, logout } = useAuth()
  const { triggerToast } = useAlerts()
  const { isDark, toggleTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)

  const menuGroups = [
    {
      label: 'Core',
      items: [
        { name: 'Dashboard',      path: '/',             icon: LayoutGrid },
        { name: 'Watchlist',      path: '/watchlist',    icon: Star },
        { name: 'AI Forecast',    path: '/forecast',     icon: BrainCircuit },
        { name: 'News Sentiment', path: '/news',         icon: Newspaper },
        { name: 'Stock Screener', path: '/screener',     icon: Sliders },
      ]
    },
    {
      label: 'Markets',
      items: [
        { name: 'Paper Trading',  path: '/paper-trading', icon: Coins },
        { name: 'Market Heatmap', path: '/heatmap',        icon: Grid3X3 },
        { name: 'IPO Tracker',    path: '/ipo',            icon: Calendar },
        { name: 'Crypto & Forex', path: '/crypto',         icon: Bitcoin },
        { name: 'Compare Stocks', path: '/compare',        icon: GitCompare },
      ]
    },
    {
      label: 'Analytics',
      items: [
        { name: 'Pattern Scanner', path: '/patterns',   icon: Scan },
        { name: 'Earnings Cal.',   path: '/calendar',   icon: Calendar },
        { name: 'Risk Engine',     path: '/risk',       icon: ShieldAlert },
        { name: 'Rebalancing',     path: '/rebalance',  icon: RefreshCw },
      ]
    },
    {
      label: 'Planning',
      items: [
        { name: 'Goal Investing',  path: '/goals',  icon: Target },
        { name: 'SIP Calculator',  path: '/sip',    icon: Calculator },
        { name: 'Tax Calculator',  path: '/tax',    icon: Receipt },
      ]
    },
  ]

  const allMenuItems = menuGroups.flatMap(g => g.items)

  const handleLogout = async () => {
    try {
      await logout()
      triggerToast('Logged Out', 'Successfully logged out.', 'info')
      navigate('/auth')
    } catch (err) {
      triggerToast('Logout Error', err.message, 'error')
    }
  }

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0)
  }

  return (
    <div className="flex min-h-screen transition-colors duration-300" style={{ backgroundColor: 'var(--bg-primary)' }}>

      {/* ── 1. SIDEBAR (DESKTOP) ─────────────────────── */}
      <aside className="hidden lg:flex flex-col w-64 fixed inset-y-0 left-0 border-r backdrop-blur-xl z-30 transition-colors duration-300"
        style={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border-color)' }}>

        {/* Brand Header */}
        <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-blue-600 to-emerald-500 rounded-lg shadow-md">
              <BarChart2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-base font-bold tracking-wider bg-gradient-to-r from-slate-50 to-slate-300 bg-clip-text text-transparent font-display">
              APEX FINANCE
            </span>
          </div>
          {/* Theme Toggle */}
          <button onClick={toggleTheme} title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2 rounded-lg border transition-all cursor-pointer hover:scale-105 active:scale-95"
            style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
            {isDark
              ? <Sun className="w-4 h-4 text-amber-400" />
              : <Moon className="w-4 h-4 text-blue-500" />
            }
          </button>
        </div>

        {/* Paper Balance Widget */}
        {profile && (
          <div className="mx-4 my-3 p-3 rounded-xl border flex items-center gap-3"
            style={{ backgroundColor: 'rgba(59,130,246,0.06)', borderColor: 'rgba(59,130,246,0.15)' }}>
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Wallet className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Paper Balance</p>
              <p className="text-sm font-bold text-slate-100 font-display">{formatCurrency(profile.paper_balance)}</p>
            </div>
            {/* Share Card Trigger */}
            <button onClick={() => setShareOpen(true)} title="Share Portfolio Card"
              className="p-1.5 text-slate-500 hover:text-blue-400 cursor-pointer transition-colors">
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Grouped Menu Items */}
        <nav className="flex-1 px-3 overflow-y-auto space-y-4 py-3 scrollbar-thin">
          {menuGroups.map(group => (
            <div key={group.label}>
              <p className="text-[9px] font-extrabold uppercase tracking-widest px-3 mb-1.5"
                style={{ color: 'var(--text-muted)' }}>
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.path
                  return (
                    <Link key={item.name} to={item.path}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 group ${
                        isActive
                          ? 'bg-blue-600/10 text-blue-400 border-l-2 border-blue-500 font-semibold pl-[10px]'
                          : 'hover:bg-slate-850/50'
                      }`}
                      style={{ color: isActive ? undefined : 'var(--text-secondary)' }}
                    >
                      <Icon className={`w-3.5 h-3.5 flex-shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-blue-400' : ''}`} />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        {profile && (
          <div className="p-4 border-t space-y-3" style={{ borderColor: 'var(--border-color)' }}>
            <div className="flex items-center gap-2.5 px-2">
              <div className="p-1.5 rounded-full border" style={{ borderColor: 'var(--border-color)' }}>
                <User className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-semibold truncate font-display" style={{ color: 'var(--text-primary)' }}>{profile.name}</p>
                <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>{profile.email}</p>
              </div>
            </div>
            <button onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 transition-all cursor-pointer border hover:border-slate-700"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <LogOut className="w-3.5 h-3.5" /> Log Out
            </button>
          </div>
        )}
      </aside>

      {/* ── 2. MOBILE TOP HEADER ────────────────────── */}
      <header className="lg:hidden fixed top-0 inset-x-0 h-16 border-b backdrop-blur-xl z-30 px-4 flex items-center justify-between transition-colors"
        style={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border-color)' }}>
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-tr from-blue-600 to-emerald-500 rounded-lg">
            <BarChart2 className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold tracking-wider font-display" style={{ color: 'var(--text-primary)' }}>APEX</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Toggle Mobile */}
          <button onClick={toggleTheme}
            className="p-2 rounded-lg border transition-all cursor-pointer"
            style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-500" />}
          </button>

          {profile && (
            <>
              <div className="px-3 py-1.5 rounded-lg flex items-center gap-1.5 border"
                style={{ backgroundColor: 'rgba(59,130,246,0.08)', borderColor: 'rgba(59,130,246,0.15)' }}>
                <Wallet className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[11px] font-bold" style={{ color: 'var(--text-primary)' }}>
                  {formatCurrency(profile.paper_balance)}
                </span>
              </div>
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2" style={{ color: 'var(--text-secondary)' }}>
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </>
          )}
        </div>
      </header>

      {/* MOBILE NAV OVERLAY */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="lg:hidden fixed inset-0 top-16 z-20 flex flex-col p-6 overflow-y-auto transition-colors"
            style={{ backgroundColor: 'var(--bg-primary)' }}>
            <nav className="flex-1 space-y-6 mt-2">
              {menuGroups.map(group => (
                <div key={group.label}>
                  <p className="text-[10px] font-extrabold uppercase tracking-widest px-2 mb-2"
                    style={{ color: 'var(--text-muted)' }}>{group.label}</p>
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const Icon = item.icon
                      const isActive = location.pathname === item.path
                      return (
                        <Link key={item.name} to={item.path}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                            isActive ? 'bg-blue-600/10 text-blue-400 font-bold' : ''
                          }`}
                          style={{ color: isActive ? undefined : 'var(--text-secondary)' }}>
                          <Icon className="w-5 h-5" />
                          {item.name}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}
            </nav>
            {profile && (
              <div className="border-t pt-6 mt-6 space-y-4" style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{profile.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{profile.email}</p>
                  </div>
                </div>
                <button onClick={() => { setMobileMenuOpen(false); handleLogout() }}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-red-950/20 hover:bg-red-900/10 border border-red-900/10 rounded-xl text-sm font-medium text-red-400 transition-all cursor-pointer">
                  <LogOut className="w-4 h-4" /> Log Out
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 3. MAIN WORKSPACE ───────────────────────── */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        <main className="flex-1 p-4 md:p-8 pt-20 lg:pt-8 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* ── 4. AI FLOATING CHAT WIDGET ──────────────── */}
      {profile && (
        <>
          <div className="fixed bottom-6 left-6 z-40">
            <button onClick={() => setChatOpen(!chatOpen)}
              className="p-4 bg-gradient-to-tr from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-full shadow-lg shadow-blue-900/50 text-white cursor-pointer active:scale-95 transition-all">
              <MessageSquare className="w-6 h-6 animate-pulse" />
            </button>
          </div>
          <AnimatePresence>
            {chatOpen && <ChatBot onClose={() => setChatOpen(false)} />}
          </AnimatePresence>
        </>
      )}

      {/* ── 5. MOBILE BOTTOM NAV ────────────────────── */}
      {profile && (
        <nav className="lg:hidden fixed bottom-0 inset-x-0 h-16 border-t backdrop-blur-xl z-30 px-6 flex items-center justify-between transition-colors"
          style={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border-color)' }}>
          {[
            { path: '/', icon: LayoutGrid, label: 'Home' },
            { path: '/watchlist', icon: Star, label: 'Watch' },
            { onClick: () => setChatOpen(!chatOpen), icon: MessageSquare, label: 'AI Chat', active: chatOpen, iconClass: 'text-purple-400' },
            { path: '/crypto', icon: Bitcoin, label: 'Crypto' },
            { path: '/forecast', icon: BrainCircuit, label: 'Forecast' },
          ].map((item, i) => {
            const Icon = item.icon
            const isActive = item.path ? location.pathname === item.path : item.active
            return item.path ? (
              <Link key={i} to={item.path}
                className={`flex flex-col items-center gap-1 ${isActive ? 'text-blue-400 font-bold' : ''}`}
                style={{ color: isActive ? undefined : 'var(--text-muted)' }}>
                <Icon className={`w-5 h-5 ${item.iconClass || ''}`} />
                <span className="text-[10px]">{item.label}</span>
              </Link>
            ) : (
              <button key={i} onClick={item.onClick}
                className={`flex flex-col items-center gap-1 ${isActive ? 'text-blue-400' : ''}`}
                style={{ color: isActive ? undefined : 'var(--text-muted)' }}>
                <Icon className={`w-5 h-5 ${item.iconClass || ''}`} />
                <span className="text-[10px]">{item.label}</span>
              </button>
            )
          })}
        </nav>
      )}

      {/* ── 6. SHARE CARD MODAL ─────────────────────── */}
      <ShareCard isOpen={shareOpen} onClose={() => setShareOpen(false)} />
    </div>
  )
}
