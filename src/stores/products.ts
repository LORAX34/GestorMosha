import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import type { Product } from '../types'

export const useProductsStore = defineStore('products', () => {
  const products = ref<Product[]>([])
  const loading = ref(false)

  async function fetch() {
    loading.value = true
    const { data } = await supabase.from('products').select('*').order('name')
    if (data) products.value = data
    loading.value = false
  }

  async function getById(id: string) {
    const { data } = await supabase.from('products').select('*').eq('id', id).single()
    return data
  }

  async function create(product: Omit<Product, 'id' | 'created_at'>) {
    const { data, error } = await supabase.from('products').insert(product).select().single()
    if (error) throw error
    products.value.push(data)
    return data
  }

  async function update(id: string, product: Partial<Omit<Product, 'id' | 'created_at'>>) {
    const { data, error } = await supabase.from('products').update(product).eq('id', id).select().single()
    if (error) throw error
    const idx = products.value.findIndex(p => p.id === id)
    if (idx !== -1) products.value[idx] = data
    return data
  }

  async function remove(id: string) {
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) throw error
    products.value = products.value.filter(p => p.id !== id)
  }

  async function removeBatch(ids: string[]) {
    const { error } = await supabase.from('products').delete().in('id', ids)
    if (error) throw error
    products.value = products.value.filter(p => !ids.includes(p.id))
  }

  return { products, loading, fetch, getById, create, update, remove, removeBatch }
})
