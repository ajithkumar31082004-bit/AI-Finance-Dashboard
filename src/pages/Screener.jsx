import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Sliders, Filter, Search, RotateCcw, ArrowUpRight, ArrowDownRight } from 'lucide-react'

// Curated robust dataset of screened stocks
const SCREENER_STOCKS = [
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', sector: 'Energy', mcap: 'Large Cap', price: 2450.00, pe: 26.4, volume: 4500000, rsi: 56, dividend: 0.38, changePercent: 1.25 },
  { symbol: 'TCS', name: 'Tata Consultancy Services', sector: 'IT', mcap: 'Large Cap', price: 3820.00, pe: 30.1, volume: 1800000, rsi: 48, dividend: 1.20, changePercent: -0.45 },
  { symbol: 'INFY', name: 'Infosys Ltd', sector: 'IT', mcap: 'Large Cap', price: 1480.00, pe: 24.8, volume: 3200000, rsi: 65, dividend: 2.30, changePercent: 2.10 },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', sector: 'Banking', mcap: 'Large Cap', price: 1610.00, pe: 18.2, volume: 6200000, rsi: 52, dividend: 1.18, changePercent: 0.85 },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', sector: 'Banking', mcap: 'Large Cap', price: 1120.00, pe: 17.5, volume: 4100000, rsi: 42, dividend: 0.80, changePercent: -1.30 },
  { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd', sector: 'Auto', mcap: 'Large Cap', price: 960.00, pe: 15.6, volume: 5500000, rsi: 68, dividend: 0.60, changePercent: 3.40 },
  { symbol: 'ITC', name: 'ITC Ltd', sector: 'FMCG', mcap: 'Large Cap', price: 430.00, pe: 28.2, volume: 2900000, rsi: 58, dividend: 3.65, changePercent: 0.15 },
  { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical', sector: 'Pharma', mcap: 'Large Cap', price: 1540.00, pe: 34.5, volume: 1200000, rsi: 44, dividend: 0.75, changePercent: -0.65 },
  
  // Mid Cap Tickers
  { symbol: 'ZOMATO', name: 'Zomato Ltd', sector: 'IT', mcap: 'Mid Cap', price: 185.00, pe: 125.0, volume: 22000000, rsi: 72, dividend: 0.00, changePercent: 4.80 },
  { symbol: 'FEDERALBNK', name: 'Federal Bank Ltd', sector: 'Banking', mcap: 'Mid Cap', price: 165.00, pe: 10.4, volume: 8900000, rsi: 49, dividend: 1.80, changePercent: 0.40 },
  { symbol: 'TATACHEM', name: 'Tata Chemicals Ltd', sector: 'Energy', mcap: 'Mid Cap', price: 1080.00, pe: 22.1, volume: 1400000, rsi: 35, dividend: 1.40, changePercent: -2.10 },
  { symbol: 'BATAINDIA', name: 'Bata India Ltd', sector: 'FMCG', mcap: 'Mid Cap', price: 1350.00, pe: 45.3, volume: 650000, rsi: 38, dividend: 2.10, changePercent: -0.90 },
  { symbol: 'GLENMARK', name: 'Glenmark Pharma', sector: 'Pharma', mcap: 'Mid Cap', price: 1020.00, pe: 28.9, volume: 1500000, rsi: 61, dividend: 0.25, changePercent: 1.65 },
  { symbol: 'MRF', name: 'MRF Ltd', sector: 'Auto', mcap: 'Large Cap', price: 125000.00, pe: 52.4, volume: 45000, rsi: 50, dividend: 0.12, changePercent: -0.30 },

  // Small Cap Tickers
  { symbol: 'SUBEX', name: 'Subex Ltd', sector: 'IT', mcap: 'Small Cap', price: 35.00, pe: 0.0, volume: 1500000, rsi: 32, dividend: 0.00, changePercent: -3.20 },
  { symbol: 'SOUTHBANK', name: 'South Indian Bank', sector: 'Banking', mcap: 'Small Cap', price: 28.50, pe: 6.8, volume: 14500000, rsi: 54, dividend: 1.05, changePercent: 1.50 },
  { symbol: 'WOCKPHARMA', name: 'Wockhardt Ltd', sector: 'Pharma', mcap: 'Small Cap', price: 540.00, pe: 0.0, volume: 1100000, rsi: 78, dividend: 0.00, changePercent: 6.20 },
  { symbol: 'FORCEGEOT', name: 'Force Motors Ltd', sector: 'Auto', mcap: 'Small Cap', price: 8800.00, pe: 24.5, volume: 150000, rsi: 53, dividend: 0.40, changePercent: 0.80 }
]

export default function Screener() {
  // Filter settings
  const [search, setSearch] = useState('')
  const [sector, setSector] = useState('All')
  const [mcap, setMcap] = useState('All')
  const [maxPE, setMaxPE] = useState(100)
  const [minVolume, setMinVolume] = useState(0)
  const [minRSI, setMinRSI] = useState(0)
  const [maxRSI, setMaxRSI] = useState(100)
  const [minDividend, setMinDividend] = useState(0)
  const [maxPrice, setMaxPrice] = useState(10000) // Lower default for easy screening, MRF will be filtered out unless expanded

  const [filteredStocks, setFilteredStocks] = useState(SCREENER_STOCKS)

  const handleResetFilters = () => {
    setSearch('')
    setSector('All')
    setMcap('All')
    setMaxPE(100)
    setMinVolume(0)
    setMinRSI(0)
    setMaxRSI(100)
    setMinDividend(0)
    setMaxPrice(10000)
  }

  // Filter logic trigger
  useEffect(() => {
    const filtered = SCREENER_STOCKS.filter((stock) => {
      // 1. Search text
      if (search && !stock.symbol.toLowerCase().includes(search.toLowerCase()) && !stock.name.toLowerCase().includes(search.toLowerCase())) {
        return false
      }
      // 2. Sector
      if (sector !== 'All' && stock.sector !== sector) {
        return false
      }
      // 3. Market Cap
      if (mcap !== 'All' && stock.mcap !== mcap) {
        return false
      }
      // 4. Max PE
      if (maxPE < 100 && (stock.pe === 0 || stock.pe > maxPE)) {
        return false
      }
      // 5. Min Volume
      if (stock.volume < minVolume) {
        return false
      }
      // 6. RSI range
      if (stock.rsi < minRSI || stock.rsi > maxRSI) {
        return false
      }
      // 7. Dividend
      if (stock.dividend < minDividend) {
        return false
      }
      // 8. Max Price (unless it's set to very high range)
      if (stock.price > maxPrice) {
        return false
      }

      return true
    })

    setFilteredStocks(filtered)
  }, [search, sector, mcap, maxPE, minVolume, minRSI, maxRSI, minDividend, maxPrice])

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(val || 0)
  }

  const formatVolume = (vol) => {
    if (vol >= 10000000) return `${(vol / 10000000).toFixed(2)} Cr`
    if (vol >= 100000) return `${(vol / 100000).toFixed(2)} L`
    return vol.toLocaleString()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight font-display flex items-center gap-2">
          <Sliders className="w-8 h-8 text-blue-400" /> Advanced Stock Screener
        </h1>
        <p className="text-xs text-slate-400 mt-1">Combine multiple criteria to screen Indian and global market sectors.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Filter Pane */}
        <div className="glass-panel p-5 space-y-5 h-fit">
          <div className="flex items-center justify-between border-b border-slate-850 pb-3">
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-blue-400" /> Filter Criteria
            </h3>
            <button
              onClick={handleResetFilters}
              className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-0.5 cursor-pointer font-bold"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search symbol or name..."
              className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-xs"
            />
          </div>

          {/* Sector */}
          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Sector</label>
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="w-full p-2 bg-slate-950 border border-slate-850 rounded-lg text-xs"
            >
              <option value="All">All Sectors</option>
              <option value="Banking">Banking</option>
              <option value="IT">IT (Tech)</option>
              <option value="FMCG">FMCG</option>
              <option value="Energy">Energy</option>
              <option value="Pharma">Pharma</option>
              <option value="Auto">Auto</option>
            </select>
          </div>

          {/* Market Cap Class */}
          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Market Cap</label>
            <select
              value={mcap}
              onChange={(e) => setMcap(e.target.value)}
              className="w-full p-2 bg-slate-950 border border-slate-850 rounded-lg text-xs"
            >
              <option value="All">All Caps</option>
              <option value="Large Cap">Large Cap</option>
              <option value="Mid Cap">Mid Cap</option>
              <option value="Small Cap">Small Cap</option>
            </select>
          </div>

          {/* PE Ratio Slider */}
          <div>
            <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              <span>Max PE Ratio</span>
              <span className="text-blue-400">{maxPE === 100 ? 'Any' : `< ${maxPE}`}</span>
            </div>
            <input
              type="range"
              min="5"
              max="100"
              value={maxPE}
              onChange={(e) => setMaxPE(parseInt(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>

          {/* Min volume selector */}
          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Min Volume (Daily)</label>
            <select
              value={minVolume}
              onChange={(e) => setMinVolume(parseInt(e.target.value))}
              className="w-full p-2 bg-slate-950 border border-slate-850 rounded-lg text-xs"
            >
              <option value="0">Any Volume</option>
              <option value="100000">📊 &gt; 1 Lakh</option>
              <option value="1000000">📊 &gt; 10 Lakhs (1M)</option>
              <option value="5000000">📊 &gt; 50 Lakhs (5M)</option>
            </select>
          </div>

          {/* RSI Interval Sliders */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Min RSI</label>
              <input
                type="number"
                min="0"
                max="100"
                value={minRSI}
                onChange={(e) => setMinRSI(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full p-2 bg-slate-950 border border-slate-850 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Max RSI</label>
              <input
                type="number"
                min="0"
                max="100"
                value={maxRSI}
                onChange={(e) => setMaxRSI(Math.min(100, parseInt(e.target.value) || 100))}
                className="w-full p-2 bg-slate-950 border border-slate-850 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Min Dividend */}
          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Min Dividend Yield (%)</label>
            <select
              value={minDividend}
              onChange={(e) => setMinDividend(parseFloat(e.target.value))}
              className="w-full p-2 bg-slate-950 border border-slate-850 rounded-lg text-xs"
            >
              <option value="0">Any Yield</option>
              <option value="1">&gt; 1.0%</option>
              <option value="2">&gt; 2.0%</option>
              <option value="3">&gt; 3.0%</option>
            </select>
          </div>

          {/* Max Price limit */}
          <div>
            <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              <span>Max Share Price</span>
              <span className="text-blue-400">{formatCurrency(maxPrice)}</span>
            </div>
            <input
              type="range"
              min="50"
              max="10000"
              step="50"
              value={maxPrice}
              onChange={(e) => setMaxPrice(parseInt(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>
        </div>

        {/* Right Output Table */}
        <div className="lg:col-span-3 space-y-4">
          <div className="glass-panel p-5 bg-gradient-to-tr from-slate-900/40 to-slate-950/20">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                Matching Assets ({filteredStocks.length})
              </h3>
            </div>

            {filteredStocks.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-slate-850 rounded-xl">
                <Search className="w-8 h-8 text-slate-650 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No stocks match your active criteria combination.</p>
                <button
                  onClick={handleResetFilters}
                  className="mt-3 text-[10px] bg-slate-900 hover:bg-slate-800 text-blue-400 border border-slate-800 rounded-lg px-4 py-2 font-bold cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-850 text-slate-450 pb-2">
                      <th className="py-2">Symbol</th>
                      <th className="py-2">Sector</th>
                      <th className="py-2">Cap</th>
                      <th className="py-2">Price</th>
                      <th className="py-2">PE</th>
                      <th className="py-2 text-right">RSI (14)</th>
                      <th className="py-2 text-right">Div Yield</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStocks.map((stock) => (
                      <tr key={stock.symbol} className="border-b border-slate-850/60 hover:bg-slate-900/10">
                        <td className="py-3 font-semibold text-slate-100">
                          <Link to={`/forecast?symbol=${stock.symbol}`} className="hover:text-blue-400 flex flex-col font-display">
                            <span>{stock.symbol}</span>
                            <span className="text-[9px] text-slate-500 font-normal font-sans">{stock.name}</span>
                          </Link>
                        </td>
                        <td className="py-3 text-slate-400">{stock.sector}</td>
                        <td className="py-3 text-slate-350">{stock.mcap}</td>
                        <td className="py-3 text-slate-200 font-bold">
                          {formatCurrency(stock.price)}
                          <span className={`block text-[9px] font-medium flex items-center gap-0.5 mt-0.5 ${
                            stock.changePercent >= 0 ? 'text-emerald-450' : 'text-red-450'
                          }`}>
                            {stock.changePercent >= 0 ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                            {Math.abs(stock.changePercent).toFixed(2)}%
                          </span>
                        </td>
                        <td className="py-3 text-slate-400">{stock.pe === 0 ? 'N/A' : stock.pe}</td>
                        <td className="py-3 text-right">
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[9px] ${
                            stock.rsi >= 70 ? 'bg-red-500/10 text-red-450 border border-red-500/15' : 
                            stock.rsi <= 30 ? 'bg-emerald-500/10 text-emerald-455 border border-emerald-500/15' : 
                            'bg-slate-950 text-slate-400 border border-slate-850'
                          }`}>
                            {stock.rsi}
                          </span>
                        </td>
                        <td className="py-3 text-right text-slate-400 font-semibold">{stock.dividend > 0 ? `${stock.dividend}%` : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
