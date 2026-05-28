import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import type { Category } from '../types'

export const useCategoriesStore = defineStore('categories', () => {
  const categories = ref<Category[]>([])
  const loading = ref(false)

  async function fetch() {
    loading.value = true
    const { data } = await supabase.from('categories').select('*').order('name')
    if (data) categories.value = data
    loading.value = false
  }

  async function create(category: { name: string; description?: string }) {
    const { data, error } = await supabase.from('categories').insert(category).select().single()
    if (error) throw error
    categories.value.push(data)
    return data
  }

  async function update(id: string, category: { name?: string; description?: string }) {
    const { data, error } = await supabase.from('categories').update(category).eq('id', id).select().single()
    if (error) throw error
    const idx = categories.value.findIndex(c => c.id === id)
    if (idx !== -1) categories.value[idx] = data
    return data
  }

  async function remove(id: string) {
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) throw error
    categories.value = categories.value.filter(c => c.id !== id)
  }

  return { categories, loading, fetch, create, update, remove }
})
