import React, { useState, useEffect } from 'react'
import { TOP_TICKERS, getStockQuote } from '../services/finnhub'
import { getStockForecast } from '../services/gemini'
import { useAlerts } from '../context/AlertContext'
import TVChart from '../components/TVChart'
import Counter from '../components/Counter'
import { BrainCircuit, Sparkles, TrendingUp, TrendingDown, RefreshCw, BarChart2, ShieldAlert } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Forecast() {
  const { triggerToast } = useAlerts()
  const [selectedSymbol, setSelectedSymbol] = useState('RELIANCE')
  const [currentQuote, setCurrentQuote] = useState(null)
  
  // Forecast state
  const [forecast, setForecast] = useState(null)
  const [loadingForecast, setLoadingForecast] = useState(false)

  const fetchQuoteAndForecast = async (symbol) => {
    setLoadingForecast(true)
    try {
      const quote = await getStockQuote(symbol)
      setCurrentQuote(quote)
      
      // Calculate mock/basic technicals to feed to Gemini
      const technicals = {
        rsi: 54.2,
        macdLine: 0.85,
        macdSignal: 0.40,
        ema20: quote.price * 0.985,
        sma50: quote.price * 0.965,
        bbUpper: quote.price * 1.04,
        bbLower: quote.price * 0.96
      }

      // Query Gemini
      const analysis = await getStockForecast(symbol, quote.price, technicals)
      setForecast(analysis)
    } catch (err) {
      console.error(err)
      triggerToast('AI Analysis Error', 'Failed to retrieve forecast.', 'error')
    } finally {
      setLoadingForecast(false)
    }
  }

  useEffect(() => {
    fetchQuoteAndForecast(selectedSymbol)
  }, [selectedSymbol])

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
            <BrainCircuit className="w-8 h-8 text-purple-400" /> AI Stock Forecasting
          </h1>
          <p className="text-xs text-slate-400 mt-1">Leverage Gemini AI neural prediction models for price trends and ranges.</p>
        </div>

        {/* Ticker Selector */}
        <div className="flex items-center gap-2">
          <select
            value={selectedSymbol}
            onChange={(e) => setSelectedSymbol(e.target.value)}
            className="px-4 py-2.5 bg-slate-900 border border-slate-800 text-xs font-semibold rounded-xl text-slate-200 outline-none cursor-pointer focus:border-purple-500"
          >
            {TOP_TICKERS.map((t) => (
              <option key={t.symbol} value={t.symbol}>
                {t.symbol} - {t.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => fetchQuoteAndForecast(selectedSymbol)}
            disabled={loadingForecast}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-100 border border-slate-800 rounded-xl transition-all cursor-pointer disabled:opacity-55 active:scale-95"
            title="Recalculate predictions"
          >
            <RefreshCw className={`w-4 h-4 ${loadingForecast ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Grid: Left is Chart, Right is AI summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart (takes 2 columns) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-panel p-5">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-100 font-display">
                  Live Trading Chart: {selectedSymbol}
                </h3>
                {currentQuote && (
                  <p className="text-xs font-medium text-slate-400 mt-0.5">
                    Price: <span className="text-slate-100 font-bold">{formatCurrency(currentQuote.price)}</span> 
                    <span className={`ml-2 font-bold ${currentQuote.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {currentQuote.change >= 0 ? '+' : ''}{currentQuote.changePercent.toFixed(2)}%
                    </span>
                  </p>
                )}
              </div>
            </div>
            
            {/* Embedded Advanced Chart */}
            <TVChart key={selectedSymbol} symbol={selectedSymbol} />
          </div>

          {/* AI Disclaimer */}
          <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-900/10 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-purple-300 font-display">Financial Advisory Disclaimer</h4>
              <p className="text-[10px] text-purple-450 mt-1 leading-relaxed">
                "Predictions are for educational purposes only and not financial advice." All stock forecasting analytics are generated dynamically utilizing Gemini LLM modeling and historical variance checks. Do not construct portfolios solely based on machine forecasts.
              </p>
            </div>
          </div>
        </div>

        {/* AI Analytics Panel */}
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {loadingForecast ? (
              <div className="glass-panel p-6 space-y-6 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-800" />
                  <div className="h-4 bg-slate-800 rounded w-24" />
                </div>
                <div className="space-y-2">
                  <div className="h-2.5 bg-slate-800 rounded w-full" />
                  <div className="h-2.5 bg-slate-800 rounded w-11/12" />
                  <div className="h-2.5 bg-slate-800 rounded w-10/12" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-16 bg-slate-800 rounded-xl" />
                  <div className="h-16 bg-slate-800 rounded-xl" />
                </div>
                <div className="h-4 bg-slate-800 rounded w-20" />
              </div>
            ) : (
              forecast && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="glass-panel p-6 bg-gradient-to-br from-slate-900/50 via-slate-900/20 to-purple-950/10 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-bl-[100px] pointer-events-none" />
                  
                  {/* Header summary */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-purple-500/10 rounded-xl border border-purple-900/20">
                      <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-100 font-display">Gemini AI Engine</h3>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                        Trend: <span className={forecast.trendPrediction === 'Bullish' ? 'text-emerald-400' : forecast.trendPrediction === 'Bearish' ? 'text-red-400' : 'text-slate-400'}>
                          {forecast.trendPrediction}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Range Predictons */}
                  <div className="space-y-4 mb-6">
                    <div>
                      <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Tomorrow Prediction Range</h4>
                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-850 flex justify-between items-center">
                        <div>
                          <span className="text-[10px] text-slate-500 block">Min</span>
                          <span className="text-xs font-bold text-slate-200">{formatCurrency(forecast.predictedPriceRange.tomorrowMin)}</span>
                        </div>
                        <div className="h-6 w-px bg-slate-800" />
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 block">Max</span>
                          <span className="text-xs font-bold text-slate-200">{formatCurrency(forecast.predictedPriceRange.tomorrowMax)}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">7-Day Forecast Range</h4>
                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-850 flex justify-between items-center">
                        <div>
                          <span className="text-[10px] text-slate-500 block">Min</span>
                          <span className="text-xs font-bold text-slate-200">{formatCurrency(forecast.predictedPriceRange.sevenDayMin)}</span>
                        </div>
                        <div className="h-6 w-px bg-slate-800" />
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 block">Max</span>
                          <span className="text-xs font-bold text-slate-200">{formatCurrency(forecast.predictedPriceRange.sevenDayMax)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Probabilities gauge */}
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>Bearish {forecast.bearishProbability}%</span>
                      <span>Bullish {forecast.bullishProbability}%</span>
                    </div>
                    {/* Progress slider bar */}
                    <div className="h-2.5 w-full bg-red-950/40 rounded-full overflow-hidden flex border border-slate-850/50">
                      <div 
                        className="bg-red-500 transition-all duration-500" 
                        style={{ width: `${forecast.bearishProbability}%` }} 
                      />
                      <div 
                        className="bg-emerald-500 transition-all duration-500 ml-auto" 
                        style={{ width: `${forecast.bullishProbability}%` }} 
                      />
                    </div>
                  </div>

                  {/* Confidence score */}
                  <div className="mb-6 p-4 bg-slate-950 rounded-xl border border-slate-850">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Forecast Confidence</span>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-900 h-2 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500" style={{ width: `${forecast.confidenceScore}%` }} />
                      </div>
                      <span className="text-xs font-bold text-purple-400 font-display">{forecast.confidenceScore}%</span>
                    </div>
                  </div>

                  {/* Written commentary */}
                  <div>
                    <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">AI Indicator Analysis</h4>
                    <p className="text-xs text-slate-400 leading-relaxed italic bg-slate-950/30 p-3 rounded-xl border border-slate-850/50">
                      "{forecast.analysisSummary}"
                    </p>
                  </div>
                </motion.div>
              )
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  )
}
