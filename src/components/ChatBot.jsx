import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, X, Send, BarChart2, User, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getChatbotResponse } from '../services/gemini'
import { supabase } from '../services/supabase'

export default function ChatBot({ onClose }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hello! I am Apex AI, your context-aware financial assistant. Ask me to analyze your portfolio, explain stock metrics, or search market trends!',
      time: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [portfolio, setPortfolio] = useState([])
  const messagesEndRef = useRef(null)

  // Fetch portfolio context
  useEffect(() => {
    if (user) {
      const getPortfolioContext = async () => {
        const { data } = await supabase
          .from('portfolio')
          .select('*')
          .eq('user_id', user.id)
        if (data) setPortfolio(data)
      }
      getPortfolioContext()
    }
  }, [user])

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading])

  // Quick Action Prompts
  const quickActions = [
    'Analyze my portfolio',
    'Explain RSI',
    'Compare TCS and Infosys',
    'Suggest diversification',
    'Why is Reliance falling today?'
  ]

  const handleSend = async (textToSend) => {
    const text = textToSend || input
    if (!text.trim()) return

    if (!textToSend) setInput('')

    // Append user message
    const userMsg = {
      id: Math.random().toString(36).substr(2, 9),
      role: 'user',
      text,
      time: new Date()
    }
    setMessages((prev) => [...prev, userMsg])
    setLoading(true)

    try {
      // Map message history to send to Gemini
      const history = messages.map((m) => ({
        role: m.role,
        text: m.text
      }))

      const aiReply = await getChatbotResponse(text, history, portfolio)
      
      const assistantMsg = {
        id: Math.random().toString(36).substr(2, 9),
        role: 'assistant',
        text: aiReply,
        time: new Date()
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 100, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 100, scale: 0.9 }}
      className="fixed bottom-24 left-6 z-40 w-80 md:w-96 h-[500px] flex flex-col bg-slate-950/95 border border-slate-800/80 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl"
    >
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-blue-900/40 via-purple-900/30 to-slate-900/40 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-500/10 rounded-lg">
            <Sparkles className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 font-display">Apex Financial AI</h3>
            <p className="text-[10px] text-slate-400 font-medium">Context-Aware Advisory</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-850 rounded-lg cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Message Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user'
          return (
            <div
              key={msg.id}
              className={`flex gap-2.5 items-start max-w-[85%] ${
                isUser ? 'ml-auto flex-row-reverse' : ''
              }`}
            >
              <div
                className={`p-1.5 rounded-full border text-xs ${
                  isUser
                    ? 'bg-blue-600/10 border-blue-500/30 text-blue-400'
                    : 'bg-slate-850 border-slate-700 text-slate-350'
                }`}
              >
                {isUser ? <User className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
              </div>
              <div
                className={`p-3 rounded-2xl text-xs leading-relaxed ${
                  isUser
                    ? 'bg-blue-600/20 text-blue-100 rounded-tr-none border border-blue-600/10'
                    : 'bg-slate-900/60 text-slate-250 rounded-tl-none border border-slate-800/80'
                }`}
              >
                {/* Parse Markdown Linebreaks/Bullet lists simply */}
                <p className="whitespace-pre-line">{msg.text}</p>
                <span className="text-[8px] text-slate-500 block mt-1 text-right">
                  {msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          )
        })}

        {loading && (
          <div className="flex gap-2.5 items-start">
            <div className="p-1.5 rounded-full border bg-slate-850 border-slate-700 text-slate-350">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
            </div>
            <div className="p-3 bg-slate-900/60 rounded-2xl rounded-tl-none border border-slate-800/80 w-24">
              <div className="flex gap-1 justify-center py-1">
                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Actions */}
      {messages.length === 1 && (
        <div className="px-4 pb-2">
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Suggested Prompts</p>
          <div className="flex flex-wrap gap-1.5">
            {quickActions.map((act) => (
              <button
                key={act}
                onClick={() => handleSend(act)}
                className="text-[10px] px-2.5 py-1 bg-slate-900 hover:bg-slate-800/80 text-slate-300 hover:text-slate-100 rounded-lg border border-slate-850 cursor-pointer active:scale-95 transition-all"
              >
                {act}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <div className="p-3 bg-slate-900/40 border-t border-slate-800 flex gap-2 items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask AI finance advisor..."
          className="flex-1 px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs glass-input focus:border-blue-500 focus:outline-none"
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim()}
          className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  )
}
