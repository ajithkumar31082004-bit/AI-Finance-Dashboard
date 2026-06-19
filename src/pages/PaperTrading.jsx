import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useAlerts } from '../context/AlertContext'
import { supabase } from '../services/supabase'
import { TOP_TICKERS, getStockQuote } from '../services/finnhub'
import { Coins, History, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Award, Plus, Minus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function PaperTrading() {
  const { user, profile, updateProfile, refreshProfile } = useAuth()
  const { triggerToast, checkPriceAlerts } = useAlerts()

  // Trade form states
  const [selectedSymbol, setSelectedSymbol] = useState('RELIANCE')
  const [livePrice, setLivePrice] = useState(0)
  const [loadingPrice, setLoadingPrice] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [tradeType, setTradeType] = useState('buy') // 'buy' or 'sell'
  const [executing, setExecuting] = useState(false)

  // Portfolio & History states
  const [portfolio, setPortfolio] = useState([])
  const [tradesHistory, setTradesHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  // Fetch live price for form selection
  const fetchLivePrice = async (symbol) => {
    setLoadingPrice(true)
    try {
      const quote = await getStockQuote(symbol)
      setLivePrice(quote.price)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingPrice(false)
    }
  }

  // Fetch history & holdings
  const fetchData = async () => {
    if (!user) return
    setLoadingHistory(true)
    try {
      // 1. Fetch trades history
      const { data: trades, error: tradesErr } = await supabase
        .from('paper_trades')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (tradesErr) throw tradesErr
      setTradesHistory(trades || [])

      // 2. Fetch current holdings
      const { data: holdings, error: holdErr } = await supabase
        .from('portfolio')
        .select('*')
        .eq('user_id', user.id)

      if (holdErr) throw holdErr
      setPortfolio(holdings || [])
    } catch (err) {
      console.error(err)
      triggerToast('Query Error', 'Failed to retrieve trade logs.', 'error')
    } finally {
      setLoadingHistory(false)
    }
  }

  useEffect(() => {
    fetchLivePrice(selectedSymbol)
  }, [selectedSymbol])

  useEffect(() => {
    fetchData()
  }, [user])

  // Execute Trade Order
  const handleExecuteTrade = async (e) => {
    e.preventDefault()
    if (!user || !profile) return
    if (quantity <= 0) {
      triggerToast('Invalid Quantity', 'Please enter a valid amount of shares.', 'error')
      return
    }

    setExecuting(true)
    const cost = parseFloat((quantity * livePrice).toFixed(2))

    try {
      if (tradeType === 'buy') {
        // Validation: Sufficient funds
        if (profile.paper_balance < cost) {
          triggerToast('Insufficient Funds', `You need ${formatCurrency(cost)} but only have ${formatCurrency(profile.paper_balance)}.`, 'error')
          setExecuting(false)
          return
        }

        // 1. Update wallet balance
        const newBalance = parseFloat((profile.paper_balance - cost).toFixed(2))
        await updateProfile({ paper_balance: newBalance })

        // 2. Add trade log
        await supabase.from('paper_trades').insert({
          user_id: user.id,
          stock_symbol: selectedSymbol.toUpperCase(),
          quantity,
          buy_sell: 'buy',
          price: livePrice
        })

        // 3. Update holdings portfolio table
        const existing = portfolio.find(p => p.stock_symbol.toUpperCase() === selectedSymbol.toUpperCase())
        if (existing) {
          const newQty = parseFloat(existing.quantity) + parseFloat(quantity)
          const newAvgPrice = parseFloat(((existing.quantity * existing.buy_price + cost) / newQty).toFixed(2))
          await supabase
            .from('portfolio')
            .update({ quantity: newQty, buy_price: newAvgPrice, current_price: livePrice })
            .eq('id', existing.id)
        } else {
          await supabase.from('portfolio').insert({
            user_id: user.id,
            stock_symbol: selectedSymbol.toUpperCase(),
            quantity,
            buy_price: livePrice,
            current_price: livePrice
          })
        }

        triggerToast('Order Executed', `Bought ${quantity} shares of ${selectedSymbol} at ${formatCurrency(livePrice)}`, 'success')

      } else {
        // Validation: Selling what we actually hold
        const existing = portfolio.find(p => p.stock_symbol.toUpperCase() === selectedSymbol.toUpperCase())
        if (!existing || parseFloat(existing.quantity) < quantity) {
          triggerToast('Holdings Limit Exceeded', `You only hold ${existing?.quantity || 0} shares of ${selectedSymbol}.`, 'error')
          setExecuting(false)
          return
        }

        // 1. Update wallet balance
        const revenue = parseFloat((quantity * livePrice).toFixed(2))
        const newBalance = parseFloat((profile.paper_balance + revenue).toFixed(2))
        await updateProfile({ paper_balance: newBalance })

        // 2. Add trade log
        await supabase.from('paper_trades').insert({
          user_id: user.id,
          stock_symbol: selectedSymbol.toUpperCase(),
          quantity,
          buy_sell: 'sell',
          price: livePrice
        })

        // 3. Update holdings portfolio table
        const remainingQty = parseFloat(existing.quantity) - parseFloat(quantity)
        if (remainingQty <= 0) {
          await supabase
            .from('portfolio')
            .delete()
            .eq('id', existing.id)
        } else {
          await supabase
            .from('portfolio')
            .update({ quantity: remainingQty, current_price: livePrice })
            .eq('id', existing.id)
        }

        triggerToast('Order Executed', `Sold ${quantity} shares of ${selectedSymbol} at ${formatCurrency(livePrice)}`, 'success')
      }

      // Re-fetch records to update tables and numbers
      await fetchData()
      refreshProfile()
    } catch (err) {
      console.error(err)
      triggerToast('Trade Failed', 'Database execution issue.', 'error')
    } finally {
      setExecuting(false)
    }
  }

  // Format currencies
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(val || 0)
  }

  // Leaderboard mock players
  const leaderboardPlayers = [
    { rank: 1, name: 'Warren Buffett', netWorth: 185000.00, return: '+85.0%', active: true },
    { rank: 2, name: 'Rakesh Jhunjhunwala', netWorth: 154000.00, return: '+54.0%', active: true },
    { rank: 3, name: profile?.name || 'Apex Trader (You)', netWorth: profile ? (profile.paper_balance + portfolio.reduce((a, b) => a + (b.quantity * b.current_price), 0)) : 100000.00, return: profile ? `${(((profile.paper_balance + portfolio.reduce((a, b) => a + (b.quantity * b.current_price), 0)) - 100000) / 1000).toFixed(1)}%` : '0.0%', isUser: true },
    { rank: 4, name: 'Nancy Pelosi', netWorth: 132000.00, return: '+32.0%', active: true },
    { rank: 5, name: 'Cathie Wood', netWorth: 88000.00, return: '-12.0%', active: false },
  ].sort((a, b) => b.netWorth - a.netWorth).map((p, idx) => ({ ...p, rank: idx + 1 }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight font-display flex items-center gap-2">
          <Coins className="w-8 h-8 text-emerald-400" /> Paper Trading Simulator
        </h1>
        <p className="text-xs text-slate-400 mt-1">Virtual stock trading station using real-time market data feed. Risk-free testing.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Columns (Order Desk and Wallet Status) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Order desk Form */}
          <div className="glass-panel p-5">
            <h3 className="text-sm font-bold text-slate-100 font-display mb-4">
              Simulator Execution Desk
            </h3>

            <form onSubmit={handleExecuteTrade} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Asset Selection */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Select Stock Asset
                </label>
                <select
                  value={selectedSymbol}
                  onChange={(e) => setSelectedSymbol(e.target.value)}
                  className="w-full p-3 rounded-lg glass-input text-xs font-semibold outline-none"
                >
                  {TOP_TICKERS.map(t => (
                    <option key={t.symbol} value={t.symbol}>
                      {t.symbol} - {t.name} (₹{t.price.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Trade Type Selection */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Transaction Type
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-lg border border-slate-850">
                  <button
                    type="button"
                    onClick={() => setTradeType('buy')}
                    className={`py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      tradeType === 'buy'
                        ? 'bg-emerald-600/10 text-emerald-450 border border-emerald-900/20'
                        : 'text-slate-500 hover:text-slate-350'
                    }`}
                  >
                    Buy (Long)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTradeType('sell')}
                    className={`py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      tradeType === 'sell'
                        ? 'bg-red-650/15 text-red-450 border border-red-900/15'
                        : 'text-slate-500 hover:text-slate-350'
                    }`}
                  >
                    Sell (Short)
                  </button>
                </div>
              </div>

              {/* Quantity input */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Quantity (Shares)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full p-3 rounded-lg glass-input text-xs font-semibold"
                  />
                  <div className="absolute right-2 top-2.5 flex gap-1">
                    <button
                      type="button"
                      onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                      className="p-1 bg-slate-900 border border-slate-800 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuantity(prev => prev + 1)}
                      className="p-1 bg-slate-900 border border-slate-800 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Total Calculation */}
              <div className="flex flex-col justify-end bg-slate-950/40 p-3 rounded-lg border border-slate-900">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Execution Price:</span>
                  <span className="font-bold text-slate-350">
                    {loadingPrice ? '...' : formatCurrency(livePrice)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs mt-1 border-t border-slate-900 pt-1.5">
                  <span className="text-slate-400 font-semibold">Total Cost:</span>
                  <span className="text-sm font-extrabold text-blue-400 font-display">
                    {formatCurrency(quantity * livePrice)}
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={executing}
                className={`md:col-span-2 py-3 rounded-lg text-sm font-bold text-white shadow-lg cursor-pointer transition-all active:scale-[0.98] mt-3 ${
                  tradeType === 'buy'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 shadow-emerald-950/40'
                    : 'bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-450 shadow-red-950/40'
                }`}
              >
                {executing ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                ) : (
                  `Execute ${tradeType.toUpperCase()} Order`
                )}
              </button>
            </form>
          </div>

          {/* Trade History Logs */}
          <div className="glass-panel p-5">
            <h3 className="text-sm font-bold text-slate-100 font-display flex items-center gap-2 mb-4">
              <History className="w-4 h-4 text-purple-400" /> Transaction Audit Log
            </h3>

            {loadingHistory ? (
              <div className="space-y-2 py-6 animate-pulse">
                <div className="h-6 bg-slate-800 rounded w-full" />
                <div className="h-6 bg-slate-800 rounded w-full" />
              </div>
            ) : tradesHistory.length === 0 ? (
              <p className="text-center text-xs text-slate-500 py-10">No simulated trades executed yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-850 text-slate-450 pb-2">
                      <th className="py-2">Date/Time</th>
                      <th className="py-2">Asset</th>
                      <th className="py-2">Type</th>
                      <th className="py-2">Quantity</th>
                      <th className="py-2 text-right">Price</th>
                      <th className="py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tradesHistory.map((trade) => {
                      const total = trade.quantity * trade.price
                      return (
                        <tr key={trade.id} className="border-b border-slate-850/50">
                          <td className="py-3 text-slate-500">
                            {new Date(trade.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </td>
                          <td className="py-3 font-bold text-slate-200 font-display">{trade.stock_symbol}</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded-md font-bold uppercase text-[9px] ${
                              trade.buy_sell === 'buy'
                                ? 'bg-emerald-500/10 text-emerald-450'
                                : 'bg-red-500/10 text-red-450'
                            }`}>
                              {trade.buy_sell}
                            </span>
                          </td>
                          <td className="py-3 text-slate-350">{trade.quantity}</td>
                          <td className="py-3 text-right text-slate-400">{formatCurrency(trade.price)}</td>
                          <td className="py-3 text-right font-bold text-slate-205">{formatCurrency(total)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Wallet Stats and Leaderboard */}
        <div className="space-y-6">
          {/* Wallet summary */}
          {profile && (
            <div className="glass-panel p-5 bg-gradient-to-br from-slate-900 to-emerald-950/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-[100px] pointer-events-none" />
              <Coins className="w-5 h-5 text-emerald-400 mb-3" />
              <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Account Available Liquidity</h4>
              <h2 className="text-xl md:text-2xl font-bold font-display text-emerald-450 mt-1">
                {formatCurrency(profile.paper_balance)}
              </h2>
              <div className="border-t border-slate-850 mt-4 pt-3 flex justify-between items-center text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                <span>Start Balance:</span>
                <span className="text-slate-300">₹1,00,000.00</span>
              </div>
            </div>
          )}

          {/* Simulated Leaderboard */}
          <div className="glass-panel p-5">
            <h3 className="text-sm font-bold text-slate-100 font-display flex items-center gap-2 mb-4">
              <Award className="w-4 h-4 text-amber-400" /> Apex Leaderboard
            </h3>
            
            <div className="space-y-3">
              {leaderboardPlayers.map((player) => (
                <div
                  key={player.name}
                  className={`p-3 rounded-xl border flex items-center justify-between ${
                    player.isUser
                      ? 'bg-blue-600/10 border-blue-500/35 font-bold shadow-md shadow-blue-900/15'
                      : 'bg-slate-900/30 border-slate-850/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-display ${
                      player.rank === 1 ? 'bg-amber-500/20 text-amber-450' : 
                      player.rank === 2 ? 'bg-slate-300/20 text-slate-300' :
                      player.rank === 3 ? 'bg-amber-700/20 text-amber-700' : 'bg-slate-950 text-slate-650'
                    }`}>
                      {player.rank}
                    </span>
                    <div>
                      <span className="text-xs text-slate-200 font-display">{player.name}</span>
                      <span className="block text-[8px] text-slate-500 uppercase font-semibold">Net Worth: {formatCurrency(player.netWorth)}</span>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold flex items-center gap-0.5 ${
                    player.return.startsWith('+') ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {player.return.startsWith('+') ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {player.return}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
