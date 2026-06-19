const API_KEY = import.meta.env.VITE_FINNHUB_API_KEY || 'd8qbji1r01qr03nh1av0d8qbji1r01qr03nh1avg'
const BASE_URL = 'https://finnhub.io/api/v1'
const WS_URL = `wss://ws.finnhub.io?token=${API_KEY}`

// Static list of popular assets supported by our dashboard
export const TOP_TICKERS = [
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', price: 2450.00, change: 1.25, volume: 4500000, marketCap: '16.5T', sector: 'Energy' },
  { symbol: 'TCS', name: 'Tata Consultancy Services', price: 3820.00, change: -0.45, volume: 1800000, marketCap: '13.9T', sector: 'IT' },
  { symbol: 'INFY', name: 'Infosys Ltd', price: 1480.00, change: 2.10, volume: 3200000, marketCap: '6.1T', sector: 'IT' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', price: 1610.00, change: 0.85, volume: 6200000, marketCap: '12.2T', sector: 'Banking' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', price: 1120.00, change: -1.30, volume: 4100000, marketCap: '7.8T', sector: 'Banking' },
  { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd', price: 960.00, change: 3.40, volume: 5500000, marketCap: '3.4T', sector: 'Auto' },
  { symbol: 'ITC', name: 'ITC Ltd', price: 430.00, change: 0.15, volume: 2900000, marketCap: '5.3T', sector: 'FMCG' },
  { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical', price: 1540.00, change: -0.65, volume: 1200000, marketCap: '3.7T', sector: 'Pharma' },
  { symbol: 'AAPL', name: 'Apple Inc.', price: 182.50, change: 0.65, volume: 52000000, marketCap: '2.8T', sector: 'IT' },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 175.20, change: -2.40, volume: 88000000, marketCap: '560B', sector: 'Auto' }
]

// 1. Fetch Ticker Quote
export const getStockQuote = async (symbol) => {
  try {
    const res = await fetch(`${BASE_URL}/quote?symbol=${symbol}&token=${API_KEY}`)
    if (!res.ok) throw new Error('API request failed')
    const data = await res.json()

    // Finnhub response maps: c = current price, d = change, dp = percent change, h = high, l = low, o = open, pc = prev close
    if (data.c === 0 && data.pc === 0) {
      // Return local fallback if API returns empty/null
      return getMockQuote(symbol)
    }

    return {
      symbol,
      price: data.c,
      change: data.d,
      changePercent: data.dp,
      high: data.h,
      low: data.l,
      open: data.o,
      prevClose: data.pc,
      timestamp: Date.now()
    }
  } catch (err) {
    console.warn(`Finnhub Quote fetch failed for ${symbol}, using fallback data.`)
    return getMockQuote(symbol)
  }
}

// 2. Fetch General Market News
export const getMarketNews = async () => {
  try {
    const res = await fetch(`${BASE_URL}/news?category=general&token=${API_KEY}`)
    if (!res.ok) throw new Error('News fetch failed')
    const data = await res.json()

    if (!Array.isArray(data) || data.length === 0) {
      return getMockNews()
    }

    return data.slice(0, 15).map(item => ({
      id: item.id,
      headline: item.headline,
      summary: item.summary,
      source: item.source,
      url: item.url,
      image: item.image || 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
      datetime: item.datetime * 1000
    }))
  } catch (err) {
    return getMockNews()
  }
}

// 3. Fetch Company Specific News
export const getCompanyNews = async (symbol) => {
  try {
    // Current date range (last 14 days)
    const toDate = new Date().toISOString().split('T')[0]
    const fromDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const res = await fetch(`${BASE_URL}/company-news?symbol=${symbol}&from=${fromDate}&to=${toDate}&token=${API_KEY}`)
    if (!res.ok) throw new Error('Company news failed')
    const data = await res.json()

    if (!Array.isArray(data) || data.length === 0) {
      return getMockNews().filter(n => n.headline.includes(symbol) || Math.random() > 0.5)
    }

    return data.slice(0, 8).map(item => ({
      id: item.id,
      headline: item.headline,
      summary: item.summary,
      source: item.source,
      url: item.url,
      image: item.image || 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
      datetime: item.datetime * 1000
    }))
  } catch (err) {
    return getMockNews().slice(0, 4)
  }
}

// 4. Fetch IPO Calendar/Tracker
export const getIPOList = async () => {
  // Free tier Finnhub accounts typically don't have access to complete IPO data,
  // or return empty arrays. We provide a highly descriptive curated database.
  return [
    { name: 'Hyundai Motor India', symbol: 'HYUNDAI', date: '2026-06-25', size: '₹27,870 Cr', priceBand: '₹1,860 - ₹1,960', subscription: '3.12x', listingGainForecast: '15%', status: 'Upcoming' },
    { name: 'Swiggy Limited', symbol: 'SWIGGY', date: '2026-07-02', size: '₹10,400 Cr', priceBand: '₹370 - ₹390', subscription: '2.45x', listingGainForecast: '8%', status: 'Upcoming' },
    { name: 'Ola Electric Mobility', symbol: 'OLAELEC', date: '2026-06-12', size: '₹6,145 Cr', priceBand: '₹72 - ₹76', subscription: '4.20x', listingGainForecast: '22%', status: 'Active' },
    { name: 'FirstCry (Brainbees)', symbol: 'FIRSTCRY', date: '2026-07-15', size: '₹4,193 Cr', priceBand: '₹440 - ₹465', subscription: '0.00x', listingGainForecast: '5%', status: 'Upcoming' },
    { name: 'Aadhar Housing Finance', symbol: 'AADHAR', date: '2026-05-15', size: '₹3,000 Cr', priceBand: '₹300 - ₹315', subscription: '25.6x', listingGainForecast: '12%', status: 'Listed' }
  ]
}

// 5. WebSocket Client connection setup
export class StockWebSocket {
  constructor(onPriceUpdate) {
    this.onPriceUpdate = onPriceUpdate
    this.ws = null
    this.subscribedSymbols = new Set()
  }

  connect() {
    this.ws = new WebSocket(WS_URL)

    this.ws.onopen = () => {
      console.log('Stock WebSocket Connected.')
      // Re-subscribe to any stored symbols
      this.subscribedSymbols.forEach(sym => this.subscribeSymbol(sym))
    }

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data)
      if (msg.type === 'trade' && msg.data) {
        msg.data.forEach(trade => {
          this.onPriceUpdate({
            symbol: trade.s,
            price: trade.p,
            volume: trade.v,
            time: trade.t
          })
        })
      }
    }

    this.ws.onerror = (error) => {
      console.error('WebSocket Error:', error)
    }

    this.ws.onclose = () => {
      console.log('Stock WebSocket Closed. Reconnecting in 5s...')
      setTimeout(() => this.connect(), 5000)
    }
  }

  subscribe(symbol) {
    const cleanSym = symbol.toUpperCase()
    this.subscribedSymbols.add(cleanSym)
    this.subscribeSymbol(cleanSym)
  }

  unsubscribe(symbol) {
    const cleanSym = symbol.toUpperCase()
    this.subscribedSymbols.delete(cleanSym)
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'unsubscribe', symbol: cleanSym }))
    }
  }

  subscribeSymbol(symbol) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'subscribe', symbol }))
    }
  }

  close() {
    if (this.ws) {
      this.ws.close()
    }
  }
}

// Fallback Mock Quotes
function getMockQuote(symbol) {
  const match = TOP_TICKERS.find(t => t.symbol.toUpperCase() === symbol.toUpperCase())
  const basePrice = match ? match.price : 150.00
  const randomPercent = (Math.random() * 4 - 2) // -2% to +2%
  const price = basePrice * (1 + randomPercent / 100)
  const change = price - basePrice

  return {
    symbol: symbol.toUpperCase(),
    price: parseFloat(price.toFixed(2)),
    change: parseFloat(change.toFixed(2)),
    changePercent: parseFloat(randomPercent.toFixed(2)),
    high: parseFloat((price * 1.01).toFixed(2)),
    low: parseFloat((price * 0.99).toFixed(2)),
    open: parseFloat(basePrice.toFixed(2)),
    prevClose: basePrice,
    timestamp: Date.now()
  }
}

// Fallback Mock News
function getMockNews() {
  return [
    {
      id: 1,
      headline: 'Reliance Retail Announces Massive Offline Expansion, Stocks Rally 2%',
      summary: 'Reliance Industries subsidiary plans to add 1,500 new stores across suburban Tier-2 cities in India, driving bullish interest from institutional investors.',
      source: 'Bloomberg Quint',
      url: '#',
      image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
      datetime: Date.now() - 3600000
    },
    {
      id: 2,
      headline: 'TCS Signs Multi-Billion Dollar Digital Cloud Deal with UK Banking Giant',
      summary: 'Tata Consultancy Services secured a 10-year enterprise cloud migration contract, strengthening its IT solutions dominance amid high interest rates.',
      source: 'Economic Times',
      url: '#',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
      datetime: Date.now() - 7200000
    },
    {
      id: 3,
      headline: 'Reserve Bank of India Keeps Repo Rate Unchanged at 6.50% in Policy Update',
      summary: 'The RBI governor maintains a hawkish stance on inflation control, causing bank shares like HDFC and ICICI to trade flat during morning sessions.',
      source: 'Reuters',
      url: '#',
      image: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
      datetime: Date.now() - 10800000
    },
    {
      id: 4,
      headline: 'Tech Selloff Drags US Market Lower; Apple and Tesla Hit by Import Tariffs',
      summary: 'NASDAQ records a 1.5% drop as supply chain interruptions and new hardware tariffs hit mega-cap tech stocks, prompting capital flight to bonds.',
      source: 'MarketWatch',
      url: '#',
      image: 'https://images.unsplash.com/photo-1618044733300-9472054094ee?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
      datetime: Date.now() - 14400000
    }
  ]
}
