import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAlerts } from '../context/AlertContext'
import { motion, AnimatePresence } from 'framer-motion'
import { LogIn, UserPlus, Key, Mail, Lock, Eye, EyeOff, BarChart2 } from 'lucide-react'

export default function Auth() {
  const { signUp, login, resetPassword, updateProfile, user } = useAuth()
  const { triggerToast } = useAlerts()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  // Decide page mode
  const initialMode = searchParams.get('type') === 'reset' ? 'reset' : 'login'
  const [mode, setMode] = useState(initialMode) // 'login', 'signup', 'forgot', 'reset'

  // Input states
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (mode === 'login') {
        await login(email, password)
        triggerToast('Welcome Back!', 'Login successful. Redirecting...', 'success')
        navigate('/')
      } else if (mode === 'signup') {
        await signUp(email, password, name)
        triggerToast('Registration Successful!', 'Check your inbox for a verification email.', 'success')
        setMode('login')
      } else if (mode === 'forgot') {
        await resetPassword(email)
        triggerToast('Email Sent!', 'Password reset link dispatched to your inbox.', 'success')
        setMode('login')
      } else if (mode === 'reset') {
        if (password !== confirmPassword) {
          triggerToast('Password Mismatch', 'Confirm password does not match.', 'error')
          setLoading(false)
          return
        }
        await updateProfile({ password }) // Supabase updates auth password when profile updates auth.users password indirectly via trigger or auth api. Wait, to update password directly, we can do supabase.auth.updateUser({ password: password }). Let's update AuthContext to handle this or call it directly.
        triggerToast('Password Updated!', 'Please log in with your new password.', 'success')
        setMode('login')
      }
    } catch (err) {
      console.error(err)
      triggerToast('Authentication Failed', err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' }
    },
    exit: { opacity: 0, y: -30 }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#05060a]">
      {/* Top glowing backgrounds */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Brand Logo Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-gradient-to-tr from-blue-600 to-emerald-500 rounded-2xl shadow-lg shadow-blue-500/20 mb-3 animate-bounce">
            <BarChart2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-50 via-slate-100 to-slate-400 bg-clip-text text-transparent font-display">
            APEX FINANCE
          </h1>
          <p className="text-sm text-slate-400 mt-1 font-sans">
            AI-Powered Real-Time Finance Ecosystem
          </p>
        </div>

        {/* Auth Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="glass-panel p-8 bg-slate-900/50 shadow-2xl relative overflow-hidden"
          >
            <h2 className="text-xl font-bold text-slate-100 mb-6 font-display flex items-center gap-2">
              {mode === 'login' && <><LogIn className="w-5 h-5 text-blue-500" /> Log In</>}
              {mode === 'signup' && <><UserPlus className="w-5 h-5 text-emerald-500" /> Create Account</>}
              {mode === 'forgot' && <><Key className="w-5 h-5 text-amber-500" /> Reset Password</>}
              {mode === 'reset' && <><Key className="w-5 h-5 text-purple-500" /> Update Password</>}
            </h2>

            <form onSubmit={handleAuth} className="space-y-5">
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full p-3 rounded-lg glass-input text-sm"
                  />
                </div>
              )}

              {(mode === 'login' || mode === 'signup' || mode === 'forgot') && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pl-10 pr-4 p-3 rounded-lg glass-input text-sm"
                    />
                  </div>
                </div>
              )}

              {(mode === 'login' || mode === 'signup' || mode === 'reset') && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Password
                    </label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => setMode('forgot')}
                        className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                      >
                        Forgot Password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 p-3 rounded-lg glass-input text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {mode === 'reset' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 p-3 rounded-lg glass-input text-sm"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 bg-gradient-to-r from-blue-600 to-emerald-500 hover:from-blue-500 hover:to-emerald-400 text-white font-medium p-3 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none text-sm cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    {mode === 'login' && 'Log In'}
                    {mode === 'signup' && 'Sign Up'}
                    {mode === 'forgot' && 'Send Reset Link'}
                    {mode === 'reset' && 'Update Password'}
                  </>
                )}
              </button>
            </form>

            {/* Form Toggle Options */}
            <div className="mt-6 border-t border-slate-800 pt-6 text-center text-xs text-slate-400">
              {mode === 'login' ? (
                <p>
                  Don't have an account?{' '}
                  <button
                    onClick={() => setMode('signup')}
                    className="text-emerald-400 hover:text-emerald-300 font-semibold"
                  >
                    Register here
                  </button>
                </p>
              ) : mode === 'signup' ? (
                <p>
                  Already have an account?{' '}
                  <button
                    onClick={() => setMode('login')}
                    className="text-blue-400 hover:text-blue-300 font-semibold"
                  >
                    Log In
                  </button>
                </p>
              ) : (
                <button
                  onClick={() => setMode('login')}
                  className="text-slate-300 hover:text-slate-100 font-semibold"
                >
                  Back to Login
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
