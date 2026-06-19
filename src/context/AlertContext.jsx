import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from './AuthContext'
import { Bell, TrendingUp, TrendingDown, ShieldAlert, Award } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

const AlertContext = createContext()

export const useAlerts = () => {
  const context = useContext(AlertContext)
  if (!context) {
    throw new Error('useAlerts must be used within an AlertProvider')
  }
  return context
}

export const AlertProvider = ({ children }) => {
  const { user } = useAuth()
  const [toasts, setToasts] = useState([])
  const [userAlerts, setUserAlerts] = useState([])

  // Fetch active alerts from database
  const fetchUserAlerts = async () => {
    if (!user) return
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_triggered', false)

    if (!error && data) {
      setUserAlerts(data)
    }
  }

  useEffect(() => {
    if (user) {
      fetchUserAlerts()
    } else {
      setUserAlerts([])
    }
  }, [user])

  // Display a real-time toast
  const triggerToast = (title, message, type = 'info') => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [...prev, { id, title, message, type }])
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      removeToast(id)
    }, 5000)
  }

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  // Create alert in database
  const addAlert = async (symbol, targetPrice, alertType) => {
    if (!user) return { error: 'User not authenticated' }
    const { data, error } = await supabase
      .from('alerts')
      .insert({
        user_id: user.id,
        stock_symbol: symbol.toUpperCase(),
        target_price: parseFloat(targetPrice),
        alert_type: alertType,
        is_triggered: false
      })
      .select()

    if (!error) {
      fetchUserAlerts()
    }
    return { data, error }
  }

  // Delete alert from database
  const deleteAlert = async (id) => {
    const { error } = await supabase
      .from('alerts')
      .delete()
      .eq('id', id)

    if (!error) {
      fetchUserAlerts()
    }
    return { error }
  }

  // Run checks on live prices (can be called by WebSocket or API fetch updates)
  const checkPriceAlerts = async (symbol, currentPrice) => {
    if (!user || userAlerts.length === 0) return

    const symbolAlerts = userAlerts.filter(
      (a) => a.stock_symbol.toUpperCase() === symbol.toUpperCase()
    )

    for (const alert of symbolAlerts) {
      let isHit = false
      if (alert.alert_type === 'price') {
        // Price cross alerts (simple threshold crossing check)
        isHit = currentPrice >= alert.target_price
      }

      if (isHit) {
        // Trigger Toast notification
        triggerToast(
          '🔔 Alert Triggered',
          `${symbol} has hit your target of ₹${alert.target_price} (Current: ₹${currentPrice})`,
          'warning'
        )

        // Mark as triggered in database
        await supabase
          .from('alerts')
          .update({ is_triggered: true })
          .eq('id', alert.id)

        // Filter out from local state
        setUserAlerts((prev) => prev.filter((a) => a.id !== alert.id))
      }
    }
  }

  const getAlertIcon = (type) => {
    switch (type) {
      case 'success':
        return <Award className="text-emerald-500 w-5 h-5" />
      case 'warning':
        return <Bell className="text-amber-500 w-5 h-5" />
      case 'error':
        return <ShieldAlert className="text-red-500 w-5 h-5" />
      case 'info':
      default:
        return <TrendingUp className="text-blue-500 w-5 h-5" />
    }
  }

  return (
    <AlertContext.Provider
      value={{
        toasts,
        userAlerts,
        addAlert,
        deleteAlert,
        triggerToast,
        checkPriceAlerts,
        refreshAlerts: fetchUserAlerts
      }}
    >
      {children}
      
      {/* Toast container overlay */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
              layout
              className="pointer-events-auto bg-slate-900/90 border border-slate-700/50 backdrop-blur-md p-4 rounded-xl shadow-2xl flex gap-3 items-start cursor-pointer hover:border-slate-600"
              onClick={() => removeToast(toast.id)}
            >
              <div className="mt-0.5">{getAlertIcon(toast.type)}</div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-slate-100 font-display">
                  {toast.title}
                </h4>
                <p className="text-xs text-slate-400 mt-1">{toast.message}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  removeToast(toast.id)
                }}
                className="text-slate-500 hover:text-slate-300 text-xs font-bold"
              >
                ✕
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </AlertContext.Provider>
  )
}
