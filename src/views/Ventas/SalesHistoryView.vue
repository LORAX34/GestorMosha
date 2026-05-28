<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '../../lib/supabase'
import { Search, FileText, DollarSign, Eye } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

const router = useRouter()
const sales = ref<any[]>([])
const loading = ref(false)
const search = ref('')

onMounted(async () => {
  await fetchSales()
})

async function fetchSales() {
  loading.value = true
  let query = supabase.from('sales')
    .select('*, sale_items(*)')
    .order('created_at', { ascending: false })
    .limit(50)

  if (search.value) {
    const q = search.value
    void 0
  }

  const { data } = await query
  if (data) sales.value = data
  loading.value = false
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat('es-CU', { style: 'currency', currency: 'USD' }).format(v)
}

function formatDate(d: string) {
  return new Date(d).toLocaleString('es-ES')
}

function paymentLabel(m: string) {
  const map: Record<string, string> = { cash: 'Efectivo', card: 'Tarjeta', transfer: 'Transferencia' }
  return map[m] || m
}

function viewDetail(sale: any) {
  alert(`
Venta: ${sale.id.slice(0, 8)}...
Fecha: ${formatDate(sale.created_at)}
Total: ${formatCurrency(sale.total)}
Método: ${paymentLabel(sale.payment_method)}
Items: ${sale.sale_items?.length || 0}
  `)
}
</script>

<template>
  <div>
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <h2 class="text-xl sm:text-2xl font-bold text-gray-900">Historial de Ventas</h2>
      <router-link to="/ventas/nueva"
        class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
        <DollarSign class="w-4 h-4" /> Nueva Venta
      </router-link>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div class="p-3 sm:p-4 border-b border-gray-100">
        <div class="relative max-w-xs">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input v-model="search" @input="fetchSales" placeholder="Buscar..."
            class="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
        </div>
      </div>

      <div v-if="loading" class="text-center py-10 text-sm text-gray-500">Cargando...</div>
      <div v-else-if="sales.length === 0" class="text-center py-10 text-sm text-gray-500">No hay ventas</div>

      <!-- Desktop table -->
      <div class="hidden sm:block overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-100">
              <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Fecha</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">ID</th>
              <th class="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Total</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Método</th>
              <th class="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Items</th>
              <th class="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in sales" :key="s.id" class="border-b border-gray-50 hover:bg-gray-50">
              <td class="px-4 py-3 text-sm text-gray-500">{{ formatDate(s.created_at) }}</td>
              <td class="px-4 py-3 text-xs font-mono text-gray-500">{{ s.id.slice(0, 8) }}...</td>
              <td class="px-4 py-3 text-sm font-semibold text-gray-900 text-right">{{ formatCurrency(s.total) }}</td>
              <td class="px-4 py-3 text-sm">
                <span class="px-2 py-0.5 rounded-full text-xs font-medium"
                  :class="s.payment_method === 'cash' ? 'bg-green-100 text-green-800' : s.payment_method === 'card' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'">
                  {{ paymentLabel(s.payment_method) }}
                </span>
              </td>
              <td class="px-4 py-3 text-sm text-center text-gray-500">{{ s.sale_items?.length || 0 }}</td>
              <td class="px-4 py-3 text-center">
                <button @click="viewDetail(s)" class="text-blue-600 hover:text-blue-800">
                  <Eye class="w-4 h-4 inline" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile cards -->
      <div class="sm:hidden divide-y divide-gray-100">
        <div v-for="s in sales" :key="s.id" class="p-4">
          <div class="flex items-center justify-between">
            <span class="text-xs text-gray-500">{{ formatDate(s.created_at) }}</span>
            <span class="text-sm font-bold text-gray-900">{{ formatCurrency(s.total) }}</span>
          </div>
          <div class="flex items-center justify-between mt-1">
            <span class="text-xs text-gray-400 font-mono">{{ s.id.slice(0, 8) }}...</span>
            <span class="px-2 py-0.5 rounded-full text-xs font-medium"
              :class="s.payment_method === 'cash' ? 'bg-green-100 text-green-800' : s.payment_method === 'card' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'">
              {{ paymentLabel(s.payment_method) }}
            </span>
          </div>
          <p class="text-xs text-gray-400 mt-1">{{ s.sale_items?.length || 0 }} producto(s)</p>
        </div>
      </div>
    </div>
  </div>
</template>
