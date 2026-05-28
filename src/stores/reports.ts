import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../lib/supabase'

export const useReportsStore = defineStore('reports', () => {
  const loading = ref(false)

  async function getDaily(date: string) {
    loading.value = true
    const { data } = await supabase
      .from('sales')
      .select('*, sale_items(*)')
      .gte('created_at', `${date}T00:00:00`)
      .lte('created_at', `${date}T23:59:59`)
      .order('created_at', { ascending: false })
    loading.value = false
    return data || []
  }

  async function getMonthly(year: number, month: number) {
    loading.value = true
    const start = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    const { data } = await supabase
      .from('sales')
      .select('*')
      .gte('created_at', `${start}T00:00:00`)
      .lte('created_at', `${end}T23:59:59`)
      .order('created_at', { ascending: false })
    loading.value = false
    return data || []
  }

  return { loading, getDaily, getMonthly }
})
