<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../lib/supabase'
import { ShoppingCart, Package, AlertTriangle, DollarSign } from 'lucide-vue-next'

const router = useRouter()
const auth = useAuthStore()

const stats = ref([
  { label: 'Ventas Hoy', value: '0', icon: ShoppingCart, color: 'bg-blue-500' },
  { label: 'Productos', value: '0', icon: Package, color: 'bg-green-500' },
  { label: 'Stock Bajo', value: '0', icon: AlertTriangle, color: 'bg-yellow-500' },
  { label: 'Ingresos Hoy', value: '$0.00', icon: DollarSign, color: 'bg-blue-700' },
])

onMounted(async () => {
  const today = new Date().toISOString().slice(0, 10)

  const { count: productsCount } = await supabase
    .from('products').select('*', { count: 'exact', head: true })

  const { data: lowStockData } = await supabase
    .from('products').select('id')
    .gt('min_stock', 0)

  let lowStockCount = 0
  if (lowStockData) {
    for (const p of lowStockData) {
      const { data: prod } = await supabase
        .from('products').select('stock, min_stock').eq('id', p.id).single()
      if (prod && prod.stock <= prod.min_stock) lowStockCount++
    }
  }

  const { data: todaySales } = await supabase
    .from('sales').select('total')
    .gte('created_at', `${today}T00:00:00`)
    .lte('created_at', `${today}T23:59:59`)

  const total = todaySales?.reduce((s, r) => s + Number(r.total), 0) || 0

  stats.value = [
    { label: 'Ventas Hoy', value: String(todaySales?.length || 0), icon: ShoppingCart, color: 'bg-blue-500' },
    { label: 'Productos', value: String(productsCount || 0), icon: Package, color: 'bg-green-500' },
    { label: 'Stock Bajo', value: String(lowStockCount || 0), icon: AlertTriangle, color: 'bg-yellow-500' },
    { label: 'Ingresos Hoy', value: `$${total.toFixed(2)}`, icon: DollarSign, color: 'bg-blue-700' },
  ]
})
</script>

<template>
  <div>
    <h2 class="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <div v-for="s in stats" :key="s.label"
        class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs sm:text-sm text-gray-500">{{ s.label }}</p>
            <p class="text-lg sm:text-2xl font-bold text-gray-900 mt-1">{{ s.value }}</p>
          </div>
          <div class="p-2 sm:p-3 rounded-lg" :class="s.color">
            <component :is="s.icon" class="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
