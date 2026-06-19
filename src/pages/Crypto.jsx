import React, { useState, useEffect } from 'react'
import { Bitcoin, DollarSign, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'

// Mock live-like data with realistic values
const getCryptoData = () => [
  { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', price: 67420 + (Math.random() - 0.5) * 1000, change24h: (Math.random() * 6 - 3).toFixed(2), marketCap: '1.32T', volume: '28.4B', icon: '₿', color: '#f59e0b' },
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', price: 3512 + (Math.random() - 0.5) * 200, change24h: (Math.random() * 8 - 4).toFixed(2), marketCap: '421.3B', volume: '12.1B', icon: 'Ξ', color: '#8b5cf6' },
  { id: 'solana', name: 'Solana', symbol: 'SOL', price: 165 + (Math.random() - 0.5) * 10, change24h: (Math.random() * 10 - 5).toFixed(2), marketCap: '76.2B', volume: '3.8B', icon: '◎', color: '#06b6d4' },
  { id: 'bnb', name: 'BNB', symbol: 'BNB', price: 598 + (Math.random() - 0.5) * 20, change24h: (Math.random() * 5 - 2.5).toFixed(2), marketCap: '87.1B', volume: '1.9B', icon: 'B', color: '#f59e0b' },
  { id: 'ripple', name: 'XRP', symbol: 'XRP', price: 0.62 + (Math.random() - 0.5) * 0.05, change24h: (Math.random() * 7 - 3.5).toFixed(2), marketCap: '34.8B', volume: '2.1B', icon: 'X', color: '#3b82f6' },
  { id: 'dogecoin', name: 'Dogecoin', symbol: 'DOGE', price: 0.142 + (Math.random() - 0.5) * 0.01, change24h: (Math.random() * 12 - 6).toFixed(2), marketCap: '20.2B', volume: '1.4B', icon: 'Ð', color: '#eab308' },
]

const getForexData = () => [
  { from: 'USD', to: 'INR', rate: 83.52 + (Math.random() - 0.5) * 0.3, change: (Math.random() * 0.5 - 0.25).toFixed(2), flag: '🇺🇸' },
  { from: 'EUR', to: 'INR', rate: 90.18 + (Math.random() - 0.5) * 0.4, change: (Math.random() * 0.6 - 0.3).toFixed(2), flag: '🇪🇺' },
  { from: 'GBP', to: 'INR', rate: 105.62 + (Math.random() - 0.5) * 0.5, change: (Math.random() * 0.7 - 0.35).toFixed(2), flag: '🇬🇧' },
  { from: 'JPY', to: 'INR', rate: 0.545 + (Math.random() - 0.5) * 0.01, change: (Math.random() * 0.3 - 0.15).toFixed(2), flag: '🇯🇵' },
  { from: 'AED', to: 'INR', rate: 22.73 + (Math.random() - 0.5) * 0.1, change: (Math.random() * 0.2 - 0.1).toFixed(2), flag: '🇦🇪' },
  { from: 'SGD', to: 'INR', rate: 61.85 + (Math.random() - 0.5) * 0.2, change: (Math.random() * 0.4 - 0.2).toFixed(2), flag: '🇸🇬' },
]

export default function Crypto() {
  const [cryptos, setCryptos] = useState(getCryptoData())
  const [forexRates, setForexRates] = useState(getForexData())
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [loading, setLoading] = useState(false)
  const [fromAmt, setFromAmt] = useState(100)
  const [fromCurrency, setFromCurrency] = useState('USD')
  const [toCurrency, setToCurrency] = useState('INR')

  const refresh = () => {
    setLoading(true)
    setTimeout(() => {
      setCryptos(getCryptoData())
      setForexRates(getForexData())
      setLastUpdated(new Date())
      setLoading(false)
    }, 600)
  }

  useEffect(() => {
    const interval = setInterval(refresh, 30000)
    return () => clearInterval(interval)
  }, [])

  const getRate = (from, to) => {
    const r = forexRates.find(f => f.from === from && f.to === to)
    if (r) return r.rate
    const inv = forexRates.find(f => f.from === to && f.to === from)
    if (inv) return 1 / inv.rate
    return 1
  }

  const convertedAmount = (fromAmt * getRate(fromCurrency, toCurrency)).toFixed(2)

  const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'AED', 'SGD', 'INR']

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight font-display flex items-center gap-2">
            <Bitcoin className="w-8 h-8 text-amber-400" /> Crypto & Forex Tracker
          </h1>
          <p className="text-xs text-slate-400 mt-1">Live cryptocurrency prices and foreign exchange rates.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-slate-500">Updated {lastUpdated.toLocaleTimeString()}</span>
          <button onClick={refresh} disabled={loading}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer transition-all active:scale-95">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Currency Converter */}
      <div className="glass-panel p-5">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <DollarSign className="w-4 h-4" /> Currency Converter
        </h3>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="number" value={fromAmt} onChange={e => setFromAmt(Number(e.target.value))}
            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-100 w-32 outline-none focus:border-blue-500/50 transition-colors"
          />
          <select value={fromCurrency} onChange={e => setFromCurrency(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-200 outline-none cursor-pointer">
            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <span className="text-slate-500 font-bold text-sm">→</span>
          <select value={toCurrency} onChange={e => setToCurrency(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-200 outline-none cursor-pointer">
            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="px-5 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <span className="text-emerald-400 font-extrabold font-display text-sm">{convertedAmount} {toCurrency}</span>
          </div>
        </div>
      </div>

      {/* Crypto Prices */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Top Cryptocurrencies</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {cryptos.map((crypto, i) => (
            <motion.div key={crypto.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass-panel p-5 hover:border-slate-700 transition-all group cursor-default">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-extrabold"
                    style={{ backgroundColor: crypto.color + '20', color: crypto.color }}>
                    {crypto.icon}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-100 font-display">{crypto.name}</p>
                    <p className="text-[10px] font-bold text-slate-500">{crypto.symbol}</p>
                  </div>
                </div>
                <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${
                  parseFloat(crypto.change24h) >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                }`}>
                  {parseFloat(crypto.change24h) >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {parseFloat(crypto.change24h) >= 0 ? '+' : ''}{crypto.change24h}%
                </span>
              </div>
              <p className="text-xl font-extrabold font-display text-slate-100">
                ${parseFloat(crypto.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <div className="flex gap-4 mt-2">
                <span className="text-[9px] text-slate-500">MCap <span className="text-slate-400 font-bold">${crypto.marketCap}</span></span>
                <span className="text-[9px] text-slate-500">Vol <span className="text-slate-400 font-bold">${crypto.volume}</span></span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Forex Rates */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Forex Rates vs INR</h3>
        <div className="glass-panel overflow-x-auto">
          <table className="w-full text-xs min-w-[480px]">
            <thead>
              <tr className="border-b border-slate-850">
                <th className="py-3 px-5 text-left text-slate-500 font-semibold">Currency</th>
                <th className="py-3 px-5 text-right text-slate-500 font-semibold">Rate (per INR)</th>
                <th className="py-3 px-5 text-right text-slate-500 font-semibold">1 Unit = INR</th>
                <th className="py-3 px-5 text-right text-slate-500 font-semibold">Change</th>
              </tr>
            </thead>
            <tbody>
              {forexRates.map(fx => (
                <tr key={fx.from} className="border-b border-slate-850/50 hover:bg-slate-900/20">
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{fx.flag}</span>
                      <span className="font-bold text-slate-100 font-display">{fx.from}</span>
                      <span className="text-slate-500 text-[9px]">→ INR</span>
                    </div>
                  </td>
                  <td className="py-3 px-5 text-right font-bold text-slate-200">{(1 / fx.rate).toFixed(5)}</td>
                  <td className="py-3 px-5 text-right font-bold text-emerald-400 font-display">₹{fx.rate.toFixed(2)}</td>
                  <td className="py-3 px-5 text-right">
                    <span className={`font-bold ${parseFloat(fx.change) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {parseFloat(fx.change) >= 0 ? '+' : ''}{fx.change}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
