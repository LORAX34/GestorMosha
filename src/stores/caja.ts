import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import type { CajaSession, CajaMovement } from '../types'

export const useCajaStore = defineStore('caja', () => {
  const currentSession = ref<CajaSession | null>(null)
  const movements = ref<CajaMovement[]>([])
  const history = ref<CajaSession[]>([])
  const loading = ref(false)

  async function fetchCurrentSession() {
    const { data } = await supabase
      .from('caja_sessions')
      .select('*')
      .eq('status', 'open')
      .order('opened_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    currentSession.value = data
    return data
  }

  async function open(initialCash: number, employeeId: string) {
    const { data, error } = await supabase
      .from('caja_sessions')
      .insert({ employee_open_id: employeeId, initial_cash: initialCash })
      .select()
      .single()
    if (error) throw error
    currentSession.value = data
    return data
  }

  async function close(sessionId: string, actualCash: number, employeeId: string, notes?: string) {
    const session = currentSession.value
    if (!session) throw new Error('No hay sesión abierta')

    const { data: cashSales, error: salesError } = await supabase
      .from('sales')
      .select('total')
      .eq('payment_method', 'cash')
      .gte('created_at', session.opened_at)
    if (salesError) throw salesError

    const totalCashSales = (cashSales || []).reduce((sum, s) => sum + Number(s.total), 0)

    const { data: movs, error: movError } = await supabase
      .from('caja_movements')
      .select('type, amount')
      .eq('session_id', sessionId)
    if (movError) throw movError

    const totalIn = (movs || []).filter(m => m.type === 'in').reduce((s, m) => s + Number(m.amount), 0)
    const totalOut = (movs || []).filter(m => m.type === 'out').reduce((s, m) => s + Number(m.amount), 0)

    const expectedCash = Number(session.initial_cash) + totalCashSales + totalIn - totalOut
    const difference = actualCash - expectedCash

    const { data, error } = await supabase
      .from('caja_sessions')
      .update({
        employee_close_id: employeeId,
        closed_at: new Date().toISOString(),
        expected_cash: expectedCash,
        actual_cash: actualCash,
        difference,
        status: 'closed',
        notes: notes || null,
      })
      .eq('id', sessionId)
      .select()
      .single()
    if (error) throw error

    currentSession.value = null
    return { ...data, expectedCash, totalCashSales, totalIn, totalOut, difference }
  }

  async function fetchMovements(sessionId: string) {
    loading.value = true
    const { data } = await supabase
      .from('caja_movements')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
    if (data) movements.value = data
    loading.value = false
  }

  async function addMovement(sessionId: string, type: 'in' | 'out', concept: string, amount: number, employeeId: string) {
    const { data, error } = await supabase
      .from('caja_movements')
      .insert({ session_id: sessionId, type, concept, amount, employee_id: employeeId })
      .select()
      .single()
    if (error) throw error
    movements.value.unshift(data)
    return data
  }

  async function deleteMovement(id: string) {
    const { error } = await supabase.from('caja_movements').delete().eq('id', id)
    if (error) throw error
    movements.value = movements.value.filter(m => m.id !== id)
  }

  async function fetchHistory() {
    loading.value = true
    const { data } = await supabase
      .from('caja_sessions')
      .select('*')
      .eq('status', 'closed')
      .order('closed_at', { ascending: false })
    if (data) history.value = data
    loading.value = false
  }

  return {
    currentSession, movements, history, loading,
    fetchCurrentSession, open, close,
    fetchMovements, addMovement, deleteMovement, fetchHistory,
  }
})
