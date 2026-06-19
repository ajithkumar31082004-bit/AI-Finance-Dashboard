import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useAlerts } from '../context/AlertContext'
import { supabase } from '../services/supabase'
import { TOP_TICKERS, getStockQuote } from '../services/finnhub'
import { Star, Search, Plus, Trash2, Bell, AlertCircle, ArrowUpRight, ArrowDownRight, Pin, PinOff } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Watchlist() {
  const { user } = useAuth()
  const { triggerToast, addAlert, deleteAlert, userAlerts } = useAlerts()

  // Watchlist states
  const [watchlist, setWatchlist] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Search and Select additions
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])

  // Pins state (stored locally or added to metadata, let's keep it in localstorage for easy persistence!)
  const [pinned, setPinned] = useState(JSON.parse(localStorage.getItem('pinned_tickers') || '[]'))

  // Alert Modal configs
  const [alertSymbol, setAlertSymbol] = useState('')
  const [alertPrice, setAlertPrice] = useState('')
  const [alertType, setAlertType] = useState('price') // 'price', 'breakout', 'volume'
  const [alertModalOpen, setAlertModalOpen] = useState(false)

  // Fetch watchlist entries from database
  const fetchWatchlist = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('watchlist')
        .select('*')
        .eq('user_id', user.id)

      if (error) throw error

      // Bind quotes for each watchlist entry
      const itemsWithQuotes = await Promise.all(
        (data || []).map(async (w) => {
          const quote = await getStockQuote(w.stock_symbol)
          return {
            ...w,
            price: quote.price,
            changePercent: quote.changePercent
          }
        })
      )

      // Sort pinned to the top
      const sorted = itemsWithQuotes.sort((a, b) => {
        const aPinned = pinned.includes(a.stock_symbol.toUpperCase())
        const bPinned = pinned.includes(b.stock_symbol.toUpperCase())
        if (aPinned && !bPinned) return -1
        if (!aPinned && bPinned) return 1
        return 0
      })

      setWatchlist(sorted)
    } catch (err) {
      console.error(err)
      triggerToast('Watchlist Query Error', 'Failed to retrieve watchlists.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWatchlist()
  }, [user, pinned])

  // Handle local searching of our curated tickers
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    const filtered = TOP_TICKERS.filter((t) => 
      t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setSearchResults(filtered)
  }, [searchQuery])

  // Add stock to watchlist
  const handleAddToWatchlist = async (symbol) => {
    if (!user) return
    // Check duplication
    if (watchlist.some(w => w.stock_symbol.toUpperCase() === symbol.toUpperCase())) {
      triggerToast('Duplicate Watch', 'Stock is already in your Watchlist.', 'warning')
      setSearchQuery('')
      return
    }

    try {
      const { error } = await supabase.from('watchlist').insert({
        user_id: user.id,
        stock_symbol: symbol.toUpperCase()
      })

      if (error) throw error
      triggerToast('Asset Watched', `${symbol} added to watchlist.`, 'success')
      setSearchQuery('')
      fetchWatchlist()
    } catch (err) {
      triggerToast('Error Adding Watch', err.message, 'error')
    }
  }

  // Remove stock from watchlist
  const handleRemoveFromWatchlist = async (id, symbol) => {
    try {
      const { error } = await supabase.from('watchlist').delete().eq('id', id)
      if (error) throw error
      
      triggerToast('Asset Removed', `${symbol} removed from watchlist.`, 'info')
      fetchWatchlist()
    } catch (err) {
      triggerToast('Removal Failed', err.message, 'error')
    }
  }

  // Pin/Unpin a stock
  const handleTogglePin = (symbol) => {
    const sym = symbol.toUpperCase()
    let nextPinned
    if (pinned.includes(sym)) {
      nextPinned = pinned.filter(p => p !== sym)
    } else {
      nextPinned = [...pinned, sym]
    }
    setPinned(nextPinned)
    localStorage.setItem('pinned_tickers', JSON.stringify(nextPinned))
    triggerToast(pinned.includes(sym) ? 'Unpinned' : 'Pinned to Top', `${symbol} ranking priority adjusted.`, 'info')
  }

  // Add Price Alert
  const handleCreateAlertSubmit = async (e) => {
    e.preventDefault()
    if (!alertSymbol || !alertPrice) return

    const { error } = await addAlert(alertSymbol, alertPrice, alertType)
    if (error) {
      triggerToast('Alert Error', error.message, 'error')
    } else {
      triggerToast('Alert Configured', `Real-time notifications active for ${alertSymbol} @ ₹${alertPrice}`, 'success')
      setAlertModalOpen(false)
      setAlertSymbol('')
      setAlertPrice('')
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
            <Star className="w-8 h-8 text-amber-400" /> Smart Watchlist
          </h1>
          <p className="text-xs text-slate-400 mt-1">Pin favorite stock tickers, trace indices fluctuations, and trigger smart price threshold alerts.</p>
        </div>

        {/* Real-time Search Box */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search & Add symbols (e.g. TCS)..."
            className="w-full pl-9 pr-4 p-2.5 rounded-xl glass-input text-xs font-semibold"
          />

          {/* Floating search dropdown container */}
          <AnimatePresence>
            {searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-40 max-h-48 overflow-y-auto"
              >
                {searchResults.map((stock) => (
                  <button
                    key={stock.symbol}
                    onClick={() => handleAddToWatchlist(stock.symbol)}
                    className="w-full text-left p-3 hover:bg-slate-800 flex justify-between items-center text-xs border-b border-slate-850/50 cursor-pointer"
                  >
                    <div>
                      <span className="font-bold text-slate-200 font-display">{stock.symbol}</span>
                      <span className="block text-[10px] text-slate-500">{stock.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-bold">{formatCurrency(stock.price)}</span>
                      <div className="p-1 bg-blue-500/10 rounded text-blue-400">
                        <Plus className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column (Main Watchlist List) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-panel p-5">
            <h3 className="text-sm font-bold text-slate-100 font-display mb-4">Tracked Assets</h3>

            {loading ? (
              <div className="space-y-3 py-6 animate-pulse">
                <div className="h-10 bg-slate-800 rounded-lg w-full" />
                <div className="h-10 bg-slate-800 rounded-lg w-full" />
              </div>
            ) : watchlist.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-slate-850 rounded-xl">
                <Star className="w-8 h-8 text-slate-650 mx-auto mb-2.5" />
                <p className="text-xs text-slate-400">Watchlist is currently empty. Use the search bar above to add assets.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {watchlist.map((item) => {
                  const isPinned = pinned.includes(item.stock_symbol.toUpperCase())
                  
                  return (
                    <div
                      key={item.id}
                      className="p-4 bg-slate-900/20 border border-slate-850 rounded-xl flex items-center justify-between hover:bg-slate-900/40 hover:border-slate-800/80 transition-all duration-200"
                    >
                      {/* Left: Pins + Symbol Details */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleTogglePin(item.stock_symbol)}
                          className="p-1 text-slate-500 hover:text-amber-400 transition-colors cursor-pointer"
                        >
                          {isPinned ? <Pin className="w-4 h-4 text-amber-500 fill-amber-500" /> : <Pin className="w-4 h-4" />}
                        </button>
                        
                        <div>
                          <span className="text-sm font-bold text-slate-100 font-display">{item.stock_symbol}</span>
                          <span className="block text-[10px] text-slate-500">
                            {TOP_TICKERS.find(t => t.symbol.toUpperCase() === item.stock_symbol.toUpperCase())?.name || 'Ticker Detail'}
                          </span>
                        </div>
                      </div>

                      {/* Right: Price + Action triggers */}
                      <div className="flex items-center gap-6">
                        {/* Quotes */}
                        <div className="text-right">
                          <span className="text-sm font-bold text-slate-205">{formatCurrency(item.price)}</span>
                          <span className={`block text-[10px] font-bold flex items-center justify-end gap-0.5 ${
                            item.changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'
                          }`}>
                            {item.changePercent >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {item.changePercent.toFixed(2)}%
                          </span>
                        </div>

                        {/* Alert button */}
                        <button
                          onClick={() => {
                            setAlertSymbol(item.stock_symbol)
                            setAlertPrice(item.price.toString())
                            setAlertModalOpen(true)
                          }}
                          className="p-2 bg-slate-950 border border-slate-850 hover:border-slate-800 text-slate-400 hover:text-amber-400 hover:bg-amber-500/5 rounded-lg cursor-pointer transition-colors"
                          title="Set Price Alert"
                        >
                          <Bell className="w-4 h-4" />
                        </button>

                        {/* Delete button */}
                        <button
                          onClick={() => handleRemoveFromWatchlist(item.id, item.stock_symbol)}
                          className="p-2 bg-slate-950 border border-slate-850 hover:border-slate-800 text-slate-500 hover:text-red-400 hover:bg-red-500/5 rounded-lg cursor-pointer transition-colors"
                          title="Remove stock"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Active alerts triggers */}
        <div className="glass-panel p-5 h-fit">
          <h3 className="text-sm font-bold text-slate-100 font-display mb-4 flex items-center gap-1.5">
            <Bell className="w-4.5 h-4.5 text-amber-500" /> Configured Smart Alerts
          </h3>

          {userAlerts.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-4">No active price triggers configured.</p>
          ) : (
            <div className="space-y-3">
              {userAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-3 bg-slate-950 rounded-xl border border-slate-850 flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-bold text-slate-200 font-display">{alert.stock_symbol}</span>
                    <span className="block text-[8px] text-slate-500 uppercase font-semibold">
                      Trigger: {alert.alert_type} &gt;= {formatCurrency(alert.target_price)}
                    </span>
                  </div>

                  <button
                    onClick={() => deleteAlert(alert.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg cursor-pointer transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ALERT CREATION MODAL OVERLAY */}
      <AnimatePresence>
        {alertModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel w-full max-w-sm p-6 bg-slate-900 shadow-2xl relative"
            >
              <h3 className="text-sm font-bold text-slate-100 font-display mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-500" /> Create Price Alert Trigger
              </h3>

              <form onSubmit={handleCreateAlertSubmit} className="space-y-4">
                <div>
                  <label className="block text-[9px] font-bold text-slate-450 uppercase tracking-wider mb-1.5">Asset symbol</label>
                  <input
                    type="text"
                    disabled
                    value={alertSymbol}
                    className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-850 text-slate-400 text-xs font-bold font-display"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-455 uppercase tracking-wider mb-1.5">Alert Condition Type</label>
                  <select
                    value={alertType}
                    onChange={(e) => setAlertType(e.target.value)}
                    className="w-full p-2.5 rounded-lg glass-input text-xs font-semibold outline-none"
                  >
                    <option value="price">🎯 Price Level Reached</option>
                    <option value="breakout">📈 Technical Breakout Trigger</option>
                    <option value="volume">📊 Heavy Volume Spike</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-450 uppercase tracking-wider mb-1.5">Target price threshold (INR)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={alertPrice}
                    onChange={(e) => setAlertPrice(e.target.value)}
                    placeholder="e.g. 2480"
                    className="w-full p-2.5 rounded-lg glass-input text-xs font-semibold"
                  />
                </div>

                <div className="flex gap-2.5 pt-3">
                  <button
                    type="button"
                    onClick={() => setAlertModalOpen(false)}
                    className="flex-1 py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-400 text-xs font-bold rounded-lg cursor-pointer transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-gradient-to-r from-blue-655 to-emerald-500 hover:from-blue-550 hover:to-emerald-450 text-white text-xs font-bold rounded-lg shadow-lg active:scale-95 transition-all cursor-pointer"
                  >
                    Activate Alert
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
