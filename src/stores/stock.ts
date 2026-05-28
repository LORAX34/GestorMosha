import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import type { StockMovement } from '../types'

export const useStockStore = defineStore('stock', () => {
  const movements = ref<StockMovement[]>([])
  const loading = ref(false)

  async function fetch() {
    loading.value = true
    const { data } = await supabase.from('stock_movements').select('*').order('created_at', { ascending: false })
    if (data) movements.value = data
    loading.value = false
  }

  async function stockIn(productId: string, quantity: number, notes?: string, employeeId?: string) {
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('stock')
      .eq('id', productId)
      .single()
    if (productError) throw productError

    const newStock = (product?.stock || 0) + quantity

    const { error: updateError } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', productId)
    if (updateError) throw updateError

    const { error: movementError } = await supabase
      .from('stock_movements')
      .insert({
        product_id: productId,
        quantity,
        type: 'in',
        notes: notes || null,
        employee_id: employeeId,
      })
    if (movementError) throw movementError
  }

  async function getAlerts() {
    const { data } = await supabase
      .from('products')
      .select('*')
      .gt('min_stock', 0)
      .lt('stock', supabase.raw('min_stock'))
    return data || []
  }

  return { movements, loading, fetch, stockIn, getAlerts }
})
