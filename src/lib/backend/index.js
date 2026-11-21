import { localBackend } from './local'
import { supabaseBackend, supabaseConfigured } from './supabase'

export const backend = supabaseConfigured ? supabaseBackend : localBackend
