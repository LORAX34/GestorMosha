import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY')
}

let storage: { getItem(k: string): string | null; setItem(k: string, v: string): void; removeItem(k: string): void }

try {
  localStorage.getItem('_test')
  storage = localStorage
} catch {
  const store: Record<string, string> = {}
  storage = {
    getItem: (k) => store[k] ?? null,
    setItem: (k, v) => { store[k] = String(v) },
    removeItem: (k) => { delete store[k] },
  }
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage,
    storageKey: 'gestion-auth-token',
    autoRefreshToken: false,
    persistSession: true,
    detectSessionInUrl: false,
    lock: (_name: string, _acquireTimeout: number, fn: () => Promise<any>) => fn(),
  },
})
