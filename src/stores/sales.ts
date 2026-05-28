import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import type { Sale, SaleItem } from '../types'

export const useSalesStore = defineStore('sales', () => {
  const sales = ref<Sale[]>([])
  const loading = ref(false)

  async function fetch() {
    loading.value = true
    const { data } = await supabase.from('sales').select('*').order('created_at', { ascending: false })
    if (data) sales.value = data
    loading.value = false
  }

  async function getById(id: string) {
    const { data: sale } = await supabase.from('sales').select('*').eq('id', id).single()
    if (!sale) return null
    const { data: items } = await supabase.from('sale_items').select('*').eq('sale_id', id)
    return { ...sale, items: items || [] }
  }

  async function create(sale: Omit<Sale, 'id' | 'created_at'>, items: Omit<SaleItem, 'id'>[]) {
    const { data: saleData, error: saleError } = await supabase
      .from('sales')
      .insert(sale)
      .select()
      .single()
    if (saleError) throw saleError

    const saleItems = items.map(item => ({ ...item, sale_id: saleData.id }))
    const { error: itemsError } = await supabase.from('sale_items').insert(saleItems)
    if (itemsError) throw itemsError

    return saleData
  }

  async function getByDate(date: string) {
    const { data } = await supabase
      .from('sales')
      .select('*')
      .gte('created_at', `${date}T00:00:00`)
      .lte('created_at', `${date}T23:59:59`)
      .order('created_at', { ascending: false })
    return data || []
  }

  return { sales, loading, fetch, getById, create, getByDate }
})
