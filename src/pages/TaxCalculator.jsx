import React, { useState } from 'react'
import { Receipt, IndianRupee, AlertCircle, Download, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'

const TAX_RATES = {
  STCG: 0.15,  // 15% for equity (< 12 months)
  LTCG: 0.10,  // 10% for equity (> 12 months, above ₹1L)
  LTCG_EXEMPTION: 100000,  // ₹1 Lakh LTCG exemption
  SURCHARGE_HIGH: 0.10,    // 10% surcharge if income > ₹50L
  HEALTH_EDU_CESS: 0.04,   // 4% Health and Education Cess
}

const DEFAULT_TRADES = [
  { id: 1, stock: 'RELIANCE', buyPrice: 2400, sellPrice: 2850, qty: 50, buyDate: '2024-01-15', sellDate: '2025-03-10', type: 'equity' },
  { id: 2, stock: 'TCS', buyPrice: 3500, sellPrice: 3820, qty: 30, buyDate: '2025-01-10', sellDate: '2025-11-20', type: 'equity' },
  { id: 3, stock: 'INFY', buyPrice: 1580, sellPrice: 1420, qty: 100, buyDate: '2025-03-01', sellDate: '2025-06-15', type: 'equity' },
]

export default function TaxCalculator() {
  const [trades, setTrades] = useState(DEFAULT_TRADES)
  const [income, setIncome] = useState(1000000)
  const [newTrade, setNewTrade] = useState({ stock: '', buyPrice: '', sellPrice: '', qty: '', buyDate: '', sellDate: '' })

  const computeTrade = (t) => {
    const buyDate = new Date(t.buyDate)
    const sellDate = new Date(t.sellDate)
    const diffDays = Math.floor((sellDate - buyDate) / (1000 * 60 * 60 * 24))
    const isLTCG = diffDays >= 365
    const pnl = (t.sellPrice - t.buyPrice) * t.qty
    const isGain = pnl > 0
    return { ...t, pnl, isLTCG, diffDays, isGain }
  }

  const computed = trades.map(computeTrade)

  const stcgGains = computed.filter(t => !t.isLTCG && t.isGain).reduce((s, t) => s + t.pnl, 0)
  const ltcgGains = computed.filter(t => t.isLTCG && t.isGain).reduce((s, t) => s + t.pnl, 0)
  const losses = computed.filter(t => !t.isGain).reduce((s, t) => s + t.pnl, 0)

  const taxableSTCG = Math.max(0, stcgGains)
  const taxableLTCG = Math.max(0, ltcgGains - TAX_RATES.LTCG_EXEMPTION)

  const stcgTax = taxableSTCG * TAX_RATES.STCG
  const ltcgTax = taxableLTCG * TAX_RATES.LTCG

  const totalTax = stcgTax + ltcgTax
  const cess = totalTax * TAX_RATES.HEALTH_EDU_CESS
  const surcharge = income > 5000000 ? totalTax * TAX_RATES.SURCHARGE_HIGH : 0
  const netTax = totalTax + cess + surcharge

  const formatCur = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v)

  const addTrade = () => {
    if (!newTrade.stock || !newTrade.buyPrice || !newTrade.sellPrice || !newTrade.qty || !newTrade.buyDate || !newTrade.sellDate) return
    setTrades([...trades, { ...newTrade, id: Date.now(), buyPrice: Number(newTrade.buyPrice), sellPrice: Number(newTrade.sellPrice), qty: Number(newTrade.qty), type: 'equity' }])
    setNewTrade({ stock: '', buyPrice: '', sellPrice: '', qty: '', buyDate: '', sellDate: '' })
  }

  const removeTrade = (id) => setTrades(trades.filter(t => t.id !== id))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight font-display flex items-center gap-2">
          <Receipt className="w-8 h-8 text-amber-400" /> Capital Gains Tax Calculator
        </h1>
        <p className="text-xs text-slate-400 mt-1">Calculate STCG (15%) and LTCG (10%) taxes on your equity trades for FY 2025-26.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl">
        <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
        <p className="text-xs text-amber-200/80">Rates: STCG 15% | LTCG 10% (above ₹1L exemption) | 4% Health & Education Cess | Losses can be carried forward 8 years.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tax Summary */}
        <div className="glass-panel p-5 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tax Summary</h3>

          <div>
            <p className="text-[10px] text-slate-500 mb-1">Other Annual Income (for surcharge)</p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">₹</span>
              <input type="number" value={income} onChange={e => setIncome(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-7 pr-3 py-2.5 text-sm font-bold text-slate-100 outline-none focus:border-blue-500/50 transition-colors" />
            </div>
          </div>

          {[
            { label: 'Short-term Gains', value: stcgGains, color: 'text-blue-400' },
            { label: 'Long-term Gains', value: ltcgGains, color: 'text-emerald-400' },
            { label: 'LTCG Exemption', value: -Math.min(ltcgGains, TAX_RATES.LTCG_EXEMPTION), color: 'text-slate-400' },
            { label: 'Capital Losses', value: losses, color: 'text-red-400' },
          ].map(item => (
            <div key={item.label} className="flex justify-between items-center border-b border-slate-850 pb-2">
              <span className="text-xs text-slate-400">{item.label}</span>
              <span className={`text-xs font-bold font-display ${item.color}`}>{formatCur(item.value)}</span>
            </div>
          ))}

          <div className="border-t border-slate-700 pt-3 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">STCG Tax (15%)</span>
              <span className="font-bold text-slate-200 font-display">{formatCur(stcgTax)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">LTCG Tax (10%)</span>
              <span className="font-bold text-slate-200 font-display">{formatCur(ltcgTax)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Health & Edu Cess (4%)</span>
              <span className="font-bold text-slate-200 font-display">{formatCur(cess)}</span>
            </div>
            {surcharge > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Surcharge (10%)</span>
                <span className="font-bold text-amber-400 font-display">{formatCur(surcharge)}</span>
              </div>
            )}
          </div>

          <div className="p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl">
            <p className="text-[10px] text-amber-400/70 font-bold uppercase tracking-wider">Total Tax Liability</p>
            <p className="text-2xl font-extrabold font-display text-amber-300 mt-1">{formatCur(netTax)}</p>
            <p className="text-[10px] text-slate-500 mt-1">FY 2025-26 (AY 2026-27)</p>
          </div>
        </div>

        {/* Trade List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Add Trade */}
          <div className="glass-panel p-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Add Trade</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { key: 'stock', placeholder: 'Stock Symbol', type: 'text' },
                { key: 'buyPrice', placeholder: 'Buy Price (₹)', type: 'number' },
                { key: 'sellPrice', placeholder: 'Sell Price (₹)', type: 'number' },
                { key: 'qty', placeholder: 'Quantity', type: 'number' },
                { key: 'buyDate', placeholder: 'Buy Date', type: 'date' },
                { key: 'sellDate', placeholder: 'Sell Date', type: 'date' },
              ].map(field => (
                <input key={field.key} type={field.type} placeholder={field.placeholder}
                  value={newTrade[field.key]}
                  onChange={e => setNewTrade({ ...newTrade, [field.key]: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-blue-500/50 transition-colors placeholder:text-slate-600" />
              ))}
            </div>
            <button onClick={addTrade}
              className="mt-3 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-95">
              + Add Trade
            </button>
          </div>

          {/* Trades Table */}
          <div className="glass-panel overflow-x-auto">
            <table className="w-full text-xs min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-850">
                  {['Stock', 'Buy ₹', 'Sell ₹', 'Qty', 'Days Held', 'Type', 'P&L', 'Est. Tax', ''].map(h => (
                    <th key={h} className="py-3 px-3 text-left text-slate-500 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {computed.map(t => {
                  const taxRate = t.isLTCG ? TAX_RATES.LTCG : TAX_RATES.STCG
                  const tax = t.isGain ? (t.isLTCG ? Math.max(0, t.pnl - TAX_RATES.LTCG_EXEMPTION) : t.pnl) * taxRate : 0
                  return (
                    <tr key={t.id} className="border-b border-slate-850/50 hover:bg-slate-900/20">
                      <td className="py-3 px-3 font-bold text-slate-100 font-display">{t.stock}</td>
                      <td className="py-3 px-3 text-slate-400">₹{t.buyPrice}</td>
                      <td className="py-3 px-3 text-slate-400">₹{t.sellPrice}</td>
                      <td className="py-3 px-3 text-slate-400">{t.qty}</td>
                      <td className="py-3 px-3 text-slate-400">{t.diffDays}d</td>
                      <td className="py-3 px-3">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${t.isLTCG ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                          {t.isLTCG ? 'LTCG' : 'STCG'}
                        </span>
                      </td>
                      <td className={`py-3 px-3 font-bold font-display ${t.isGain ? 'text-emerald-400' : 'text-red-400'}`}>
                        {t.isGain ? '+' : ''}{formatCur(t.pnl)}
                      </td>
                      <td className="py-3 px-3 text-amber-400 font-bold font-display">{formatCur(tax)}</td>
                      <td className="py-3 px-3">
                        <button onClick={() => removeTrade(t.id)} className="text-slate-600 hover:text-red-400 cursor-pointer text-xs transition-colors">×</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
