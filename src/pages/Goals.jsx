import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useAlerts } from '../context/AlertContext'
import { supabase } from '../services/supabase'
import { Target, Calendar, Plus, Trash2, Award, CalendarRange } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Goals() {
  const { user } = useAuth()
  const { triggerToast } = useAlerts()
  
  // Goals state
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)

  // Add goal form states
  const [name, setName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [currentAmount, setCurrentAmount] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [adding, setAdding] = useState(false)

  const fetchGoals = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setGoals(data || [])
    } catch (err) {
      console.error(err)
      triggerToast('Query Failed', 'Failed to retrieve goals data.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGoals()
  }, [user])

  const handleAddGoal = async (e) => {
    e.preventDefault()
    if (!user) return
    if (!name || !targetAmount || !targetDate) {
      triggerToast('Validation Error', 'Please complete all required fields.', 'warning')
      return
    }

    setAdding(true)
    try {
      const { error } = await supabase.from('goals').insert({
        user_id: user.id,
        name,
        target_amount: parseFloat(targetAmount),
        current_amount: parseFloat(currentAmount) || 0,
        target_date: new Date(targetDate).toISOString()
      })

      if (error) throw error
      triggerToast('Goal Added', `Financial target for "${name}" created!`, 'success')
      
      // Reset form
      setName('')
      setTargetAmount('')
      setCurrentAmount('')
      setTargetDate('')
      fetchGoals()
    } catch (err) {
      console.error(err)
      triggerToast('Error Adding Goal', err.message, 'error')
    } finally {
      setAdding(false)
    }
  }

  const handleDeleteGoal = async (id, goalName) => {
    try {
      const { error } = await supabase.from('goals').delete().eq('id', id)
      if (error) throw error
      triggerToast('Goal Deleted', `"${goalName}" goal has been removed.`, 'info')
      fetchGoals()
    } catch (err) {
      triggerToast('Deletion Failed', err.message, 'error')
    }
  }

  // AI Completion Date and Progress Helpers
  const calculateEstimatedCompletion = (goal) => {
    const target = parseFloat(goal.target_amount)
    const current = parseFloat(goal.current_amount)
    const timeRemaining = new Date(goal.target_date).getTime() - Date.now()
    
    if (current >= target) return 'Completed! 🎉'
    if (current <= 0) return 'Needs Initial Funding'

    // Mock an AI estimation based on average return rates (e.g. 12% p.a. standard mutual fund returns)
    // Monthly savings required or projection
    const monthlyReturn = 0.01 // 1% per month
    const gap = target - current
    const monthsNeeded = Math.ceil(gap / (current * 0.05 + 1000)) // Simple mock calculation: assuming 5% monthly add + compounding
    
    const estDate = new Date()
    estDate.setMonth(estDate.getMonth() + monthsNeeded)
    return estDate.toLocaleDateString([], { year: 'numeric', month: 'long' })
  }

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(val || 0)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight font-display flex items-center gap-2">
          <Target className="w-8 h-8 text-emerald-400" /> Goal-Based Investing
        </h1>
        <p className="text-xs text-slate-400 mt-1">Define customized financial goals, map target bounds, and audit projection completion timelines.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: List of Goals */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="space-y-3 py-6 animate-pulse">
              <div className="h-28 bg-slate-800 rounded-xl" />
              <div className="h-28 bg-slate-800 rounded-xl" />
            </div>
          ) : goals.length === 0 ? (
            <div className="text-center py-16 glass-panel border border-dashed border-slate-850">
              <Target className="w-8 h-8 text-slate-650 mx-auto mb-2.5" />
              <p className="text-sm text-slate-400 font-medium">No financial goals defined yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {goals.map((goal) => {
                const percent = Math.min(100, (goal.current_amount / goal.target_amount) * 100)
                
                return (
                  <motion.div
                    key={goal.id}
                    layout
                    className="glass-panel p-5 bg-[#0b0f19]/30 hover:bg-[#0b0f19]/50 border border-slate-850 flex flex-col gap-4 relative overflow-hidden"
                  >
                    {/* Upper details */}
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h3 className="text-sm font-bold text-slate-150 font-display">{goal.name}</h3>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold mt-1">
                          <CalendarRange className="w-3.5 h-3.5" />
                          <span>Target: {new Date(goal.target_date).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteGoal(goal.id, goal.name)}
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Delete goal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Progress slider bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-semibold">{formatCurrency(goal.current_amount)} saved</span>
                        <span className="text-[10px] text-slate-500">Target: {formatCurrency(goal.target_amount)}</span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-900 flex">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 transition-all duration-500" 
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                        <span>Progress: {percent.toFixed(1)}%</span>
                        <span className="text-teal-400">AI Completion: {calculateEstimatedCompletion(goal)}</span>
                      </div>
                    </div>

                  </motion.div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right Column: Goal Creation Form */}
        <div className="glass-panel p-5 h-fit">
          <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider border-b border-slate-850 pb-3 mb-4">
            Create Financial Goal
          </h3>

          <form onSubmit={handleAddGoal} className="space-y-4">
            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Goal Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Retirement Portfolio"
                className="w-full p-2.5 rounded-lg glass-input text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Target Amount (INR)
              </label>
              <input
                type="number"
                required
                min="100"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="e.g. 500000"
                className="w-full p-2.5 rounded-lg glass-input text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Current Savings (INR)
              </label>
              <input
                type="number"
                min="0"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                placeholder="e.g. 15000"
                className="w-full p-2.5 rounded-lg glass-input text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Target Accomplishment Date
              </label>
              <input
                type="date"
                required
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full p-2.5 rounded-lg glass-input text-xs font-semibold text-slate-350"
              />
            </div>

            <button
              type="submit"
              disabled={adding}
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-emerald-500 hover:from-blue-500 hover:to-emerald-400 text-white font-bold text-xs rounded-lg shadow-lg active:scale-[0.98] transition-all cursor-pointer disabled:opacity-55"
            >
              {adding ? 'Creating Goal...' : 'Add Investment Goal'}
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}
