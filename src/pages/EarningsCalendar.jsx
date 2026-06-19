import React, { useState } from 'react'
import { Calendar, TrendingUp, Building2, IndianRupee, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// Curated Events Database
const EVENTS = [
  // Earnings
  { id: 1, type: 'earnings', company: 'Reliance Industries', symbol: 'RELIANCE', date: '2026-07-15', time: 'After Market Close', expectedEPS: '₹28.50', prevEPS: '₹25.80', sector: 'Energy', importance: 'high' },
  { id: 2, type: 'earnings', company: 'TCS', symbol: 'TCS', date: '2026-07-12', time: 'After Market Close', expectedEPS: '₹120.40', prevEPS: '₹115.20', sector: 'IT', importance: 'high' },
  { id: 3, type: 'earnings', company: 'Infosys', symbol: 'INFY', date: '2026-07-18', time: '9:30 AM IST', expectedEPS: '₹45.80', prevEPS: '₹43.10', sector: 'IT', importance: 'high' },
  { id: 4, type: 'earnings', company: 'HDFC Bank', symbol: 'HDFCBANK', date: '2026-07-20', time: 'After Market Close', expectedEPS: '₹88.20', prevEPS: '₹82.50', sector: 'Banking', importance: 'high' },
  { id: 5, type: 'earnings', company: 'Wipro', symbol: 'WIPRO', date: '2026-07-22', time: '4:00 PM IST', expectedEPS: '₹32.10', prevEPS: '₹30.40', sector: 'IT', importance: 'medium' },
  // Dividends
  { id: 6, type: 'dividend', company: 'ITC Ltd', symbol: 'ITC', date: '2026-06-28', dividendAmount: '₹7.50 per share', exDate: '2026-06-27', recordDate: '2026-06-28', importance: 'medium' },
  { id: 7, type: 'dividend', company: 'HDFC Bank', symbol: 'HDFCBANK', date: '2026-07-05', dividendAmount: '₹19.50 per share', exDate: '2026-07-04', recordDate: '2026-07-05', importance: 'medium' },
  { id: 8, type: 'dividend', company: 'Infosys', symbol: 'INFY', date: '2026-07-10', dividendAmount: '₹21.00 per share', exDate: '2026-07-09', recordDate: '2026-07-10', importance: 'medium' },
  // RBI / Macro Events
  { id: 9, type: 'macro', company: 'Reserve Bank of India', symbol: 'RBI', date: '2026-07-08', time: '10:00 AM IST', event: 'Monetary Policy Committee Meeting', description: 'MPC will announce repo rate decision. Market expects repo rate to remain at 6.50%.', importance: 'high' },
  { id: 10, type: 'macro', company: 'US Federal Reserve', symbol: 'FED', date: '2026-07-30', time: '11:30 PM IST', event: 'FOMC Interest Rate Decision', description: 'Fed expected to cut rates by 25bps. Markets pricing 85% probability of cut.', importance: 'high' },
  { id: 11, type: 'macro', company: 'Ministry of Finance', symbol: 'GOVT', date: '2026-07-01', time: '11:00 AM IST', event: 'India Q1 GDP Data Release', description: 'India Q1 FY27 GDP growth estimate expected at 7.2% YoY.', importance: 'medium' },
  { id: 12, type: 'macro', company: 'SEBI', symbol: 'SEBI', date: '2026-06-30', time: '3:00 PM IST', event: 'SEBI Board Meeting', description: 'Agenda includes new F&O framework regulations and insider trading amendments.', importance: 'medium' },
  // IPO Allotments
  { id: 13, type: 'ipo', company: 'Ola Electric Mobility', symbol: 'OLAELEC', date: '2026-06-20', event: 'Allotment Date', listingGain: '+22% expected', importance: 'medium' },
  { id: 14, type: 'ipo', company: 'Swiggy Limited', symbol: 'SWIGGY', date: '2026-07-08', event: 'IPO Opens', listingGain: '+8% expected', importance: 'medium' },
]

const TYPE_CONFIG = {
  earnings: { label: 'Earnings', icon: TrendingUp, color: 'blue', bg: 'bg-blue-500/10 border-blue-500/20 text-blue-400' },
  dividend: { label: 'Dividend', icon: IndianRupee, color: 'emerald', bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' },
  macro: { label: 'Macro Event', icon: Building2, color: 'amber', bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400' },
  ipo: { label: 'IPO', icon: Calendar, color: 'purple', bg: 'bg-purple-500/10 border-purple-500/20 text-purple-400' },
}

export default function EarningsCalendar() {
  const [filter, setFilter] = useState('all')
  const [expanded, setExpanded] = useState(null)

  const filtered = filter === 'all' ? EVENTS : EVENTS.filter(e => e.type === filter)
  const sorted = [...filtered].sort((a, b) => new Date(a.date) - new Date(b.date))

  // Group by date
  const grouped = sorted.reduce((acc, event) => {
    const key = event.date
    if (!acc[key]) acc[key] = []
    acc[key].push(event)
    return acc
  }, {})

  const formatDate = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  }

  const isToday = (dateStr) => new Date(dateStr).toDateString() === new Date().toDateString()
  const isPast = (dateStr) => new Date(dateStr) < new Date()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight font-display flex items-center gap-2">
          <Calendar className="w-8 h-8 text-blue-400" /> Earnings & Economic Calendar
        </h1>
        <p className="text-xs text-slate-400 mt-1">Track upcoming earnings results, dividend ex-dates, RBI policy meetings, and IPO events.</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {[['all', 'All Events'], ['earnings', 'Earnings'], ['dividend', 'Dividends'], ['macro', 'Macro Events'], ['ipo', 'IPO']].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filter === val
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="space-y-6">
        {Object.entries(grouped).map(([date, events]) => (
          <div key={date}>
            {/* Date Header */}
            <div className={`flex items-center gap-3 mb-3 ${isPast(date) ? 'opacity-60' : ''}`}>
              <div className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                isToday(date)
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-900 border border-slate-800 text-slate-400'
              }`}>
                {isToday(date) ? '🔴 TODAY' : formatDate(date)}
              </div>
              <div className="flex-1 h-px bg-slate-850" />
              <span className="text-[10px] text-slate-500">{events.length} event{events.length > 1 ? 's' : ''}</span>
            </div>

            {/* Events */}
            <div className="space-y-3">
              {events.map((event) => {
                const config = TYPE_CONFIG[event.type]
                const Icon = config.icon
                const isOpen = expanded === event.id

                return (
                  <motion.div
                    key={event.id}
                    layout
                    className={`glass-panel border overflow-hidden ${
                      event.importance === 'high'
                        ? 'border-slate-800/80 shadow-md shadow-blue-900/5'
                        : 'border-slate-850/60'
                    } ${isPast(date) ? 'opacity-60' : ''}`}
                  >
                    <button
                      onClick={() => setExpanded(isOpen ? null : event.id)}
                      className="w-full p-4 flex items-center gap-4 text-left cursor-pointer hover:bg-slate-900/20 transition-colors"
                    >
                      {/* Type Badge */}
                      <div className={`p-2 rounded-lg border flex-shrink-0 ${config.bg}`}>
                        <Icon className="w-4 h-4" />
                      </div>

                      {/* Main Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-slate-100 font-display">{event.company}</span>
                          {event.symbol && (
                            <span className="text-[9px] font-bold bg-slate-900 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-display">
                              {event.symbol}
                            </span>
                          )}
                          {event.importance === 'high' && (
                            <span className="text-[9px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded uppercase">
                              High Impact
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${config.bg}`}>
                            {config.label}
                          </span>
                          {event.time && (
                            <span className="text-[10px] text-slate-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {event.time}
                            </span>
                          )}
                          {event.event && (
                            <span className="text-[10px] text-slate-400">{event.event}</span>
                          )}
                        </div>
                      </div>

                      {/* Right Side Quick Info */}
                      <div className="text-right flex-shrink-0">
                        {event.type === 'earnings' && (
                          <div>
                            <p className="text-[10px] text-slate-500">Est. EPS</p>
                            <p className="text-xs font-bold text-emerald-400">{event.expectedEPS}</p>
                            <p className="text-[9px] text-slate-500">Prev: {event.prevEPS}</p>
                          </div>
                        )}
                        {event.type === 'dividend' && (
                          <div>
                            <p className="text-[10px] text-slate-500">Dividend</p>
                            <p className="text-xs font-bold text-emerald-400">{event.dividendAmount}</p>
                          </div>
                        )}
                        {event.type === 'ipo' && (
                          <div>
                            <p className="text-[9px] text-slate-500">Listing Gain</p>
                            <p className="text-xs font-bold text-purple-400">{event.listingGain}</p>
                          </div>
                        )}
                        <div className="mt-2 text-slate-500">
                          {isOpen ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
                        </div>
                      </div>
                    </button>

                    {/* Expanded Details */}
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pt-2 border-t border-slate-850 bg-slate-950/30 space-y-2">
                            {event.type === 'earnings' && (
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="p-3 bg-slate-950 rounded-lg border border-slate-850">
                                  <p className="text-[9px] text-slate-500 uppercase font-bold">Sector</p>
                                  <p className="text-xs text-slate-200 font-semibold mt-0.5">{event.sector}</p>
                                </div>
                                <div className="p-3 bg-slate-950 rounded-lg border border-slate-850">
                                  <p className="text-[9px] text-slate-500 uppercase font-bold">Expected EPS</p>
                                  <p className="text-xs text-emerald-400 font-bold mt-0.5">{event.expectedEPS}</p>
                                </div>
                                <div className="p-3 bg-slate-950 rounded-lg border border-slate-850">
                                  <p className="text-[9px] text-slate-500 uppercase font-bold">Prev EPS</p>
                                  <p className="text-xs text-slate-200 font-semibold mt-0.5">{event.prevEPS}</p>
                                </div>
                                <div className="p-3 bg-slate-950 rounded-lg border border-slate-850">
                                  <p className="text-[9px] text-slate-500 uppercase font-bold">Time</p>
                                  <p className="text-xs text-slate-200 font-semibold mt-0.5">{event.time}</p>
                                </div>
                              </div>
                            )}
                            {event.type === 'dividend' && (
                              <div className="grid grid-cols-3 gap-3">
                                <div className="p-3 bg-slate-950 rounded-lg border border-slate-850">
                                  <p className="text-[9px] text-slate-500 uppercase font-bold">Dividend Amount</p>
                                  <p className="text-xs text-emerald-400 font-bold mt-0.5">{event.dividendAmount}</p>
                                </div>
                                <div className="p-3 bg-slate-950 rounded-lg border border-slate-850">
                                  <p className="text-[9px] text-slate-500 uppercase font-bold">Ex-Date</p>
                                  <p className="text-xs text-slate-200 font-semibold mt-0.5">{event.exDate}</p>
                                </div>
                                <div className="p-3 bg-slate-950 rounded-lg border border-slate-850">
                                  <p className="text-[9px] text-slate-500 uppercase font-bold">Record Date</p>
                                  <p className="text-xs text-slate-200 font-semibold mt-0.5">{event.recordDate}</p>
                                </div>
                              </div>
                            )}
                            {event.type === 'macro' && event.description && (
                              <p className="text-xs text-slate-350 leading-relaxed p-3 bg-slate-950/40 rounded-lg border border-slate-850">
                                {event.description}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
