import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAlerts } from '../context/AlertContext'
import { supabase } from '../services/supabase'
import { getStockQuote, TOP_TICKERS, StockWebSocket } from '../services/finnhub'
import Counter from '../components/Counter'
import { 
  TrendingUp, TrendingDown, DollarSign, Award, Target, 
  ShieldAlert, RefreshCw, Star, ArrowUpRight, ArrowDownRight, 
  Activity, PlayCircle, Eye, FileText
} from 'lucide-react'
import { motion } from 'framer-motion'
import { downloadPDFReport, downloadExcelReport } from '../services/reports'

export default function Dashboard() {
  const { user, profile, refreshProfile } = useAuth()
  const { triggerToast, checkPriceAlerts } = useAlerts()

  // Portfolio states
  const [holdings, setHoldings] = useState([])
  const [loadingHoldings, setLoadingHoldings] = useState(true)
  const [portfolioStats, setPortfolioStats] = useState({
    totalValue: 0,
    totalInvestment: 0,
    todayPL: 0,
    todayPLPercent: 0,
    totalPL: 0,
    totalPLPercent: 0,
    riskScore: 0
  })

  // Market Movers tab: 'gainers', 'losers', 'active'
  const [moversTab, setMoversTab] = useState('gainers')
  const [moversData, setMoversData] = useState({ gainers: [], losers: [], active: [] })
  
  // Market status state
  const [marketOpen, setMarketOpen] = useState(true)

  // Fetch portfolio data
  const fetchPortfolio = async () => {
    if (!user) return
    setLoadingHoldings(true)
    try {
      const { data, error } = await supabase
        .from('portfolio')
        .select('*')
        .eq('user_id', user.id)

      if (error) throw error

      // For each holding, fetch the latest quote to update current valuation
      const updatedHoldings = await Promise.all(
        (data || []).map(async (item) => {
          const quote = await getStockQuote(item.stock_symbol)
          return {
            ...item,
            current_price: quote.price,
            prevClose: quote.prevClose,
            changePercent: quote.changePercent
          }
        })
      )

      setHoldings(updatedHoldings)
      calculateStats(updatedHoldings)
    } catch (err) {
      console.error('Error fetching portfolio:', err)
      triggerToast('Portfolio Error', 'Failed to retrieve holdings.', 'error')
    } finally {
      setLoadingHoldings(false)
    }
  }

  // Calculate statistics from holdings
  const calculateStats = (items) => {
    let totalValue = 0
    let totalInvestment = 0
    let todayPL = 0
    
    items.forEach((item) => {
      const cost = item.quantity * item.buy_price
      const value = item.quantity * item.current_price
      const dailyPL = item.quantity * (item.current_price - (item.prevClose || item.buy_price))
      
      totalInvestment += cost
      totalValue += value
      todayPL += dailyPL
    })

    const totalPL = totalValue - totalInvestment
    const totalPLPercent = totalInvestment > 0 ? (totalPL / totalInvestment) * 100 : 0
    const todayPLPercent = totalValue > 0 ? (todayPL / totalValue) * 100 : 0

    // Risk score calculation based on sector weightage & counts
    const uniqueSectors = new Set(items.map(i => {
      const ticker = TOP_TICKERS.find(t => t.symbol.toUpperCase() === i.stock_symbol.toUpperCase())
      return ticker?.sector || 'Other'
    }))
    
    // Simple mock risk score formula: fewer holdings / fewer sectors = higher risk
    let calculatedRisk = 0
    if (items.length > 0) {
      const sectorConcentration = uniqueSectors.size / items.length
      calculatedRisk = Math.max(1.5, Math.min(10.0, 10 - (sectorConcentration * 5) - (items.length * 0.2)))
    } else {
      calculatedRisk = 0
    }

    setPortfolioStats({
      totalValue,
      totalInvestment,
      todayPL,
      todayPLPercent,
      totalPL,
      totalPLPercent,
      riskScore: calculatedRisk || profile?.risk_score || 0
    })
  }

  // Sort & setup market movers lists
  const setupMarketMovers = () => {
    const list = [...TOP_TICKERS]
    
    // Sort logic
    const sortedByChange = [...list].sort((a, b) => b.change - a.change)
    const gainers = sortedByChange.slice(0, 4)
    const losers = [...sortedByChange].reverse().slice(0, 4)
    const active = [...list].sort((a, b) => b.volume - a.volume).slice(0, 4)

    setMoversData({ gainers, losers, active })
  }

  useEffect(() => {
    fetchPortfolio()
    setupMarketMovers()

    // Determine market open (Mock market times - open on weekdays 9:15 AM - 3:30 PM IST)
    const now = new Date()
    const day = now.getDay()
    const hours = now.getHours()
    const minutes = now.getMinutes()
    const timeValue = hours * 100 + minutes
    
    // Mon-Fri, 9:15 - 15:30
    if (day >= 1 && day <= 5 && timeValue >= 915 && timeValue <= 1530) {
      setMarketOpen(true)
    } else {
      setMarketOpen(false)
    }
  }, [user])

  // Establish WebSockets for real-time portfolio price adjustments
  useEffect(() => {
    if (holdings.length === 0) return

    const ws = new WebSocket('wss://ws.finnhub.io?token=d8qbji1r01qr03nh1av0d8qbji1r01qr03nh1avg')
    
    ws.onopen = () => {
      holdings.forEach(h => {
        ws.send(JSON.stringify({ type: 'subscribe', symbol: h.stock_symbol.toUpperCase() }))
      })
    }

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data)
      if (msg.type === 'trade' && msg.data) {
        let updated = false
        const updatedHoldings = holdings.map((h) => {
          const match = msg.data.find(t => t.s.toUpperCase() === h.stock_symbol.toUpperCase())
          if (match) {
            updated = true
            // Run real-time threshold check for notifications
            checkPriceAlerts(h.stock_symbol, match.p)
            return {
              ...h,
              current_price: match.p
            }
          }
          return h
        })
        if (updated) {
          setHoldings(updatedHoldings)
          calculateStats(updatedHoldings)
        }
      }
    }

    return () => ws.close()
  }, [holdings.length])

  // Helpers
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(val || 0)
  }

  const calculateSectorWeights = (items) => {
    let totalVal = 0
    const sectorValues = {}
    items.forEach((item) => {
      const val = item.quantity * item.current_price
      totalVal += val
      const tickerInfo = TOP_TICKERS.find(t => t.symbol.toUpperCase() === item.stock_symbol.toUpperCase())
      const sectorName = tickerInfo ? tickerInfo.sector : 'Other'
      sectorValues[sectorName] = (sectorValues[sectorName] || 0) + val
    })
    const weights = {}
    Object.keys(sectorValues).forEach((sec) => {
      weights[sec] = parseFloat(((sectorValues[sec] / totalVal) * 100).toFixed(2))
    })
    return weights
  }

  return (
    <div className="space-y-6">
      {/* Upper Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight font-display">
            Welcome Back, <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">{profile?.name || 'Investor'}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Here is a real-time overview of your wealth and active markets.</p>
        </div>

        {/* Market Status Widget */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${marketOpen ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-350">
              Market: {marketOpen ? 'Open' : 'Closed'}
            </span>
          </div>
          <button
            onClick={fetchPortfolio}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-100 border border-slate-800 rounded-xl transition-all cursor-pointer active:scale-95"
            title="Refresh valuations"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* PORTFOLIO METRICS COUNTER LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Value */}
        <div className="glass-panel p-5 bg-gradient-to-tr from-slate-900/50 to-slate-950/40 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-[100px] pointer-events-none group-hover:bg-blue-500/10 transition-colors" />
          <DollarSign className="w-5 h-5 text-blue-400 mb-2.5" />
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Total Valuation</p>
          <h2 className="text-xl md:text-2xl font-bold font-display text-slate-100 mt-1">
            <Counter value={portfolioStats.totalValue} prefix="₹" />
          </h2>
        </div>

        {/* Total Investment */}
        <div className="glass-panel p-5 bg-gradient-to-tr from-slate-900/50 to-slate-950/40 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-slate-500/5 rounded-bl-[100px] pointer-events-none" />
          <Award className="w-5 h-5 text-purple-400 mb-2.5" />
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Invested Value</p>
          <h2 className="text-xl md:text-2xl font-bold font-display text-slate-200 mt-1">
            <Counter value={portfolioStats.totalInvestment} prefix="₹" />
          </h2>
        </div>

        {/* Today's Profit/Loss */}
        <div className="glass-panel p-5 bg-gradient-to-tr from-slate-900/50 to-slate-950/40 relative overflow-hidden group">
          <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-[100px] pointer-events-none ${
            portfolioStats.todayPL >= 0 ? 'bg-emerald-500/5' : 'bg-red-500/5'
          }`} />
          {portfolioStats.todayPL >= 0 ? (
            <TrendingUp className="w-5 h-5 text-emerald-400 mb-2.5" />
          ) : (
            <TrendingDown className="w-5 h-5 text-red-400 mb-2.5" />
          )}
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Today's Return</p>
          <h2 className={`text-xl md:text-2xl font-bold font-display mt-1 ${
            portfolioStats.todayPL >= 0 ? 'text-emerald-450' : 'text-red-450'
          }`}>
            <Counter value={portfolioStats.todayPL} prefix={portfolioStats.todayPL >= 0 ? '+₹' : '-₹'} />
          </h2>
          <p className={`text-[10px] font-bold mt-1 flex items-center gap-0.5 ${
            portfolioStats.todayPL >= 0 ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {portfolioStats.todayPLPercent.toFixed(2)}%
          </p>
        </div>

        {/* Total Returns % */}
        <div className="glass-panel p-5 bg-gradient-to-tr from-slate-900/50 to-slate-950/40 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-bl-[100px] pointer-events-none" />
          <Target className="w-5 h-5 text-teal-400 mb-2.5" />
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">All-Time Yield</p>
          <h2 className={`text-xl md:text-2xl font-bold font-display mt-1 ${
            portfolioStats.totalPL >= 0 ? 'text-emerald-450' : 'text-red-450'
          }`}>
            <Counter value={portfolioStats.totalPL} prefix={portfolioStats.totalPL >= 0 ? '+₹' : '-₹'} />
          </h2>
          <p className={`text-[10px] font-bold mt-1 ${
            portfolioStats.totalPL >= 0 ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {portfolioStats.totalPLPercent.toFixed(2)}%
          </p>
        </div>

        {/* Risk Score */}
        <div className="glass-panel p-5 bg-gradient-to-tr from-slate-900/50 to-slate-950/40 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-[100px] pointer-events-none" />
          <ShieldAlert className="w-5 h-5 text-amber-400 mb-2.5" />
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">AI Risk Score</p>
          <h2 className="text-xl md:text-2xl font-bold font-display text-slate-100 mt-1">
            <Counter value={portfolioStats.riskScore} decimals={1} suffix="/10" />
          </h2>
          <p className="text-[9px] text-slate-500 font-medium mt-1">
            {portfolioStats.riskScore > 7 ? 'High Concentration' : portfolioStats.riskScore > 4 ? 'Moderate' : portfolioStats.riskScore > 0 ? 'Conservative' : 'No Holdings'}
          </p>
        </div>
      </div>

      {/* CORE INFO DIVISION GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Real-time holdings table & watchlists links */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-100 font-display flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" /> Active Holdings
              </h3>
              <Link to="/paper-trading" className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-0.5">
                Manage Trades <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loadingHoldings ? (
              <div className="space-y-3 py-6">
                <div className="h-6 bg-slate-800/40 rounded-lg animate-pulse w-full" />
                <div className="h-6 bg-slate-800/40 rounded-lg animate-pulse w-full" />
                <div className="h-6 bg-slate-800/40 rounded-lg animate-pulse w-full" />
              </div>
            ) : holdings.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl">
                <Coins className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No active assets in your mock portfolio.</p>
                <Link
                  to="/paper-trading"
                  className="mt-3 inline-flex text-[11px] bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-lg transition-all"
                >
                  Buy First Stock
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-850 text-slate-400 pb-2">
                      <th className="py-2">Symbol</th>
                      <th className="py-2">Quantity</th>
                      <th className="py-2">Avg Buy Price</th>
                      <th className="py-2">Current Value</th>
                      <th className="py-2 text-right">Day Returns</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holdings.map((h) => {
                      const value = h.quantity * h.current_price
                      const dailyGain = h.quantity * (h.current_price - (h.prevClose || h.buy_price))
                      const percent = h.changePercent || 0
                      
                      return (
                        <tr key={h.id} className="border-b border-slate-850/60 hover:bg-slate-900/20">
                          <td className="py-3 font-semibold text-slate-100 flex items-center gap-1.5">
                            <span className="font-display">{h.stock_symbol}</span>
                          </td>
                          <td className="py-3 text-slate-300">{h.quantity}</td>
                          <td className="py-3 text-slate-400">{formatCurrency(h.buy_price)}</td>
                          <td className="py-3 text-slate-200 font-bold">{formatCurrency(value)}</td>
                          <td className={`py-3 text-right font-bold ${dailyGain >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {dailyGain >= 0 ? '+' : ''}{formatCurrency(dailyGain)}
                            <span className="block text-[9px] font-medium">({percent >= 0 ? '+' : ''}{percent.toFixed(2)}%)</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Market Movers (Gainers/Losers/Active) & IPOs quick summary */}
        <div className="space-y-6">
          {/* Market Movers Widget */}
          <div className="glass-panel p-5">
            <h3 className="text-sm font-bold text-slate-100 font-display flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-blue-400" /> Market Movers
            </h3>

            {/* Tab buttons */}
            <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-850 mb-4">
              {['gainers', 'losers', 'active'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setMoversTab(tab)}
                  className={`text-[10px] font-bold py-1.5 rounded-lg capitalize cursor-pointer transition-all ${
                    moversTab === tab
                      ? 'bg-blue-600/10 text-blue-400 border border-blue-900/25'
                      : 'text-slate-500 hover:text-slate-350'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* List */}
            <div className="space-y-3">
              {moversData[moversTab].map((stock) => (
                <div
                  key={stock.symbol}
                  className="p-3 bg-slate-900/30 hover:bg-slate-900/50 border border-slate-850/50 rounded-xl flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-bold text-slate-200 font-display">{stock.symbol}</span>
                    <span className="block text-[9px] text-slate-500">{stock.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-100">{formatCurrency(stock.price)}</span>
                    <span className={`block text-[9px] font-bold flex items-center gap-0.5 justify-end ${
                      stock.change >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {stock.change >= 0 ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                      {Math.abs(stock.change).toFixed(2)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick status tiles */}
          <div className="grid grid-cols-2 gap-4">
            <Link to="/risk" className="glass-panel p-4 bg-slate-900/40 hover:bg-slate-850/40 text-left border border-slate-850/80 flex flex-col gap-2 transition-all">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Risk Analysis</span>
              <span className="text-xs font-medium text-slate-250 hover:underline">View Exposure →</span>
            </Link>
            <Link to="/goals" className="glass-panel p-4 bg-slate-900/40 hover:bg-slate-850/40 text-left border border-slate-850/80 flex flex-col gap-2 transition-all">
              <Target className="w-4 h-4 text-emerald-500" />
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Goal Progress</span>
              <span className="text-xs font-medium text-slate-250 hover:underline">Set Financial Target →</span>
            </Link>
          </div>

          {/* Download Reports Widget */}
          <div className="glass-panel p-5 bg-gradient-to-br from-slate-900/60 to-blue-950/10 border border-blue-900/20">
            <h3 className="text-sm font-bold text-slate-100 font-display mb-2 flex items-center gap-1.5">
              <FileText className="w-4.5 h-4.5 text-blue-400" /> Export Performance Audit
            </h3>
            <p className="text-[10px] text-slate-400 mb-4 leading-relaxed">
              Compile portfolio valuations, daily returns ledger, sector allocations, and AI forecasts into enterprise-ready reports.
            </p>
            <div className="flex gap-2.5">
              <button
                onClick={() => {
                  const weights = calculateSectorWeights(holdings)
                  downloadPDFReport(holdings, portfolioStats, {
                    sectorWeights: weights,
                    volatilityIndex: portfolioStats.riskScore > 7 ? 'High' : portfolioStats.riskScore > 4 ? 'Medium' : 'Low',
                    drawdownPercent: portfolioStats.riskScore > 7 ? 24.8 : portfolioStats.riskScore > 4 ? 12.5 : 7.4
                  })
                }}
                className="flex-1 py-2 bg-red-950/30 hover:bg-red-900/20 border border-red-900/20 text-red-400 text-[10px] font-bold rounded-lg cursor-pointer transition-all text-center uppercase tracking-wider"
              >
                Download PDF
              </button>
              <button
                onClick={() => {
                  const weights = calculateSectorWeights(holdings)
                  downloadExcelReport(holdings, portfolioStats, {
                    sectorWeights: weights,
                    volatilityIndex: portfolioStats.riskScore > 7 ? 'High' : portfolioStats.riskScore > 4 ? 'Medium' : 'Low',
                    drawdownPercent: portfolioStats.riskScore > 7 ? 24.8 : portfolioStats.riskScore > 4 ? 12.5 : 7.4
                  })
                }}
                className="flex-1 py-2 bg-emerald-950/30 hover:bg-emerald-900/20 border border-emerald-900/20 text-emerald-400 text-[10px] font-bold rounded-lg cursor-pointer transition-all text-center uppercase tracking-wider"
              >
                Download Excel
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
