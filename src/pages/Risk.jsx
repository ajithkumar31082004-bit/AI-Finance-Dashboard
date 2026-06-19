import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useAlerts } from '../context/AlertContext'
import { supabase } from '../services/supabase'
import { TOP_TICKERS } from '../services/finnhub'
import { ShieldAlert, BarChart2, CheckCircle, RefreshCw, AlertTriangle, Sparkles, TrendingUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Risk() {
  const { user } = useAuth()
  const { triggerToast } = useAlerts()
  
  const [holdings, setHoldings] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Risk metrics state
  const [metrics, setMetrics] = useState({
    diversificationScore: 0,
    volatilityIndex: 'Low',
    drawdownPercent: 0,
    sectorWeights: {}
  })

  // AI Risk Analysis State
  const [aiReport, setAiReport] = useState('')
  const [loadingAi, setLoadingAi] = useState(false)

  const fetchHoldingsAndCalculate = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('portfolio')
        .select('*')
        .eq('user_id', user.id)

      if (error) throw error
      setHoldings(data || [])
      calculateRiskMetrics(data || [])
    } catch (err) {
      console.error(err)
      triggerToast('Risk Calculation Error', 'Failed to retrieve holdings.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const calculateRiskMetrics = (items) => {
    if (items.length === 0) {
      setMetrics({
        diversificationScore: 0,
        volatilityIndex: 'None',
        drawdownPercent: 0,
        sectorWeights: {}
      })
      return
    }

    // 1. Calculate values and sector distribution
    let totalVal = 0
    const sectorValues = {}
    
    items.forEach((item) => {
      const val = item.quantity * item.current_price
      totalVal += val
      
      const tickerInfo = TOP_TICKERS.find(t => t.symbol.toUpperCase() === item.stock_symbol.toUpperCase())
      const sectorName = tickerInfo ? tickerInfo.sector : 'Other'
      
      sectorValues[sectorName] = (sectorValues[sectorName] || 0) + val
    })

    // 2. Weights
    const sectorWeights = {}
    Object.keys(sectorValues).forEach((sec) => {
      sectorWeights[sec] = parseFloat(((sectorValues[sec] / totalVal) * 100).toFixed(2))
    })

    // 3. Diversification score: 100 max, penalizes heavy concentration
    const sectorCount = Object.keys(sectorWeights).length
    const maxWeight = Math.max(...Object.values(sectorWeights))
    const diversificationScore = Math.max(10, Math.min(100, Math.round((sectorCount * 15) + (100 - maxWeight))))

    // 4. Volatility Index & Max Drawdown mock estimates based on holdings profile
    let volatility = 'Medium'
    let drawdown = 12.5 // Base drawdown
    
    if (maxWeight > 65) {
      volatility = 'High'
      drawdown = 24.8
    } else if (sectorCount >= 3 && maxWeight < 45) {
      volatility = 'Low'
      drawdown = 7.4
    }

    setMetrics({
      diversificationScore,
      volatilityIndex: volatility,
      drawdownPercent: drawdown,
      sectorWeights
    })
  }

  useEffect(() => {
    fetchHoldingsAndCalculate()
  }, [user])

  // Call Gemini API to analyze portfolio risk profile
  const handleGenerateAiRiskAudit = async () => {
    if (holdings.length === 0) {
      triggerToast('Empty Portfolio', 'Add stock holdings first to evaluate risk.', 'warning')
      return
    }
    setLoadingAi(true)
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY
      if (!apiKey) {
        setAiReport("Gemini API key is not configured. Falling back to local assessment: Your portfolio shows standard concentration. Ensure sector exposure is spread across Banking, IT, and defensive sectors like FMCG to optimize drawdown percentages.")
        setLoadingAi(false)
        return
      }

      // Query Gemini directly for risk analysis
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Perform a detailed portfolio risk audit analysis.
              Holdings: ${holdings.map(h => `${h.stock_symbol}: Qty=${h.quantity}, AvgCost=₹${h.buy_price}, CurrentVal=₹${h.quantity * h.current_price}`).join('\n')}
              Metrics Calculated:
              - Diversification Score: ${metrics.diversificationScore}/100
              - Volatility Level: ${metrics.volatilityIndex}
              - Maximum Drawdown Exposure: ${metrics.drawdownPercent}%
              - Sector Weightings: ${JSON.stringify(metrics.sectorWeights)}

              Write a concise 3-paragraph risk assessment evaluating:
              1. Concentration risk and sector weights safety.
              2. Potential downside drawdown threat.
              3. Practical hedging or diversification suggestions (e.g. adding specific sectors or bonds).
              Avoid general greeting or filler text. Return markdown.`
            }]
          }]
        })
      })

      const data = await res.json()
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Unable to load analysis.'
      setAiReport(text)
    } catch (err) {
      console.error(err)
      triggerToast('AI Analysis Failed', 'Could not access risk model.', 'error')
    } finally {
      setLoadingAi(false)
    }
  }

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(val || 0)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight font-display flex items-center gap-2">
            <ShieldAlert className="w-8 h-8 text-amber-500" /> Portfolio Risk Engine
          </h1>
          <p className="text-xs text-slate-400 mt-1">Audit asset concentration, calculate sector volatility indices, and generate AI Risk Audits.</p>
        </div>

        <button
          onClick={fetchHoldingsAndCalculate}
          className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-100 border border-slate-800 rounded-xl transition-all cursor-pointer active:scale-95"
          title="Recalculate metrics"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {holdings.length === 0 ? (
        <div className="text-center py-20 glass-panel border border-dashed border-slate-850">
          <ShieldAlert className="w-10 h-10 text-slate-650 mx-auto mb-2.5" />
          <p className="text-sm text-slate-450">No holdings found. Purchase assets in the Simulator to initiate Risk auditing.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Columns (Calculated stats + sector weights) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Numeric Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Diversification */}
              <div className="glass-panel p-4 text-left relative overflow-hidden">
                <BarChart2 className="w-4.5 h-4.5 text-blue-400 mb-2" />
                <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider block">Diversification</span>
                <h2 className="text-xl font-bold text-slate-100 font-display mt-0.5">{metrics.diversificationScore}/100</h2>
                <span className="text-[8px] text-slate-500 block mt-1">
                  {metrics.diversificationScore > 75 ? 'Highly Diversified' : metrics.diversificationScore > 45 ? 'Moderate' : 'High Risk Concentration'}
                </span>
              </div>

              {/* Volatility */}
              <div className="glass-panel p-4 text-left relative overflow-hidden">
                <TrendingUp className="w-4.5 h-4.5 text-purple-400 mb-2" />
                <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider block">Volatility Index</span>
                <h2 className={`text-xl font-bold font-display mt-0.5 ${
                  metrics.volatilityIndex === 'High' ? 'text-red-400' : metrics.volatilityIndex === 'Medium' ? 'text-amber-400' : 'text-emerald-400'
                }`}>{metrics.volatilityIndex}</h2>
                <span className="text-[8px] text-slate-500 block mt-1">Calculated from asset weights</span>
              </div>

              {/* Drawdown */}
              <div className="glass-panel p-4 text-left relative overflow-hidden">
                <AlertTriangle className="w-4.5 h-4.5 text-red-400 mb-2" />
                <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider block">Downside Drawdown</span>
                <h2 className="text-xl font-bold text-slate-100 font-display mt-0.5">{metrics.drawdownPercent}%</h2>
                <span className="text-[8px] text-slate-500 block mt-1">Estimated worst-case drop</span>
              </div>
            </div>

            {/* Sector Weightings Progression chart list */}
            <div className="glass-panel p-5">
              <h3 className="text-sm font-bold text-slate-100 font-display mb-4">Sector Exposure Breakdown</h3>
              <div className="space-y-4">
                {Object.entries(metrics.sectorWeights).map(([secName, weight]) => (
                  <div key={secName} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-350 font-semibold">{secName}</span>
                      <span className="text-slate-400 font-bold">{weight}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                      <div 
                        className="h-full bg-blue-500 rounded-full" 
                        style={{ width: `${weight}%` }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: AI Risk Audit report */}
          <div className="glass-panel p-5 bg-gradient-to-br from-slate-900 to-purple-950/15 relative overflow-hidden flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-100 font-display flex items-center gap-1.5 mb-4 border-b border-slate-850 pb-3">
                <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" /> AI Risk Audit Reports
              </h3>

              <AnimatePresence mode="wait">
                {loadingAi ? (
                  <div className="space-y-3 animate-pulse">
                    <div className="h-3 bg-slate-800 rounded w-full" />
                    <div className="h-3 bg-slate-800 rounded w-11/12" />
                    <div className="h-3 bg-slate-800 rounded w-10/12" />
                  </div>
                ) : aiReport ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-slate-300 leading-relaxed space-y-3 whitespace-pre-line"
                  >
                    {aiReport}
                  </motion.div>
                ) : (
                  <div className="text-center py-10 text-slate-550 italic">
                    Click trigger below to execute Gemini AI portfolio auditing.
                  </div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={handleGenerateAiRiskAudit}
              disabled={loadingAi}
              className="mt-6 w-full py-2.5 bg-gradient-to-r from-purple-650 to-blue-600 hover:from-purple-550 hover:to-blue-500 text-white font-bold text-xs rounded-lg shadow-lg shadow-purple-950/30 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-55"
            >
              {loadingAi ? 'Auditing Portfolio...' : 'Generate AI Risk Audit'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
