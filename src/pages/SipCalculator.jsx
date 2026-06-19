import React, { useState, useEffect, useRef } from 'react'
import { createChart } from 'lightweight-charts'
import { Calculator, TrendingUp, IndianRupee, Target } from 'lucide-react'

export default function SipCalculator() {
  const [monthly, setMonthly] = useState(10000)
  const [rate, setRate] = useState(12)
  const [years, setYears] = useState(10)
  const chartRef = useRef(null)
  const chartInstance = useRef(null)

  const totalInvested = monthly * years * 12
  const months = years * 12
  const monthlyRate = rate / 100 / 12
  const corpus = monthly * (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate))
  const gains = corpus - totalInvested
  const gainPercent = ((gains / totalInvested) * 100).toFixed(1)

  // Draw growth curve chart
  useEffect(() => {
    if (!chartRef.current) return
    if (chartInstance.current) { chartInstance.current.remove(); chartInstance.current = null }

    const chart = createChart(chartRef.current, {
      width: chartRef.current.clientWidth,
      height: 240,
      layout: { background: { color: 'transparent' }, textColor: '#94a3b8' },
      grid: { vertLines: { color: 'rgba(255,255,255,0.03)' }, horzLines: { color: 'rgba(255,255,255,0.03)' } },
      timeScale: { borderColor: 'rgba(255,255,255,0.06)' },
      rightPriceScale: { borderColor: 'rgba(255,255,255,0.06)' },
    })
    chartInstance.current = chart

    const investedSeries = chart.addLineSeries({ color: '#94a3b8', lineWidth: 1.5, title: 'Invested' })
    const corpusSeries = chart.addLineSeries({ color: '#10b981', lineWidth: 2, title: 'Corpus' })

    const investedData = []
    const corpusData = []

    for (let m = 1; m <= months; m++) {
      const d = new Date()
      d.setMonth(d.getMonth() + m)
      const dateStr = d.toISOString().split('T')[0]
      const inv = monthly * m
      const corp = monthly * (((Math.pow(1 + monthlyRate, m) - 1) / monthlyRate) * (1 + monthlyRate))
      investedData.push({ time: dateStr, value: parseFloat(inv.toFixed(2)) })
      corpusData.push({ time: dateStr, value: parseFloat(corp.toFixed(2)) })
    }

    investedSeries.setData(investedData)
    corpusSeries.setData(corpusData)

    const handleResize = () => {
      if (chartRef.current && chartInstance.current) {
        chartInstance.current.applyOptions({ width: chartRef.current.clientWidth })
      }
    }
    window.addEventListener('resize', handleResize)
    return () => { window.removeEventListener('resize', handleResize); if (chartInstance.current) chartInstance.current.remove() }
  }, [monthly, rate, years])

  const formatCurrency = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v)

  const PRESETS = [
    { label: 'Starter', monthly: 5000, rate: 10, years: 5 },
    { label: 'Growth', monthly: 10000, rate: 12, years: 10 },
    { label: 'Wealth', monthly: 25000, rate: 14, years: 20 },
    { label: 'Retirement', monthly: 50000, rate: 12, years: 30 },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight font-display flex items-center gap-2">
          <Calculator className="w-8 h-8 text-blue-400" /> SIP / Investment Calculator
        </h1>
        <p className="text-xs text-slate-400 mt-1">Plan your Systematic Investment Plan and visualize projected wealth creation over time.</p>
      </div>

      {/* Preset Scenarios */}
      <div className="flex flex-wrap gap-2">
        {PRESETS.map(p => (
          <button key={p.label}
            onClick={() => { setMonthly(p.monthly); setRate(p.rate); setYears(p.years) }}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-bold text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer">
            {p.label} Plan
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="glass-panel p-6 space-y-6 h-fit">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Investment Parameters</h3>

          {/* Monthly Investment */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-2">
              <span className="text-slate-400">Monthly Investment</span>
              <span className="text-blue-400 font-bold font-display">{formatCurrency(monthly)}</span>
            </div>
            <input type="range" min="500" max="200000" step="500" value={monthly}
              onChange={e => setMonthly(Number(e.target.value))}
              className="w-full accent-blue-500" />
            <div className="flex justify-between text-[9px] text-slate-600 mt-1">
              <span>₹500</span><span>₹2L</span>
            </div>
          </div>

          {/* Expected Return Rate */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-2">
              <span className="text-slate-400">Expected Annual Return</span>
              <span className="text-emerald-400 font-bold font-display">{rate}% p.a.</span>
            </div>
            <input type="range" min="4" max="30" step="0.5" value={rate}
              onChange={e => setRate(Number(e.target.value))}
              className="w-full accent-emerald-500" />
            <div className="flex justify-between text-[9px] text-slate-600 mt-1">
              <span>4%</span><span>30%</span>
            </div>
          </div>

          {/* Investment Duration */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-2">
              <span className="text-slate-400">Investment Duration</span>
              <span className="text-purple-400 font-bold font-display">{years} years</span>
            </div>
            <input type="range" min="1" max="40" step="1" value={years}
              onChange={e => setYears(Number(e.target.value))}
              className="w-full accent-purple-500" />
            <div className="flex justify-between text-[9px] text-slate-600 mt-1">
              <span>1 yr</span><span>40 yrs</span>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-5">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Invested', value: formatCurrency(totalInvested), color: 'text-slate-200', icon: IndianRupee },
              { label: 'Estimated Corpus', value: formatCurrency(corpus), color: 'text-emerald-400', icon: TrendingUp },
              { label: 'Wealth Gains', value: formatCurrency(gains), color: 'text-blue-400', icon: Target },
              { label: 'Total Returns', value: `+${gainPercent}%`, color: 'text-purple-400', icon: TrendingUp },
            ].map(card => (
              <div key={card.label} className="glass-panel p-4 text-left">
                <card.icon className="w-4 h-4 text-slate-500 mb-2" />
                <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">{card.label}</p>
                <p className={`text-base font-extrabold font-display mt-1 ${card.color}`}>{card.value}</p>
              </div>
            ))}
          </div>

          {/* Donut representation */}
          <div className="glass-panel p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Wealth Accumulation Chart</h3>
              <div className="flex gap-3 text-[10px] font-semibold">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block" />Invested</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />Corpus</span>
              </div>
            </div>
            <div ref={chartRef} className="w-full" />
          </div>

          {/* Milestone Table */}
          <div className="glass-panel p-5 overflow-x-auto">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Year-by-Year Milestones</h3>
            <table className="w-full text-xs min-w-[400px]">
              <thead>
                <tr className="border-b border-slate-850 text-slate-450">
                  <th className="py-2 text-left">Year</th>
                  <th className="py-2 text-right">Invested</th>
                  <th className="py-2 text-right">Corpus</th>
                  <th className="py-2 text-right">Gains</th>
                </tr>
              </thead>
              <tbody>
                {[1, 3, 5, Math.ceil(years / 2), years].filter((v, i, a) => a.indexOf(v) === i && v <= years).map(yr => {
                  const m = yr * 12
                  const inv = monthly * m
                  const corp = monthly * (((Math.pow(1 + monthlyRate, m) - 1) / monthlyRate) * (1 + monthlyRate))
                  const g = corp - inv
                  return (
                    <tr key={yr} className="border-b border-slate-850/50">
                      <td className="py-3 font-bold text-slate-200">Year {yr}</td>
                      <td className="py-3 text-right text-slate-400">{formatCurrency(inv)}</td>
                      <td className="py-3 text-right text-emerald-400 font-bold">{formatCurrency(corp)}</td>
                      <td className="py-3 text-right text-blue-400 font-bold">+{formatCurrency(g)}</td>
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
