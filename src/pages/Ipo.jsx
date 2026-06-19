import React, { useState, useEffect } from 'react'
import { getIPOList } from '../services/finnhub'
import { Calendar, TrendingUp, Sparkles, CheckCircle, Clock } from 'lucide-react'

export default function Ipo() {
  const [ipoList, setIpoList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchIpo = async () => {
      const data = await getIPOList()
      setIpoList(data)
      setLoading(false)
    }
    fetchIpo()
  }, [])

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Listed':
        return <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-450 border border-emerald-500/15 text-[9px] font-bold uppercase flex items-center gap-1"><CheckCircle className="w-2.5 h-2.5" /> Listed</span>
      case 'Active':
        return <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-450 border border-blue-500/15 text-[9px] font-bold uppercase flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> Open</span>
      case 'Upcoming':
      default:
        return <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-450 border border-amber-500/15 text-[9px] font-bold uppercase flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> Upcoming</span>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight font-display flex items-center gap-2">
          <Calendar className="w-8 h-8 text-blue-400" /> Initial Public Offering (IPO) Tracker
        </h1>
        <p className="text-xs text-slate-400 mt-1">Monitor subscription multipliers, offering price bands, and listing gain forecasts.</p>
      </div>

      {/* Main List */}
      <div className="glass-panel p-5 bg-gradient-to-tr from-slate-900/40 to-slate-950/20">
        {loading ? (
          <div className="space-y-3 py-6 animate-pulse">
            <div className="h-6 bg-slate-800 rounded w-full" />
            <div className="h-6 bg-slate-800 rounded w-full" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-850 text-slate-450 pb-2">
                  <th className="py-2">Company Name</th>
                  <th className="py-2">Listing Date</th>
                  <th className="py-2">Issue Size</th>
                  <th className="py-2">Price Band</th>
                  <th className="py-2">Subscription</th>
                  <th className="py-2">AI Listing Gain Forecast</th>
                  <th className="py-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {ipoList.map((ipo) => (
                  <tr key={ipo.symbol} className="border-b border-slate-850/60 hover:bg-slate-900/10">
                    <td className="py-4 font-bold text-slate-200 font-display flex flex-col">
                      {ipo.name}
                      <span className="text-[9px] text-slate-500 font-normal font-sans">Symbol: {ipo.symbol}</span>
                    </td>
                    <td className="py-4 text-slate-450">
                      {new Date(ipo.date).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="py-4 text-slate-300 font-medium">{ipo.size}</td>
                    <td className="py-4 text-slate-400">{ipo.priceBand}</td>
                    <td className="py-4">
                      {ipo.subscription === '0.00x' ? (
                        <span className="text-slate-500 italic">Not Open Yet</span>
                      ) : (
                        <span className="font-bold text-slate-200">{ipo.subscription}</span>
                      )}
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-1 text-purple-400 font-bold">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>+{ipo.listingGainForecast}</span>
                      </div>
                    </td>
                    <td className="py-4 text-right flex justify-end">
                      {getStatusBadge(ipo.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
