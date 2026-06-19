import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AlertProvider } from './context/AlertContext'
import { ThemeProvider } from './context/ThemeContext'
import Layout from './components/Layout'

// Original Pages
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Watchlist from './pages/Watchlist'
import Screener from './pages/Screener'
import PaperTrading from './pages/PaperTrading'
import Heatmap from './pages/Heatmap'
import Forecast from './pages/Forecast'
import News from './pages/News'
import Goals from './pages/Goals'
import Risk from './pages/Risk'
import Ipo from './pages/Ipo'

// New Feature Pages
import EarningsCalendar from './pages/EarningsCalendar'
import Compare from './pages/Compare'
import SipCalculator from './pages/SipCalculator'
import Crypto from './pages/Crypto'
import PatternScanner from './pages/PatternScanner'
import TaxCalculator from './pages/TaxCalculator'
import Rebalancing from './pages/Rebalancing'

// Route protection component
function PrivateRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return user ? <Layout>{children}</Layout> : <Navigate to="/auth" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AlertProvider>
            <Routes>
              {/* Auth Page */}
              <Route path="/auth" element={<Auth />} />

              {/* Core Dashboard Routes */}
              <Route path="/"               element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/watchlist"      element={<PrivateRoute><Watchlist /></PrivateRoute>} />
              <Route path="/screener"       element={<PrivateRoute><Screener /></PrivateRoute>} />
              <Route path="/paper-trading"  element={<PrivateRoute><PaperTrading /></PrivateRoute>} />
              <Route path="/heatmap"        element={<PrivateRoute><Heatmap /></PrivateRoute>} />
              <Route path="/forecast"       element={<PrivateRoute><Forecast /></PrivateRoute>} />
              <Route path="/news"           element={<PrivateRoute><News /></PrivateRoute>} />
              <Route path="/goals"          element={<PrivateRoute><Goals /></PrivateRoute>} />
              <Route path="/risk"           element={<PrivateRoute><Risk /></PrivateRoute>} />
              <Route path="/ipo"            element={<PrivateRoute><Ipo /></PrivateRoute>} />

              {/* New Premium Feature Routes */}
              <Route path="/calendar"       element={<PrivateRoute><EarningsCalendar /></PrivateRoute>} />
              <Route path="/compare"        element={<PrivateRoute><Compare /></PrivateRoute>} />
              <Route path="/sip"            element={<PrivateRoute><SipCalculator /></PrivateRoute>} />
              <Route path="/crypto"         element={<PrivateRoute><Crypto /></PrivateRoute>} />
              <Route path="/patterns"       element={<PrivateRoute><PatternScanner /></PrivateRoute>} />
              <Route path="/tax"            element={<PrivateRoute><TaxCalculator /></PrivateRoute>} />
              <Route path="/rebalance"      element={<PrivateRoute><Rebalancing /></PrivateRoute>} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AlertProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
