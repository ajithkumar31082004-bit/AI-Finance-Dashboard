import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseAnonKey) {
  console.warn('Warning: VITE_SUPABASE_ANON_KEY is not defined. Some database operations may fail.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
