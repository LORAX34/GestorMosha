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
      if (!authData.user) throw new Error('Error al iniciar sesión')

      const { data: emp, error: empError } = await supabase
        .from('employees')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle()

      if (empError) {
        throw new Error(`Error BD: ${empError.code} ${empError.message}`)
      }
      if (!emp) {
        throw new Error('Tu usuario no tiene perfil de empleado')
      }
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
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data: emp } = await supabase
          .from('employees')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle()
        if (emp) employee.value = emp
      }
    } catch {
      employee.value = null
    }
  }

  return { employee, loading, isAuthenticated, login, logout, checkSession }
})
