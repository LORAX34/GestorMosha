import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'
import type { Employee } from '../types'

export const useAuthStore = defineStore('auth', () => {
  const employee = ref<Employee | null>(null)
  const loading = ref(false)

  const isAuthenticated = computed(() => !!employee.value)

  async function login(email: string, password: string) {
    loading.value = true
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (authError) throw authError

      const { data: emp, error: empError } = await supabase
        .from('employees')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      if (empError) throw empError
      employee.value = emp
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    employee.value = null
  }

  async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      const { data: emp } = await supabase
        .from('employees')
        .select('*')
        .eq('id', session.user.id)
        .single()
      if (emp) employee.value = emp
    }
  }

  return { employee, loading, isAuthenticated, login, logout, checkSession }
})
