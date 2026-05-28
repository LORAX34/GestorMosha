<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/auth'
import { useProductsStore } from '../../stores/products'
import { AlertTriangle, Loader2 } from 'lucide-vue-next'

const auth = useAuthStore()
const productStore = useProductsStore()

const loading = ref(false)
const message = ref<{ type: string; text: string } | null>(null)
const damagedList = ref<any[]>([])

const form = ref({ product_id: '', quantity: 0, reason: '' })

onMounted(async () => {
  await productStore.fetch()
  await fetchDamaged()
})

async function fetchDamaged() {
  const { data } = await supabase.from('damaged_products')
    .select('*, products(name)')
    .order('created_at', { ascending: false })
  if (data) {
    damagedList.value = data.map(d => ({
      ...d,
      product_name: (d as any).products?.name || '—',
    }))
  }
}

async function handleRegister() {
  if (!form.value.product_id || !form.value.quantity || form.value.quantity <= 0) return
  loading.value = true
  message.value = null
  try {
    const { error } = await supabase.rpc('register_damaged', {
      p_product_id: form.value.product_id,
      p_quantity: form.value.quantity,
      p_reason: form.value.reason || 'Sin especificar',
      p_employee_id: auth.employee?.id,
    })
    if (error) throw error

    message.value = { type: 'success', text: 'Pérdida registrada y stock descontado' }
    await fetchDamaged()
    await productStore.fetch()
    form.value = { product_id: '', quantity: 0, reason: '' }
  } catch (e: any) {
    message.value = { type: 'error', text: e.message || 'Error al registrar' }
  } finally {
    loading.value = false
  }
}

function formatDate(d: string) {
  return new Date(d).toLocaleString('es-ES')
}
</script>

<template>
  <div>
    <h2 class="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Productos Dañados</h2>

    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 mb-6 space-y-4">
      <form @submit.prevent="handleRegister" class="space-y-3">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Producto *</label>
          <select v-model="form.product_id" required
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
            <option value="">Seleccionar...</option>
            <option v-for="p in productStore.products" :key="p.id" :value="p.id">
              {{ p.name }} (Stock: {{ p.stock }})
            </option>
          </select>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Cantidad *</label>
            <input v-model.number="form.quantity" type="number" step="1" min="1" required
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Razón</label>
            <input v-model="form.reason" placeholder="Ej: Rotura"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
          </div>
        </div>
        <button type="submit" :disabled="loading"
          class="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">
          <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
          <AlertTriangle v-else class="w-4 h-4" />
          {{ loading ? 'Registrando...' : 'Registrar pérdida' }}
        </button>
      </form>
      <div v-if="message" class="p-3 rounded-lg text-sm"
        :class="message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'">
        {{ message.text }}
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <h3 class="text-sm font-semibold text-gray-700 px-4 sm:px-5 py-4 border-b border-gray-100">Historial</h3>
      <div v-if="damagedList.length === 0" class="text-center py-10 text-sm text-gray-500">Sin registros</div>

      <!-- Desktop table -->
      <div class="hidden sm:block overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-100">
              <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Fecha</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Producto</th>
              <th class="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Cantidad</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Razón</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="d in damagedList" :key="d.id" class="border-b border-gray-50 hover:bg-gray-50">
              <td class="px-4 py-3 text-sm text-gray-500">{{ formatDate(d.created_at) }}</td>
              <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ d.product_name }}</td>
              <td class="px-4 py-3 text-sm text-right text-red-600 font-medium">-{{ d.quantity }}</td>
              <td class="px-4 py-3 text-sm text-gray-500">{{ d.reason }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile cards -->
      <div class="sm:hidden divide-y divide-gray-100">
        <div v-for="d in damagedList" :key="d.id" class="p-4">
          <div class="flex items-center justify-between">
            <p class="text-sm font-medium text-gray-900">{{ d.product_name }}</p>
            <span class="text-sm font-bold text-red-600">-{{ d.quantity }}</span>
          </div>
          <p class="text-xs text-gray-500 mt-1">{{ d.reason }}</p>
          <p class="text-xs text-gray-400 mt-0.5">{{ formatDate(d.created_at) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
