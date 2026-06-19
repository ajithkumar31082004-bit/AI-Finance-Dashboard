import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AlertProvider } from './context/AlertContext'
import Layout from './components/Layout'

// Pages
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

// Route protection component
function PrivateRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#05060a] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return user ? <Layout>{children}</Layout> : <Navigate to="/auth" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AlertProvider>
          <Routes>
            {/* Auth Page */}
            <Route path="/auth" element={<Auth />} />

            {/* Protected Dashboard Shell Routes */}
            <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/watchlist" element={<PrivateRoute><Watchlist /></PrivateRoute>} />
            <Route path="/screener" element={<PrivateRoute><Screener /></PrivateRoute>} />
            <Route path="/paper-trading" element={<PrivateRoute><PaperTrading /></PrivateRoute>} />
            <Route path="/heatmap" element={<PrivateRoute><Heatmap /></PrivateRoute>} />
            <Route path="/forecast" element={<PrivateRoute><Forecast /></PrivateRoute>} />
            <Route path="/news" element={<PrivateRoute><News /></PrivateRoute>} />
            <Route path="/goals" element={<PrivateRoute><Goals /></PrivateRoute>} />
            <Route path="/risk" element={<PrivateRoute><Risk /></PrivateRoute>} />
            <Route path="/ipo" element={<PrivateRoute><Ipo /></PrivateRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AlertProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
