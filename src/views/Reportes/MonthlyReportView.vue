<script setup lang="ts">
import { ref } from 'vue'
import { supabase } from '../../lib/supabase'
import { FileText, Calendar } from 'lucide-vue-next'

const now = new Date()
const month = ref(now.getMonth() + 1)
const year = ref(now.getFullYear())
const sales = ref<any[]>([])
const loading = ref(false)
const loaded = ref(false)

const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

async function loadReport() {
  loading.value = true
  loaded.value = false
  const start = `${year.value}-${String(month.value).padStart(2, '0')}-01`
  const lastDay = new Date(year.value, month.value, 0).getDate()
  const end = `${year.value}-${String(month.value).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  const { data } = await supabase
    .from('sales')
    .select('*')
    .gte('created_at', `${start}T00:00:00`)
    .lte('created_at', `${end}T23:59:59`)
    .order('created_at', { ascending: false })
  if (data) sales.value = data
  loaded.value = true
  loading.value = false
}

const totalAmount = computed(() => sales.value.reduce((s, r) => s + Number(r.total), 0))
const totalCount = computed(() => sales.value.length)
const avgPerSale = computed(() => sales.value.length ? totalAmount.value / sales.value.length : 0)

import { computed } from 'vue'

function formatCurrency(v: number) {
  return new Intl.NumberFormat('es-CU', { style: 'currency', currency: 'USD' }).format(v)
}

function paymentLabel(m: string) {
  const map: Record<string, string> = { cash: 'Efectivo', card: 'Tarjeta', transfer: 'Transferencia' }
  return map[m] || m
}
</script>

<template>
  <div>
    <h2 class="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Reporte Mensual</h2>

    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
      <div class="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Mes</label>
          <select v-model="month"
            class="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
            <option v-for="(name, i) in monthNames" :key="i" :value="i + 1">{{ name }}</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Año</label>
          <input v-model.number="year" type="number"
            class="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-24" />
        </div>
        <button @click="loadReport"
          class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
          <FileText class="w-4 h-4" /> Generar
        </button>
      </div>
    </div>

    <div v-if="loading" class="text-center py-10 text-sm text-gray-500">Generando reporte...</div>

    <template v-if="loaded && !loading">
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p class="text-xs text-gray-500">Total Ventas</p>
          <p class="text-2xl font-bold text-gray-900 mt-1">{{ totalCount }}</p>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p class="text-xs text-gray-500">Promedio por Venta</p>
          <p class="text-2xl font-bold text-gray-900 mt-1">{{ formatCurrency(avgPerSale) }}</p>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p class="text-xs text-gray-500">Ingresos del Mes</p>
          <p class="text-2xl font-bold text-blue-600 mt-1">{{ formatCurrency(totalAmount) }}</p>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <h3 class="text-sm font-semibold text-gray-700 px-4 sm:px-5 py-4 border-b border-gray-100">
          Ventas de {{ monthNames[month - 1] }} {{ year }}
        </h3>
        <div v-if="sales.length === 0" class="text-center py-10 text-sm text-gray-500">Sin ventas en este período</div>

        <div class="hidden sm:block overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="bg-gray-50 border-b border-gray-100">
                <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                <th class="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Total</th>
                <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Método</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in sales" :key="s.id" class="border-b border-gray-50 hover:bg-gray-50">
                <td class="px-4 py-3 text-sm text-gray-500">{{ new Date(s.created_at).toLocaleDateString('es-ES') }}</td>
                <td class="px-4 py-3 text-sm font-semibold text-gray-900 text-right">{{ formatCurrency(s.total) }}</td>
                <td class="px-4 py-3 text-sm">
                  <span class="px-2 py-0.5 rounded-full text-xs font-medium"
                    :class="s.payment_method === 'cash' ? 'bg-green-100 text-green-800' : s.payment_method === 'card' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'">
                    {{ paymentLabel(s.payment_method) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="sm:hidden divide-y divide-gray-100">
          <div v-for="s in sales" :key="s.id" class="p-4">
            <div class="flex items-center justify-between">
              <span class="text-xs text-gray-500">{{ new Date(s.created_at).toLocaleDateString('es-ES') }}</span>
              <span class="text-sm font-bold text-gray-900">{{ formatCurrency(s.total) }}</span>
            </div>
            <span class="px-2 py-0.5 inline-block mt-1 rounded-full text-xs font-medium"
              :class="s.payment_method === 'cash' ? 'bg-green-100 text-green-800' : s.payment_method === 'card' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'">
              {{ paymentLabel(s.payment_method) }}
            </span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
