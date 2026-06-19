import React, { useEffect, useRef, useState } from 'react'
import { createChart, LineStyle } from 'lightweight-charts'
import { TOP_TICKERS, StockWebSocket } from '../services/finnhub'
import { PlayCircle, Award, Layout, Eye, TrendingUp, HelpCircle } from 'lucide-react'

export default function TVChart({ symbol = 'RELIANCE' }) {
  const chartContainerRef = useRef(null)
  const rsiContainerRef = useRef(null)
  const chartRef = useRef(null)
  const rsiChartRef = useRef(null)
  
  // Chart Series Refs
  const candleSeriesRef = useRef(null)
  const smaSeriesRef = useRef(null)
  const emaSeriesRef = useRef(null)
  const bbUpperSeriesRef = useRef(null)
  const bbBasisSeriesRef = useRef(null)
  const bbLowerSeriesRef = useRef(null)
  
  const rsiSeriesRef = useRef(null)
  const macdLineSeriesRef = useRef(null)
  const macdSignalSeriesRef = useRef(null)

  // Options State
  const [timeframe, setTimeframe] = useState('1D') // '15M', '1H', '1D', '1W'
  const [indicators, setIndicators] = useState({
    sma: false,
    ema: false,
    bb: false,
    rsi: false,
    macd: false
  })
  
  // Custom price lines (support/resistance lines)
  const [priceLines, setPriceLines] = useState([])
  const [selectedTool, setSelectedTool] = useState(null) // 'support', 'resistance'

  // Mock historical data generator
  const generateHistoryData = (symbol) => {
    const list = []
    const match = TOP_TICKERS.find(t => t.symbol.toUpperCase() === symbol.toUpperCase())
    let price = match ? match.price : 150.00
    
    // Create 120 bars back
    let time = new Date()
    time.setDate(time.getDate() - 120)

    for (let i = 0; i < 120; i++) {
      const open = price
      const change = price * (Math.random() * 0.04 - 0.02)
      const close = price + change
      const high = Math.max(open, close) + price * (Math.random() * 0.01)
      const low = Math.min(open, close) - price * (Math.random() * 0.01)
      
      list.push({
        time: time.toISOString().split('T')[0],
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2))
      })
      
      price = close
      time.setDate(time.getDate() + 1)
    }
    return list
  }

  // TECHNICAL INDICATORS CALCULATION FUNCTIONS
  const calculateSMA = (data, count = 20) => {
    const sma = []
    for (let i = 0; i < data.length; i++) {
      if (i < count - 1) continue
      let sum = 0
      for (let j = 0; j < count; j++) {
        sum += data[i - j].close
      }
      sma.push({ time: data[i].time, value: parseFloat((sum / count).toFixed(2)) })
    }
    return sma
  }

  const calculateEMA = (data, count = 20) => {
    const ema = []
    const k = 2 / (count + 1)
    let prevEma = data[0].close
    ema.push({ time: data[0].time, value: prevEma })
    
    for (let i = 1; i < data.length; i++) {
      const value = data[i].close * k + prevEma * (1 - k)
      ema.push({ time: data[i].time, value: parseFloat(value.toFixed(2)) })
      prevEma = value
    }
    return ema
  }

  const calculateBollingerBands = (data, count = 20, multiplier = 2) => {
    const upper = []
    const basis = []
    const lower = []

    for (let i = 0; i < data.length; i++) {
      if (i < count - 1) continue
      
      // Calculate basis (SMA)
      let sum = 0
      for (let j = 0; j < count; j++) {
        sum += data[i - j].close
      }
      const mean = sum / count
      
      // Calculate standard deviation
      let sumSqDiff = 0
      for (let j = 0; j < count; j++) {
        sumSqDiff += Math.pow(data[i - j].close - mean, 2)
      }
      const stdDev = Math.sqrt(sumSqDiff / count)

      basis.push({ time: data[i].time, value: parseFloat(mean.toFixed(2)) })
      upper.push({ time: data[i].time, value: parseFloat((mean + stdDev * multiplier).toFixed(2)) })
      lower.push({ time: data[i].time, value: parseFloat((mean - stdDev * multiplier).toFixed(2)) })
    }
    
    return { upper, basis, lower }
  }

  const calculateRSI = (data, count = 14) => {
    const rsi = []
    let gains = 0
    let losses = 0

    // First RSI
    for (let i = 1; i <= count; i++) {
      const diff = data[i].close - data[i - 1].close
      if (diff > 0) gains += diff
      else losses -= diff
    }

    let avgGain = gains / count
    let avgLoss = losses / count
    rsi.push({ time: data[count].time, value: parseFloat((100 - (100 / (1 + avgGain / avgLoss))).toFixed(2)) })

    for (let i = count + 1; i < data.length; i++) {
      const diff = data[i].close - data[i - 1].close
      avgGain = (avgGain * (count - 1) + (diff > 0 ? diff : 0)) / count
      avgLoss = (avgLoss * (count - 1) + (diff < 0 ? -diff : 0)) / count
      
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
      rsi.push({ time: data[i].time, value: parseFloat((100 - (100 / (1 + rs))).toFixed(2)) })
    }
    
    return rsi
  }

  const calculateMACD = (data, short = 12, long = 26, signal = 9) => {
    const emaShort = calculateEMA(data, short)
    const emaLong = calculateEMA(data, long)
    
    const macdLine = []
    // Sync indices
    emaLong.forEach((longItem) => {
      const shortItem = emaShort.find(s => s.time === longItem.time)
      if (shortItem) {
        macdLine.push({
          time: longItem.time,
          value: parseFloat((shortItem.value - longItem.value).toFixed(2))
        })
      }
    })

    // Calculate MACD Signal Line (EMA of MACD Line)
    const signalLine = []
    const k = 2 / (signal + 1)
    let prevSignal = macdLine[0].value
    signalLine.push({ time: macdLine[0].time, value: prevSignal })
    
    for (let i = 1; i < macdLine.length; i++) {
      const value = macdLine[i].value * k + prevSignal * (1 - k)
      signalLine.push({ time: macdLine[i].time, value: parseFloat(value.toFixed(2)) })
      prevSignal = value
    }

    return { macdLine, signalLine }
  }

  // INITIALIZE CHARTS
  useEffect(() => {
    if (!chartContainerRef.current) return

    const initialHistory = generateHistoryData(symbol)

    // 1. Setup Price Chart
    const priceChart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 320,
      layout: {
        background: { color: 'transparent' },
        textColor: '#94a3b8',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.03)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.03)' },
      },
      crosshair: {
        mode: 0,
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.08)',
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.08)',
      }
    })

    const candleSeries = priceChart.addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#ef4444',
      borderDownColor: '#ef4444',
      borderUpColor: '#10b981',
      wickDownColor: '#ef4444',
      wickUpColor: '#10b981',
    })

    candleSeries.setData(initialHistory)
    candleSeriesRef.current = candleSeries
    chartRef.current = priceChart

    // Click handler on price chart for placing Drawing lines
    priceChart.subscribeClick((param) => {
      if (!param.point || !param.price || !selectedTool) return

      const clickedPrice = param.price
      const lineId = Math.random().toString(36).substr(2, 9)
      const color = selectedTool === 'support' ? '#10b981' : '#ef4444'
      
      const customLine = candleSeries.createPriceLine({
        price: parseFloat(clickedPrice.toFixed(2)),
        color,
        lineWidth: 1.5,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: `${selectedTool.toUpperCase()} @ ${clickedPrice.toFixed(2)}`
      })

      setPriceLines((prev) => [...prev, { id: lineId, value: clickedPrice, ref: customLine, type: selectedTool }])
      setSelectedTool(null) // Reset selection tool
    })

    // Handle window resize
    const handleResize = () => {
      priceChart.applyOptions({ width: chartContainerRef.current.clientWidth })
    }
    window.addEventListener('resize', handleResize)

    // WebSocket subscription for live candle updates
    const socket = new WebSocket('wss://ws.finnhub.io?token=d8qbji1r01qr03nh1av0d8qbji1r01qr03nh1avg')
    socket.onopen = () => {
      socket.send(JSON.stringify({ type: 'subscribe', symbol: symbol.toUpperCase() }))
    }

    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data)
      if (msg.type === 'trade' && msg.data) {
        const trade = msg.data[0]
        if (trade.s.toUpperCase() === symbol.toUpperCase()) {
          const lastCandle = initialHistory[initialHistory.length - 1]
          
          // Update last candle in-place or generate a new one if day changes
          const dateStr = new Date().toISOString().split('T')[0]
          
          let updatedCandle
          if (lastCandle.time === dateStr) {
            updatedCandle = {
              ...lastCandle,
              high: Math.max(lastCandle.high, trade.p),
              low: Math.min(lastCandle.low, trade.p),
              close: trade.p
            }
          } else {
            updatedCandle = {
              time: dateStr,
              open: trade.p,
              high: trade.p,
              low: trade.p,
              close: trade.p
            }
          }
          candleSeries.update(updatedCandle)
        }
      }
    }

    return () => {
      window.removeEventListener('resize', handleResize)
      priceChart.remove()
      socket.close()
    }
  }, [symbol])

  // RE-DRAW TOGGLED INDICATORS
  useEffect(() => {
    if (!candleSeriesRef.current || !chartRef.current) return
    const currentData = generateHistoryData(symbol)

    // Handle SMA
    if (indicators.sma) {
      if (!smaSeriesRef.current) {
        smaSeriesRef.current = chartRef.current.addLineSeries({ color: '#3b82f6', lineWidth: 1.5 })
      }
      smaSeriesRef.current.setData(calculateSMA(currentData, 20))
    } else if (smaSeriesRef.current) {
      chartRef.current.removeSeries(smaSeriesRef.current)
      smaSeriesRef.current = null
    }

    // Handle EMA
    if (indicators.ema) {
      if (!emaSeriesRef.current) {
        emaSeriesRef.current = chartRef.current.addLineSeries({ color: '#8b5cf6', lineWidth: 1.5 })
      }
      emaSeriesRef.current.setData(calculateEMA(currentData, 20))
    } else if (emaSeriesRef.current) {
      chartRef.current.removeSeries(emaSeriesRef.current)
      emaSeriesRef.current = null
    }

    // Handle Bollinger Bands
    if (indicators.bb) {
      if (!bbUpperSeriesRef.current) {
        bbUpperSeriesRef.current = chartRef.current.addLineSeries({ color: 'rgba(236, 72, 153, 0.6)', lineWidth: 1, lineStyle: LineStyle.Dashed })
        bbBasisSeriesRef.current = chartRef.current.addLineSeries({ color: 'rgba(236, 72, 153, 0.4)', lineWidth: 1 })
        bbLowerSeriesRef.current = chartRef.current.addLineSeries({ color: 'rgba(236, 72, 153, 0.6)', lineWidth: 1, lineStyle: LineStyle.Dashed })
      }
      const { upper, basis, lower } = calculateBollingerBands(currentData, 20, 2)
      bbUpperSeriesRef.current.setData(upper)
      bbBasisSeriesRef.current.setData(basis)
      bbLowerSeriesRef.current.setData(lower)
    } else {
      if (bbUpperSeriesRef.current) {
        chartRef.current.removeSeries(bbUpperSeriesRef.current)
        chartRef.current.removeSeries(bbBasisSeriesRef.current)
        chartRef.current.removeSeries(bbLowerSeriesRef.current)
        bbUpperSeriesRef.current = null
        bbBasisSeriesRef.current = null
        bbLowerSeriesRef.current = null
      }
    }
  }, [indicators.sma, indicators.ema, indicators.bb, symbol])

  // SUB-PANE RSI & MACD CHART PANELS
  useEffect(() => {
    if (!rsiContainerRef.current) return
    const showSubpane = indicators.rsi || indicators.macd

    if (!showSubpane) {
      if (rsiChartRef.current) {
        rsiChartRef.current.remove()
        rsiChartRef.current = null
        rsiSeriesRef.current = null
        macdLineSeriesRef.current = null
        macdSignalSeriesRef.current = null
      }
      return
    }

    const currentData = generateHistoryData(symbol)

    if (!rsiChartRef.current) {
      rsiChartRef.current = createChart(rsiContainerRef.current, {
        width: rsiContainerRef.current.clientWidth,
        height: 120,
        layout: {
          background: { color: 'transparent' },
          textColor: '#94a3b8',
        },
        grid: {
          vertLines: { color: 'rgba(255, 255, 255, 0.03)' },
          horzLines: { color: 'rgba(255, 255, 255, 0.03)' },
        },
        timeScale: {
          visible: false,
        },
        rightPriceScale: {
          borderColor: 'rgba(255, 255, 255, 0.08)',
        }
      })
    }

    const subChart = rsiChartRef.current

    // Clear previous series
    if (rsiSeriesRef.current) subChart.removeSeries(rsiSeriesRef.current)
    if (macdLineSeriesRef.current) {
      subChart.removeSeries(macdLineSeriesRef.current)
      subChart.removeSeries(macdSignalSeriesRef.current)
    }
    
    rsiSeriesRef.current = null
    macdLineSeriesRef.current = null
    macdSignalSeriesRef.current = null

    if (indicators.rsi) {
      const rsiSeries = subChart.addLineSeries({ color: '#f59e0b', lineWidth: 1.5 })
      rsiSeries.setData(calculateRSI(currentData, 14))
      rsiSeriesRef.current = rsiSeries

      // Standard RSI Threshold lines (70 overbought, 30 oversold)
      rsiSeries.createPriceLine({ price: 70, color: 'rgba(239, 68, 68, 0.4)', lineWidth: 1, title: '70' })
      rsiSeries.createPriceLine({ price: 30, color: 'rgba(16, 185, 129, 0.4)', lineWidth: 1, title: '30' })
    } else if (indicators.macd) {
      const macdLineSeries = subChart.addLineSeries({ color: '#06b6d4', lineWidth: 1.5 })
      const macdSignalSeries = subChart.addLineSeries({ color: '#ec4899', lineWidth: 1.5 })
      
      const { macdLine, signalLine } = calculateMACD(currentData)
      macdLineSeries.setData(macdLine)
      macdSignalSeries.setData(signalLine)

      macdLineSeriesRef.current = macdLineSeries
      macdSignalSeriesRef.current = macdSignalSeries
    }

    const handleResizeSub = () => {
      if (rsiChartRef.current) rsiChartRef.current.applyOptions({ width: rsiContainerRef.current.clientWidth })
    }
    window.addEventListener('resize', handleResizeSub)

    return () => {
      window.removeEventListener('resize', handleResizeSub)
    }
  }, [indicators.rsi, indicators.macd, symbol])

  const toggleIndicator = (ind) => {
    setIndicators(prev => {
      // Mutual exclusion for subpane indicators (RSI & MACD)
      if (ind === 'rsi' && !prev.rsi) return { ...prev, rsi: true, macd: false }
      if (ind === 'macd' && !prev.macd) return { ...prev, macd: true, rsi: false }
      return { ...prev, [ind]: !prev[ind] }
    })
  }

  const clearDrawingLines = () => {
    priceLines.forEach((line) => {
      if (candleSeriesRef.current) {
        candleSeriesRef.current.removePriceLine(line.ref)
      }
    })
    setPriceLines([])
  }

  return (
    <div className="space-y-4">
      {/* Chart Toolbar Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-850/80">
        
        {/* Timeframes */}
        <div className="flex items-center gap-1">
          {['15M', '1H', '1D', '1W'].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                timeframe === tf ? 'bg-blue-600/10 text-blue-400 border border-blue-900/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Indicators Selector */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => toggleIndicator('sma')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              indicators.sma ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-slate-950 text-slate-500 border border-slate-850'
            }`}
          >
            SMA (20)
          </button>
          <button
            onClick={() => toggleIndicator('ema')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              indicators.ema ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-slate-950 text-slate-500 border border-slate-850'
            }`}
          >
            EMA (20)
          </button>
          <button
            onClick={() => toggleIndicator('bb')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              indicators.bb ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' : 'bg-slate-950 text-slate-500 border border-slate-850'
            }`}
          >
            Bollinger
          </button>
          <button
            onClick={() => toggleIndicator('rsi')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              indicators.rsi ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-950 text-slate-500 border border-slate-850'
            }`}
          >
            RSI (14)
          </button>
          <button
            onClick={() => toggleIndicator('macd')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              indicators.macd ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-slate-950 text-slate-500 border border-slate-850'
            }`}
          >
            MACD
          </button>
        </div>

        {/* Drawings Toolbar */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSelectedTool(selectedTool === 'support' ? null : 'support')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer transition-all ${
              selectedTool === 'support' ? 'bg-emerald-600 text-white' : 'bg-slate-950 text-emerald-450 border border-slate-850'
            }`}
          >
            + Support
          </button>
          <button
            onClick={() => setSelectedTool(selectedTool === 'resistance' ? null : 'resistance')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer transition-all ${
              selectedTool === 'resistance' ? 'bg-red-650 text-white' : 'bg-slate-950 text-red-450 border border-slate-850'
            }`}
          >
            + Resistance
          </button>
          {priceLines.length > 0 && (
            <button
              onClick={clearDrawingLines}
              className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-bold rounded-lg cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

      </div>

      {/* Selected Drawing Mode Hint */}
      {selectedTool && (
        <div className="text-[10px] text-amber-400 font-semibold px-2 flex items-center gap-1 animate-pulse">
          <span>⚠️ CLICK anywhere inside the chart canvas below to draw a horizontal {selectedTool.toUpperCase()} price line.</span>
        </div>
      )}

      {/* Main Chart Canvas container */}
      <div className="glass-panel p-4 bg-slate-950/20 relative">
        <div ref={chartContainerRef} className="w-full" />
        
        {/* RSI/MACD Subpane container */}
        <div 
          ref={rsiContainerRef} 
          className={`w-full border-t border-slate-850 mt-3 pt-3 transition-all duration-300 ${
            indicators.rsi || indicators.macd ? 'h-[140px] opacity-100' : 'h-0 opacity-0 pointer-events-none'
          }`} 
        />
      </div>
    </div>
  )
}
