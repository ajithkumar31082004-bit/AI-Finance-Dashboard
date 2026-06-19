import React, { useRef } from 'react'
import { Share2, Download, TrendingUp, TrendingDown, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// Renders a beautiful shareable portfolio performance card
export default function ShareCard({ isOpen, onClose, portfolioData = {} }) {
  const cardRef = useRef(null)

  const {
    userName = 'APEX Investor',
    totalValue = 542850,
    totalInvested = 450000,
    dayChange = 3.28,
    overallReturn = 20.6,
    topHoldings = [
      { symbol: 'TCS', change: 5.2 },
      { symbol: 'RELIANCE', change: 3.8 },
      { symbol: 'HDFCBANK', change: -1.2 },
    ],
    badge = '🏆 Top Performer',
  } = portfolioData

  const isPositive = overallReturn >= 0
  const isDayPositive = dayChange >= 0
  const profit = totalValue - totalInvested

  const formatCur = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v)

  const copyToClipboard = async () => {
    try {
      const text = `📊 My Portfolio – APEX Finance\n💼 Value: ${formatCur(totalValue)}\n📈 Returns: ${overallReturn >= 0 ? '+' : ''}${overallReturn}%\n💰 P&L: ${formatCur(profit)}\n\nTrack yours at apex.finance 🚀`
      await navigator.clipboard.writeText(text)
      alert('Portfolio summary copied to clipboard!')
    } catch {
      console.warn('Clipboard not available')
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-md space-y-4"
          >
            {/* The Share Card */}
            <div ref={cardRef}
              className="relative overflow-hidden rounded-3xl p-6 text-white shadow-2xl"
              style={{
                background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1230 40%, #0f1a35 100%)',
                border: '1px solid rgba(59,130,246,0.25)',
                boxShadow: '0 0 60px rgba(59,130,246,0.12)',
              }}
            >
              {/* Decorative Glows */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

              {/* Header */}
              <div className="flex items-start justify-between relative z-10 mb-5">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="w-5 h-5 bg-gradient-to-br from-blue-400 to-purple-500 rounded-md flex items-center justify-center">
                      <TrendingUp className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase font-display">APEX Finance</span>
                  </div>
                  <p className="text-xs text-slate-300 font-semibold">{userName}</p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-full">
                  {badge}
                </span>
              </div>

              {/* Portfolio Value */}
              <div className="relative z-10 mb-5">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Portfolio Value</p>
                <p className="text-4xl font-extrabold font-display text-white tracking-tight">{formatCur(totalValue)}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className={`flex items-center gap-1 text-sm font-bold px-2.5 py-1 rounded-full ${isDayPositive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                    {isDayPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {isDayPositive ? '+' : ''}{dayChange}% today
                  </span>
                  <span className="text-[10px] text-slate-500">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>

              {/* Metrics Row */}
              <div className="grid grid-cols-3 gap-3 relative z-10 mb-5">
                {[
                  { label: 'Invested', value: formatCur(totalInvested), color: 'text-slate-300' },
                  { label: 'Total P&L', value: `${profit >= 0 ? '+' : ''}${formatCur(profit)}`, color: profit >= 0 ? 'text-emerald-400' : 'text-red-400' },
                  { label: 'Returns', value: `${isPositive ? '+' : ''}${overallReturn}%`, color: isPositive ? 'text-emerald-400' : 'text-red-400' },
                ].map(m => (
                  <div key={m.label} className="bg-white/5 border border-white/8 rounded-2xl p-3">
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{m.label}</p>
                    <p className={`text-xs font-extrabold font-display mt-1 ${m.color}`}>{m.value}</p>
                  </div>
                ))}
              </div>

              {/* Top Holdings */}
              <div className="relative z-10 mb-5">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-2">Top Holdings</p>
                <div className="flex gap-2 flex-wrap">
                  {topHoldings.map(h => (
                    <span key={h.symbol} className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                      h.change >= 0
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : 'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}>
                      {h.symbol} {h.change >= 0 ? '+' : ''}{h.change}%
                    </span>
                  ))}
                </div>
              </div>

              {/* Footer watermark */}
              <div className="relative z-10 flex items-center justify-between pt-4 border-t border-white/5">
                <p className="text-[9px] text-slate-600">Generated by APEX Finance • apex.finance</p>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-1 rounded-full bg-gradient-to-t from-blue-600 to-blue-400"
                      style={{ height: `${8 + Math.random() * 12}px`, opacity: 0.6 + i * 0.08 }} />
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button onClick={copyToClipboard}
                className="flex-1 py-3 bg-blue-600/90 hover:bg-blue-600 text-white text-xs font-bold rounded-2xl transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2">
                <Share2 className="w-4 h-4" /> Copy Summary
              </button>
              <button onClick={onClose}
                className="px-5 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white text-xs font-bold rounded-2xl transition-all cursor-pointer active:scale-95">
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
