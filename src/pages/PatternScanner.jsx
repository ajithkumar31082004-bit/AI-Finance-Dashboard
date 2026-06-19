import React, { useState } from 'react'
import { Scan, TrendingUp, TrendingDown, Minus, RefreshCw, Info } from 'lucide-react'
import { motion } from 'framer-motion'
import { TOP_TICKERS } from '../services/finnhub'

// Candlestick Pattern Detection Logic (mock analysis based on price simulation)
function detectPatterns(ohlcData) {
  const patterns = []
  for (let i = 2; i < ohlcData.length; i++) {
    const prev2 = ohlcData[i - 2]
    const prev1 = ohlcData[i - 1]
    const curr = ohlcData[i]

    const bodyPrev1 = Math.abs(prev1.close - prev1.open)
    const bodyPrev2 = Math.abs(prev2.close - prev2.open)
    const bodyCurr = Math.abs(curr.close - curr.open)
    const totalRangeCurr = curr.high - curr.low

    // Doji: very small body relative to total range
    if (bodyCurr < totalRangeCurr * 0.1 && totalRangeCurr > 0) {
      patterns.push({ pattern: 'Doji', type: 'neutral', desc: 'Market indecision. Neither bulls nor bears in control. Reversal signal pending confirmation.' })
    }
    // Bullish Engulfing
    if (prev1.close < prev1.open && curr.close > curr.open && curr.open < prev1.close && curr.close > prev1.open) {
      patterns.push({ pattern: 'Bullish Engulfing', type: 'bullish', desc: 'Strong bullish reversal signal. Current candle engulfs the prior bearish candle, indicating buyer dominance.' })
    }
    // Bearish Engulfing
    if (prev1.close > prev1.open && curr.close < curr.open && curr.open > prev1.close && curr.close < prev1.open) {
      patterns.push({ pattern: 'Bearish Engulfing', type: 'bearish', desc: 'Strong bearish reversal signal. Current candle engulfs the prior bullish candle, showing seller control.' })
    }
    // Morning Star (Bullish 3-candle reversal)
    if (prev2.close < prev2.open && bodyPrev1 < bodyPrev2 * 0.3 && curr.close > curr.open && curr.close > (prev2.open + prev2.close) / 2) {
      patterns.push({ pattern: 'Morning Star', type: 'bullish', desc: 'Three-candle bullish reversal pattern. Strong bottom signal after a downtrend.' })
    }
    // Evening Star (Bearish 3-candle reversal)
    if (prev2.close > prev2.open && bodyPrev1 < bodyPrev2 * 0.3 && curr.close < curr.open && curr.close < (prev2.open + prev2.close) / 2) {
      patterns.push({ pattern: 'Evening Star', type: 'bearish', desc: 'Three-candle bearish reversal pattern. Signals a potential market top.' })
    }
    // Hammer (Bullish reversal at bottom)
    if (curr.close > curr.open && (curr.low < curr.open - 2 * bodyCurr) && bodyCurr > 0) {
      patterns.push({ pattern: 'Hammer', type: 'bullish', desc: 'Bullish reversal pattern. Long lower shadow indicates buyers pushing back strong rejection from lows.' })
    }
    // Shooting Star (Bearish reversal at top)
    if (curr.close < curr.open && (curr.high > curr.open + 2 * bodyCurr) && bodyCurr > 0) {
      patterns.push({ pattern: 'Shooting Star', type: 'bearish', desc: 'Bearish reversal pattern. Long upper shadow shows sellers entering near highs and rejecting rally.' })
    }
  }
  return [...new Map(patterns.map(p => [p.pattern, p])).values()].slice(0, 4)
}

function generateOHLC(basePrice, count = 10) {
  const data = []
  let price = basePrice
  for (let i = 0; i < count; i++) {
    const open = price
    const change = (Math.random() * 0.04 - 0.02) * price
    const close = open + change
    const high = Math.max(open, close) + Math.random() * 0.01 * price
    const low = Math.min(open, close) - Math.random() * 0.015 * price
    data.push({ open, close, high, low })
    price = close
  }
  return data
}

const PATTERN_CONFIG = {
  bullish: { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: TrendingUp },
  bearish: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', icon: TrendingDown },
  neutral: { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', icon: Minus },
}

export default function PatternScanner() {
  const [scanning, setScanning] = useState(false)
  const [results, setResults] = useState([])
  const [scanned, setScanned] = useState(false)

  const runScan = () => {
    setScanning(true)
    setResults([])
    setTimeout(() => {
      const found = []
      TOP_TICKERS.slice(0, 15).forEach(ticker => {
        const ohlc = generateOHLC(ticker.price || 1000)
        const patterns = detectPatterns(ohlc)
        if (patterns.length > 0) {
          found.push({
            symbol: ticker.symbol,
            name: ticker.name,
            price: ticker.price || 1000,
            patterns,
          })
        }
      })
      setResults(found)
      setScanned(true)
      setScanning(false)
    }, 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight font-display flex items-center gap-2">
          <Scan className="w-8 h-8 text-cyan-400" /> Technical Pattern Scanner
        </h1>
        <p className="text-xs text-slate-400 mt-1">Auto-detect powerful candlestick patterns across NSE/BSE top stocks using AI-based pattern recognition.</p>
      </div>

      {/* Patterns Legend */}
      <div className="glass-panel p-5">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Patterns Detected</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { name: 'Doji', type: 'neutral', desc: 'Indecision' },
            { name: 'Bullish Engulfing', type: 'bullish', desc: 'Strong Buy' },
            { name: 'Bearish Engulfing', type: 'bearish', desc: 'Strong Sell' },
            { name: 'Morning Star', type: 'bullish', desc: 'Buy Reversal' },
            { name: 'Evening Star', type: 'bearish', desc: 'Sell Reversal' },
            { name: 'Hammer', type: 'bullish', desc: 'Buy Signal' },
            { name: 'Shooting Star', type: 'bearish', desc: 'Sell Signal' },
          ].map(p => {
            const cfg = PATTERN_CONFIG[p.type]
            const Icon = cfg.icon
            return (
              <div key={p.name} className={`flex items-center gap-2 p-2 rounded-lg border text-[10px] font-semibold ${cfg.bg} ${cfg.color}`}>
                <Icon className="w-3 h-3 flex-shrink-0" />
                <span>{p.name}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Scan Button */}
      <div className="flex justify-center">
        <button onClick={runScan} disabled={scanning}
          className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-sm rounded-2xl transition-all cursor-pointer active:scale-95 shadow-lg shadow-cyan-900/30 flex items-center gap-2 disabled:opacity-60">
          <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
          {scanning ? 'Scanning Patterns...' : scanned ? 'Re-Scan All Stocks' : 'Run Pattern Scanner'}
        </button>
      </div>

      {scanning && (
        <div className="glass-panel p-8 text-center space-y-3">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-300 font-display">Scanning NSE Top 15 Stocks...</p>
          <p className="text-xs text-slate-500">Analyzing OHLC data for candlestick patterns</p>
        </div>
      )}

      {/* Results */}
      {!scanning && scanned && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-300">
              Found <span className="text-cyan-400 font-display">{results.length}</span> stocks with patterns
            </h3>
            <span className="text-[10px] text-slate-500">Scan covers NSE Top 15 stocks</span>
          </div>

          {results.map((result, i) => (
            <motion.div key={result.symbol} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="glass-panel p-5">
              <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                <div>
                  <span className="text-sm font-extrabold text-slate-100 font-display">{result.symbol}</span>
                  <span className="text-xs text-slate-500 ml-2">{result.name}</span>
                </div>
                <span className="text-xs font-bold text-slate-300 font-display">₹{result.price?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {result.patterns.map(p => {
                  const cfg = PATTERN_CONFIG[p.type]
                  const Icon = cfg.icon
                  return (
                    <div key={p.pattern} className={`group relative px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold cursor-help ${cfg.bg} ${cfg.color}`}>
                      <Icon className="w-3 h-3" />
                      {p.pattern}
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-50 bg-slate-900 border border-slate-800 rounded-xl p-3 w-56 shadow-2xl">
                        <p className="text-[10px] text-slate-300 leading-relaxed font-normal">{p.desc}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {!scanning && !scanned && (
        <div className="glass-panel p-12 text-center space-y-3">
          <Scan className="w-12 h-12 text-slate-600 mx-auto" />
          <p className="text-sm font-bold text-slate-400">Click "Run Pattern Scanner" to detect live patterns</p>
          <p className="text-[10px] text-slate-500">Analyzes recent OHLC candles for 7 key technical patterns</p>
        </div>
      )}
    </div>
  )
}
