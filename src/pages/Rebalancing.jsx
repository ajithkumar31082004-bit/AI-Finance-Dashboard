import React, { useState } from 'react'
import { RefreshCw, Target, AlertTriangle, TrendingUp, PieChart, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { getStockForecast } from '../services/gemini'

const SECTORS = ['IT', 'Banking', 'Energy', 'Healthcare', 'FMCG', 'Auto', 'Infra', 'Real Estate']

const DEFAULT_PORTFOLIO = [
  { sector: 'IT', current: 38 },
  { sector: 'Banking', current: 25 },
  { sector: 'Energy', current: 18 },
  { sector: 'Healthcare', current: 8 },
  { sector: 'FMCG', current: 6 },
  { sector: 'Auto', current: 5 },
]

const RISK_TARGETS = {
  conservative: { IT: 20, Banking: 25, Energy: 10, Healthcare: 20, FMCG: 15, Auto: 5, Infra: 5 },
  moderate:     { IT: 30, Banking: 20, Energy: 15, Healthcare: 15, FMCG: 10, Auto: 5, Infra: 5 },
  aggressive:   { IT: 40, Banking: 15, Energy: 20, Healthcare: 10, FMCG: 5, Auto: 5, Infra: 5 },
}

const RISK_COLORS = {
  conservative: 'from-blue-500 to-cyan-500',
  moderate:     'from-emerald-500 to-teal-500',
  aggressive:   'from-orange-500 to-red-500',
}

const SECTOR_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316', '#84cc16'
]

export default function Rebalancing() {
  const [portfolio, setPortfolio] = useState(DEFAULT_PORTFOLIO)
  const [riskProfile, setRiskProfile] = useState('moderate')
  const [portfolioValue, setPortfolioValue] = useState(500000)
  const [aiAdvice, setAiAdvice] = useState('')
  const [loadingAI, setLoadingAI] = useState(false)

  const targets = RISK_TARGETS[riskProfile]

  const getRebalanceActions = () => {
    return portfolio.map(p => {
      const target = targets[p.sector] || 0
      const diff = target - p.current
      const amount = (Math.abs(diff) / 100) * portfolioValue
      return { ...p, target, diff, amount }
    })
  }

  const actions = getRebalanceActions()
  const totalBuy = actions.filter(a => a.diff > 0).reduce((s, a) => s + a.amount, 0)
  const totalSell = actions.filter(a => a.diff < 0).reduce((s, a) => s + a.amount, 0)

  const formatCur = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v)

  const fetchAIAdvice = async () => {
    setLoadingAI(true)
    try {
      const prompt = `You are a SEBI-registered financial advisor. Analyze this Indian equity portfolio and give rebalancing advice:
Current Allocation: ${JSON.stringify(portfolio)}
Risk Profile: ${riskProfile}
Target Allocation: ${JSON.stringify(targets)}
Portfolio Value: ₹${portfolioValue.toLocaleString('en-IN')}
Give: 3 specific rebalancing recommendations, market rationale, and one key risk to watch. Be concise (150 words max).`
      const result = await getStockForecast(`PORTFOLIO_REBALANCE_${riskProfile.toUpperCase()}`, 0, {})
      setAiAdvice(typeof result === 'string' ? result : JSON.stringify(result))
    } catch {
      setAiAdvice('AI analysis unavailable. Based on your profile: Reduce overweight IT position, increase Healthcare exposure for defensive coverage, and trim Energy given global demand uncertainty.')
    }
    setLoadingAI(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight font-display flex items-center gap-2">
          <RefreshCw className="w-8 h-8 text-teal-400" /> Portfolio Rebalancing Tool
        </h1>
        <p className="text-xs text-slate-400 mt-1">AI-powered analysis to align your portfolio with your risk profile and target sector allocation.</p>
      </div>

      {/* Risk Profile Selection */}
      <div className="flex gap-3 flex-wrap">
        {(['conservative', 'moderate', 'aggressive']).map(r => (
          <button key={r} onClick={() => setRiskProfile(r)}
            className={`flex-1 min-w-[130px] py-3 px-4 rounded-2xl font-bold text-sm capitalize transition-all cursor-pointer ${
              riskProfile === r
                ? `bg-gradient-to-r ${RISK_COLORS[r]} text-white shadow-lg`
                : 'glass-panel text-slate-400 hover:text-slate-200 border-slate-800'
            }`}>
            {r === 'conservative' ? '🛡️' : r === 'moderate' ? '⚖️' : '🚀'} {r}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current vs Target Visual */}
        <div className="glass-panel p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Allocation Overview</h3>
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-slate-500">Portfolio Value</span>
              <input type="number" value={portfolioValue} onChange={e => setPortfolioValue(Number(e.target.value))}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-200 w-24 outline-none" />
            </div>
          </div>

          <div className="space-y-3">
            {actions.map((a, i) => (
              <div key={a.sector}>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="font-bold text-slate-300">{a.sector}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500">Current: <span className="text-slate-300 font-bold">{a.current}%</span></span>
                    <span className="text-slate-500">Target: <span className="font-bold" style={{ color: SECTOR_COLORS[i] }}>{a.target}%</span></span>
                  </div>
                </div>
                {/* Current bar */}
                <div className="relative h-3 bg-slate-950 rounded-full overflow-hidden mb-0.5">
                  <div className="h-full bg-slate-700 rounded-full transition-all" style={{ width: `${a.current}%` }} />
                </div>
                {/* Target bar */}
                <div className="relative h-3 bg-slate-950 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${a.target}%`, backgroundColor: SECTOR_COLORS[i] + '80' }} />
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 text-[10px] text-slate-500 pt-1">
            <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-sm bg-slate-700 inline-block" /> Current</span>
            <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-sm bg-blue-500/50 inline-block" /> Target</span>
          </div>
        </div>

        {/* Rebalancing Actions */}
        <div className="glass-panel p-5 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Required Actions</h3>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
              <p className="text-[9px] text-emerald-400/70 font-bold uppercase">Total to Buy</p>
              <p className="text-sm font-extrabold text-emerald-400 font-display mt-0.5">{formatCur(totalBuy)}</p>
            </div>
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
              <p className="text-[9px] text-red-400/70 font-bold uppercase">Total to Sell</p>
              <p className="text-sm font-extrabold text-red-400 font-display mt-0.5">{formatCur(totalSell)}</p>
            </div>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-56">
            {actions.filter(a => a.diff !== 0).sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff)).map((a, i) => (
              <motion.div key={a.sector} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className={`flex items-center justify-between p-3 rounded-xl border text-xs ${
                  a.diff > 0
                    ? 'bg-emerald-500/5 border-emerald-500/15'
                    : 'bg-red-500/5 border-red-500/15'
                }`}>
                <div>
                  <span className="font-bold text-slate-200">{a.sector}</span>
                  <span className={`ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded ${a.diff > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {a.diff > 0 ? '▲ BUY' : '▼ SELL'}
                  </span>
                </div>
                <div className="text-right">
                  <p className={`font-bold font-display ${a.diff > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {a.diff > 0 ? '+' : ''}{a.diff.toFixed(1)}% ({formatCur(a.amount)})
                  </p>
                  <p className="text-[9px] text-slate-500">{a.current}% → {a.target}%</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Advisor */}
      <div className="glass-panel p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" /> AI Rebalancing Advisor
          </h3>
          <button onClick={fetchAIAdvice} disabled={loadingAI}
            className="px-4 py-2 bg-purple-600/80 hover:bg-purple-600 text-white text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-95 flex items-center gap-2 disabled:opacity-60">
            <Sparkles className={`w-3 h-3 ${loadingAI ? 'animate-pulse' : ''}`} />
            {loadingAI ? 'Analyzing...' : 'Get AI Advice'}
          </button>
        </div>
        {aiAdvice ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-purple-500/5 border border-purple-500/15 rounded-xl">
            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{aiAdvice}</p>
          </motion.div>
        ) : (
          <div className="p-6 text-center text-slate-500 text-xs">Click "Get AI Advice" for Gemini-powered personalized rebalancing recommendations.</div>
        )}
      </div>
    </div>
  )
}
