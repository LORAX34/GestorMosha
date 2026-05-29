import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types'
import type { SupabaseClient } from '@supabase/supabase-js'

let _supabase: SupabaseClient<Database> | null = null

function getSupabase() {
  if (!_supabase) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

    console.log('Supabase URL:', supabaseUrl)
    console.log('Supabase Key:', supabaseAnonKey ? '****' : 'no key')

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Faltan variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY')
    }

    _supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: {
          getItem(key: string) {
            try { return localStorage.getItem(key) } catch { return null }
          },
          setItem(key: string, value: string) {
            try { localStorage.setItem(key, value) } catch {}
          },
          removeItem(key: string) {
            try { localStorage.removeItem(key) } catch {}
          },
        },
        storageKey: 'gestion-auth-token',
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  }
  return _supabase
}

export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_, prop) {
    return (getSupabase() as any)[prop]
  },
})
