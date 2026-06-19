import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Grid3X3, ArrowUpRight, ArrowDownRight, RefreshCw, Activity } from 'lucide-react'

// Set up sectors structure with default values
const HEATMAP_SECTORS = {
  'Banking': [
    { symbol: 'HDFCBANK', name: 'HDFC Bank', price: 1610.00, change: 0.85 },
    { symbol: 'ICICIBANK', name: 'ICICI Bank', price: 1120.00, change: -1.30 },
    { symbol: 'FEDERALBNK', name: 'Federal Bank', price: 165.00, change: 0.40 },
    { symbol: 'SOUTHBANK', name: 'South Indian Bank', price: 28.50, change: 1.50 }
  ],
  'IT (Tech)': [
    { symbol: 'TCS', name: 'TCS Ltd', price: 3820.00, change: -0.45 },
    { symbol: 'INFY', name: 'Infosys Ltd', price: 1480.00, change: 2.10 },
    { symbol: 'ZOMATO', name: 'Zomato Ltd', price: 185.00, change: 4.80 },
    { symbol: 'SUBEX', name: 'Subex Ltd', price: 35.00, change: -3.20 }
  ],
  'Energy': [
    { symbol: 'RELIANCE', name: 'Reliance Industries', price: 2450.00, change: 1.25 },
    { symbol: 'TATACHEM', name: 'Tata Chemicals', price: 1080.00, change: -2.10 }
  ],
  'FMCG': [
    { symbol: 'ITC', name: 'ITC Ltd', price: 430.00, change: 0.15 },
    { symbol: 'BATAINDIA', name: 'Bata India', price: 1350.00, change: -0.90 }
  ],
  'Pharma': [
    { symbol: 'SUNPHARMA', name: 'Sun Pharma', price: 1540.00, change: -0.65 },
    { symbol: 'GLENMARK', name: 'Glenmark Pharma', price: 1020.00, change: 1.65 },
    { symbol: 'WOCKPHARMA', name: 'Wockhardt Ltd', price: 540.00, change: 6.20 }
  ],
  'Auto': [
    { symbol: 'TATAMOTORS', name: 'Tata Motors', price: 960.00, change: 3.40 },
    { symbol: 'FORCEGEOT', name: 'Force Motors', price: 8800.00, change: 0.80 }
  ]
}

export default function Heatmap() {
  const [sectors, setSectors] = useState(HEATMAP_SECTORS)
  const [updating, setUpdating] = useState(false)

  // Simulation of live price feeds
  useEffect(() => {
    const timer = setInterval(() => {
      setUpdating(true)
      
      setSectors((prev) => {
        const next = { ...prev }
        Object.keys(next).forEach((sec) => {
          next[sec] = next[sec].map((stock) => {
            // Adjust quote change by minor variance
            const variance = (Math.random() * 0.4 - 0.2) // -0.2% to +0.2%
            const nextChange = parseFloat((stock.change + variance).toFixed(2))
            
            return {
              ...stock,
              change: Math.max(-10.0, Math.min(10.0, nextChange)), // Cap -10% to 10%
              price: parseFloat((stock.price * (1 + variance / 100)).toFixed(2))
            }
          })
        })
        return next
      })

      setTimeout(() => setUpdating(false), 500)
    }, 4000)

    return () => clearInterval(timer)
  }, [])

  // Helper to get heat color block
  const getHeatColor = (change) => {
    if (change > 3.0) return 'bg-emerald-800 text-slate-100 hover:bg-emerald-700'
    if (change > 1.0) return 'bg-emerald-900/60 text-emerald-100 hover:bg-emerald-850'
    if (change > 0) return 'bg-emerald-950/40 text-emerald-200 border border-emerald-900/10'
    if (change < -3.0) return 'bg-red-800 text-slate-100 hover:bg-red-700'
    if (change < -1.0) return 'bg-red-900/60 text-red-100 hover:bg-red-850'
    return 'bg-red-950/40 text-red-200 border border-red-900/10'
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
            <Grid3X3 className="w-8 h-8 text-emerald-400" /> Market Heatmap
          </h1>
          <p className="text-xs text-slate-400 mt-1">Real-time sector performance overview. Green boxes represent gains; red boxes represent losses.</p>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-850 flex items-center gap-1.5 text-xs text-slate-400">
            <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
            <span>Updates: 4s intervals</span>
            {updating && <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-500" />}
          </div>
        </div>
      </div>

      {/* Grid of Sectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(sectors).map(([sectorName, stocks]) => (
          <div key={sectorName} className="glass-panel p-5 bg-[#0b0f19]/40 flex flex-col gap-3">
            <div className="flex justify-between items-center border-b border-slate-850 pb-2">
              <h3 className="text-xs font-bold text-slate-200 tracking-wider uppercase font-display">
                {sectorName}
              </h3>
              {/* Average sector change percentage */}
              <span className={`text-[10px] font-bold ${
                stocks.reduce((acc, s) => acc + s.change, 0) >= 0 ? 'text-emerald-450' : 'text-red-450'
              }`}>
                Avg: {(stocks.reduce((acc, s) => acc + s.change, 0) / stocks.length).toFixed(2)}%
              </span>
            </div>

            {/* Boxes inner grid */}
            <div className="grid grid-cols-2 gap-2">
              {stocks.map((stock) => (
                <Link
                  key={stock.symbol}
                  to={`/forecast?symbol=${stock.symbol}`}
                  className={`p-4 rounded-xl transition-all duration-350 cursor-pointer flex flex-col justify-between items-start select-none ${getHeatColor(
                    stock.change
                  )}`}
                >
                  <div className="w-full flex justify-between items-start">
                    <span className="text-xs font-bold tracking-wider font-display">{stock.symbol}</span>
                    <span className="text-[9px] font-extrabold flex items-center">
                      {stock.change >= 0 ? '+' : ''}
                      {stock.change.toFixed(2)}%
                    </span>
                  </div>
                  <div className="mt-3 w-full flex justify-between items-end">
                    <span className="text-[8px] opacity-75 truncate max-w-[60px]">{stock.name}</span>
                    <span className="text-[10px] font-bold">{formatCurrency(stock.price)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
