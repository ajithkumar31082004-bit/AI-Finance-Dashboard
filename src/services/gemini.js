import { GoogleGenerativeAI } from '@google/generative-ai'

// Retrieve API key from environment
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || ''
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null

// 1. Chatbot Financial Assistant
export const getChatbotResponse = async (message, history = [], portfolio = []) => {
  if (!genAI) {
    return "Gemini API key is not configured. Please add VITE_GEMINI_API_KEY in your env settings."
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    
    // Create context about user's portfolio to inject into prompt
    const portfolioContext = portfolio.length > 0 
      ? `User's current stock portfolio holdings:
         ${portfolio.map(p => `- ${p.stock_symbol}: ${p.quantity} shares bought at average price ₹${p.buy_price} (Current price: ₹${p.current_price})`).join('\n')}`
      : "User has no current stock holdings in their portfolio."

    const systemPrompt = `You are "Apex AI", a sophisticated, expert financial assistant chatbot for Apex Finance.
    You help users manage portfolios, analyze stocks, compare companies, explain technical analysis, and track markets.
    
    Your voice is professional, precise, data-driven, yet accessible.
    
    ${portfolioContext}
    
    Guidelines:
    1. Answer finance and market-related questions accurately.
    2. Provide code or equations when helpful (e.g. explaining RSI).
    3. Refer back to the user's portfolio context if they ask about "my portfolio", "what I own", or similar questions.
    4. Keep answers readable with markdown bullet points and bold text.
    5. Always append this disclaimer at the very end of your response: "*Disclaimer: Information provided is for educational purposes only and does not constitute financial advice.*"
    `

    // Map conversation history
    const contents = history.map(chat => ({
      role: chat.role === 'user' ? 'user' : 'model',
      parts: [{ text: chat.text }]
    }))

    // Add user's new message
    contents.push({ role: 'user', parts: [{ text: message }] })

    // Inject system instructions (Prepend as system instruction or add to the chat config)
    const result = await model.generateContent({
      contents,
      systemInstruction: systemPrompt
    })

    const response = await result.response
    return response.text()
  } catch (err) {
    console.error('Gemini Chatbot Error:', err)
    return "I apologize, but I encountered an error while processing your request. Please try again."
  }
}

// 2. AI Stock Forecast Generator
export const getStockForecast = async (symbol, currentPrice, technicals = {}) => {
  if (!genAI) {
    // Return mock data fallback if API key is not configured
    return getMockForecast(symbol, currentPrice)
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: 'application/json' }
    })

    const prompt = `Perform a financial stock price forecast analysis for the stock ticker "${symbol}".
    Current Price: ₹${currentPrice}
    Indicators:
    - RSI (14): ${technicals.rsi || 52}
    - MACD: Line=${technicals.macdLine || 0.4}, Signal=${technicals.macdSignal || 0.2}
    - EMA (20): ₹${technicals.ema20 || currentPrice * 0.98}
    - SMA (50): ₹${technicals.sma50 || currentPrice * 0.96}
    - Bollinger Bands: Upper=₹${technicals.bbUpper || currentPrice * 1.05}, Lower=₹${technicals.bbLower || currentPrice * 0.95}

    Predict the price range and direction for "Tomorrow" and a "7-Day Forecast".
    Provide response STRICTLY as a JSON object matching this structure:
    {
      "predictedPriceRange": {
        "tomorrowMin": number,
        "tomorrowMax": number,
        "sevenDayMin": number,
        "sevenDayMax": number
      },
      "bullishProbability": number (percentage 0-100),
      "bearishProbability": number (percentage 0-100),
      "trendPrediction": "Bullish" | "Bearish" | "Neutral",
      "confidenceScore": number (percentage 0-100),
      "analysisSummary": "Detailed string explaining the reasoning behind indicators and predicted ranges."
    }
    Do not add extra explanation, markdown headers, or surrounding text outside of the raw JSON object.
    `

    const result = await model.generateContent(prompt)
    const text = result.response.text()
    
    // Parse response text as JSON
    return JSON.parse(text)
  } catch (err) {
    console.error('Gemini Forecast Error:', err)
    return getMockForecast(symbol, currentPrice)
  }
}

// 3. News Sentiment Analysis and Summarization
export const getNewsSentimentAndSummary = async (title, summaryText) => {
  if (!genAI) {
    // Mock news sentiment fallback
    const sentiments = ['Positive', 'Neutral', 'Negative']
    const randomSentiment = sentiments[Math.floor(Math.random() * sentiments.length)]
    return {
      sentiment: randomSentiment,
      summary: summaryText ? `${summaryText.slice(0, 150)}...` : "Market update summary not available."
    }
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: 'application/json' }
    })

    const prompt = `Analyze the sentiment of this financial news article.
    Title: "${title}"
    Summary snippet: "${summaryText || 'N/A'}"

    Determine the sentiment and write a concise 1-2 sentence AI summary of this news article.
    Provide response STRICTLY as a JSON object with this format:
    {
      "sentiment": "Positive" | "Neutral" | "Negative",
      "summary": "Concise summary sentence(s)"
    }
    `

    const result = await model.generateContent(prompt)
    const text = result.response.text()
    return JSON.parse(text)
  } catch (err) {
    console.error('Gemini News Analysis Error:', err)
    return {
      sentiment: 'Neutral',
      summary: summaryText ? `${summaryText.slice(0, 120)}...` : "Market updates summarized."
    }
  }
}

// Fallback Mock Forecast Generator
function getMockForecast(symbol, price) {
  const isBullish = Math.random() > 0.4
  const trend = isBullish ? 'Bullish' : 'Bearish'
  const confidence = Math.floor(Math.random() * 25) + 60 // 60-85%
  const bullishProb = isBullish ? confidence : 100 - confidence
  const bearishProb = 100 - bullishProb
  const variation = price * 0.03

  return {
    predictedPriceRange: {
      tomorrowMin: parseFloat((price - (isBullish ? variation * 0.2 : variation * 0.8)).toFixed(2)),
      tomorrowMax: parseFloat((price + (isBullish ? variation * 0.8 : variation * 0.2)).toFixed(2)),
      sevenDayMin: parseFloat((price - (isBullish ? variation * 0.5 : variation * 1.5)).toFixed(2)),
      sevenDayMax: parseFloat((price + (isBullish ? variation * 1.5 : variation * 0.5)).toFixed(2))
    },
    bullishProbability: bullishProb,
    bearishProbability: bearishProb,
    trendPrediction: trend,
    confidenceScore: confidence,
    analysisSummary: `Technical indicators for ${symbol} reflect a short-term ${trend.toLowerCase()} trend. The 14-day RSI stands around 54, indicating steady momentum. EMA(20) is tracking slightly above the 50-day moving average, suggesting minor support at current levels. Range forecasts suggest trading consolidation before any breakout.`
  }
}
