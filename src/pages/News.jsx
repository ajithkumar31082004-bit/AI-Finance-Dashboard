import React, { useState, useEffect } from 'react'
import { getMarketNews, getCompanyNews, TOP_TICKERS } from '../services/finnhub'
import { getNewsSentimentAndSummary } from '../services/gemini'
import { useAlerts } from '../context/AlertContext'
import { Newspaper, Sparkles, AlertCircle, ChevronDown, ChevronUp, RefreshCw, Star } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function News() {
  const { triggerToast } = useAlerts()
  const [filterMode, setFilterMode] = useState('general') // 'general' or Ticker Symbol
  const [newsList, setNewsList] = useState([])
  const [loadingNews, setLoadingNews] = useState(true)

  // Track generated summaries and sentiment states for specific articles
  // Format: { [articleId]: { sentiment: 'Positive', summary: '...', loading: false } }
  const [aiData, setAiData] = useState({})

  const fetchNews = async () => {
    setLoadingNews(true)
    try {
      let data
      if (filterMode === 'general') {
        data = await getMarketNews()
      } else {
        data = await getCompanyNews(filterMode)
      }
      setNewsList(data)
    } catch (err) {
      triggerToast('News Fetch Error', 'Failed to retrieve news feed.', 'error')
    } finally {
      setLoadingNews(false)
    }
  }

  useEffect(() => {
    fetchNews()
  }, [filterMode])

  // Handle generating/fetching sentiment and summary on-demand for an article
  const analyzeArticle = async (article) => {
    // If already analyzed, just toggle it
    if (aiData[article.id]) {
      // Toggle visibility
      setAiData(prev => ({
        ...prev,
        [article.id]: {
          ...prev[article.id],
          expanded: !prev[article.id].expanded
        }
      }))
      return
    }

    // Set loading state for this article
    setAiData(prev => ({
      ...prev,
      [article.id]: { loading: true, expanded: true }
    }))

    try {
      const result = await getNewsSentimentAndSummary(article.headline, article.summary)
      setAiData(prev => ({
        ...prev,
        [article.id]: {
          sentiment: result.sentiment,
          summary: result.summary,
          loading: false,
          expanded: true
        }
      }))
    } catch (err) {
      triggerToast('AI Analysis Failed', 'Could not analyze news details.', 'error')
      setAiData(prev => ({
        ...prev,
        [article.id]: { loading: false, expanded: false }
      }))
    }
  }

  const getSentimentStyle = (sentiment) => {
    switch (sentiment) {
      case 'Positive':
        return 'bg-emerald-500/10 text-emerald-450 border-emerald-500/20'
      case 'Negative':
        return 'bg-red-500/10 text-red-450 border-red-500/20'
      case 'Neutral':
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700/60'
    }
  }

  const getSentimentDot = (sentiment) => {
    switch (sentiment) {
      case 'Positive': return '🟢'
      case 'Negative': return '🔴'
      case 'Neutral':
      default: return '🟡'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight font-display flex items-center gap-2">
            <Newspaper className="w-8 h-8 text-blue-400" /> News Sentiment Center
          </h1>
          <p className="text-xs text-slate-400 mt-1">Real-time market feeds enhanced with Gemini AI sentiment tags and executive summaries.</p>
        </div>

        {/* Filter Category Selector */}
        <div className="flex items-center gap-2">
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value)}
            className="px-4 py-2.5 bg-slate-900 border border-slate-800 text-xs font-semibold rounded-xl text-slate-200 outline-none cursor-pointer focus:border-blue-500"
          >
            <option value="general">🌍 General Market News</option>
            {TOP_TICKERS.map((t) => (
              <option key={t.symbol} value={t.symbol}>
                📈 {t.symbol} - News
              </option>
            ))}
          </select>
          <button
            onClick={fetchNews}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-100 border border-slate-800 rounded-xl transition-all cursor-pointer active:scale-95"
            title="Refresh news"
          >
            <RefreshCw className={`w-4 h-4 ${loadingNews ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main News Feed Container */}
      <div className="max-w-4xl mx-auto space-y-4">
        {loadingNews ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="glass-panel p-5 animate-pulse flex flex-col md:flex-row gap-5">
                <div className="w-full md:w-40 h-28 bg-slate-800 rounded-xl" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-slate-800 rounded w-1/4" />
                  <div className="h-5 bg-slate-800 rounded w-11/12" />
                  <div className="h-3.5 bg-slate-800 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : newsList.length === 0 ? (
          <div className="text-center py-16 glass-panel">
            <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-2.5" />
            <p className="text-sm text-slate-400 font-medium">No recent news available for this category.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {newsList.map((news) => {
              const ai = aiData[news.id]
              const hasAiData = ai && ai.sentiment
              const isExpanded = ai && ai.expanded

              return (
                <motion.div
                  key={news.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-panel p-5 bg-[#0d1018]/50 border border-slate-850 hover:border-slate-800 flex flex-col md:flex-row gap-5"
                >
                  {/* Article Thumbnail */}
                  <div className="w-full md:w-44 h-28 flex-shrink-0 rounded-xl overflow-hidden bg-slate-950 border border-slate-850/40 relative">
                    <img 
                      src={news.image} 
                      alt="News cover" 
                      className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity"
                    />
                  </div>

                  {/* Text Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      {/* Meta Source & Date */}
                      <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold mb-1">
                        <span>{news.source.toUpperCase()}</span>
                        <span>{new Date(news.datetime).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      {/* Headline */}
                      <h3 className="text-sm font-bold text-slate-100 leading-snug hover:text-blue-400 font-display">
                        <a href={news.url} target="_blank" rel="noopener noreferrer">
                          {news.headline}
                        </a>
                      </h3>

                      {/* Original Snippet */}
                      <p className="text-xs text-slate-450 mt-2 line-clamp-2 leading-relaxed">
                        {news.summary}
                      </p>
                    </div>

                    {/* AI Expansion Zone */}
                    <div className="mt-4 flex flex-col gap-3">
                      {/* Control buttons */}
                      <div className="flex items-center justify-between gap-3 border-t border-slate-900 pt-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => analyzeArticle(news)}
                            disabled={ai?.loading}
                            className="inline-flex items-center gap-1.5 text-[11px] font-bold py-1 px-3 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 border border-purple-900/20 rounded-lg cursor-pointer active:scale-95 transition-all disabled:opacity-50"
                          >
                            <Sparkles className="w-3 h-3" />
                            {ai?.loading ? 'Analyzing...' : hasAiData ? (isExpanded ? 'Hide AI Summary' : 'Show AI Summary') : 'Generate AI Summary'}
                          </button>
                        </div>

                        {/* On-demand sentiment label */}
                        {hasAiData && (
                          <div className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border flex items-center gap-1 ${getSentimentStyle(ai.sentiment)}`}>
                            <span>Sentiment:</span>
                            <span>{getSentimentDot(ai.sentiment)} {ai.sentiment}</span>
                          </div>
                        )}
                      </div>

                      {/* AI summary text display block */}
                      <AnimatePresence>
                        {isExpanded && !ai.loading && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="p-3.5 bg-slate-950 rounded-xl border border-purple-950/30 text-xs text-purple-300 italic leading-relaxed">
                              <span className="font-bold uppercase tracking-wider text-[9px] text-purple-450 block mb-1">AI Executive Summary</span>
                              "{ai.summary}"
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
