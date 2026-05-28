<script setup lang="ts">
import { ref } from 'vue'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/auth'
import { Search, PackagePlus, Loader2 } from 'lucide-vue-next'

const auth = useAuthStore()
const searchQuery = ref('')
const product = ref<any>(null)
const loading = ref(false)
const message = ref<{ type: string; text: string } | null>(null)
const quantity = ref(0)
const notes = ref('')

async function handleSearch() {
  if (!searchQuery.value.trim()) return
  product.value = null
  message.value = null
  const q = searchQuery.value.toLowerCase()
  const { data } = await supabase.from('products')
    .select('*')
    .or(`name.ilike.%${q}%,barcode.ilike.%${q}%`)
    .limit(1)
  if (data?.length) {
    product.value = data[0]
  } else {
    message.value = { type: 'error', text: 'Producto no encontrado' }
  }
}

async function handleReceive() {
  if (!product.value || !quantity.value || quantity.value <= 0) return
  loading.value = true
  message.value = null
  try {
    const { error } = await supabase.rpc('stock_in', {
      p_product_id: product.value.id,
      p_quantity: quantity.value,
      p_notes: notes.value || null,
      p_employee_id: auth.employee?.id,
    })
    if (error) throw error

    message.value = { type: 'success', text: `Entrada de ${quantity.value} unidades registrada` }
    product.value = null
    searchQuery.value = ''
    quantity.value = 0
    notes.value = ''
  } catch (e: any) {
    message.value = { type: 'error', text: e.message || 'Error al registrar' }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-lg mx-auto">
    <h2 class="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Recibir Productos</h2>

    <form @submit.prevent="handleSearch" class="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
      <div class="flex gap-2">
        <div class="relative flex-1">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input v-model="searchQuery" class="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="Código o nombre..." />
        </div>
        <button type="submit"
          class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
          <Search class="w-4 h-4" /> Buscar
        </button>
      </div>
    </form>

    <div v-if="product" class="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 space-y-4">
      <div>
        <h3 class="font-semibold text-gray-900">{{ product.name }}</h3>
        <p class="text-sm text-gray-500">Stock actual: {{ product.stock }}</p>
      </div>
      <form @submit.prevent="handleReceive" class="space-y-3">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Cantidad a recibir *</label>
          <input v-model.number="quantity" type="number" step="1" min="1" required
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Notas</label>
          <input v-model="notes" placeholder="Opcional..."
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
        </div>
        <button type="submit" :disabled="loading"
          class="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
          <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
          <PackagePlus v-else class="w-4 h-4" />
          {{ loading ? 'Registrando...' : 'Registrar entrada' }}
        </button>
      </form>
    </div>

    <div v-if="message"
      class="p-4 rounded-xl text-sm border"
      :class="message.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'">
      {{ message.text }}
    </div>
  </div>
</template>
