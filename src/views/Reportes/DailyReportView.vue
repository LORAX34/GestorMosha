<script setup lang="ts">
import { ref } from 'vue'
import { supabase } from '../../lib/supabase'
import { FileText, Download, Calendar } from 'lucide-vue-next'

const date = ref(new Date().toISOString().slice(0, 10))
const sales = ref<any[]>([])
const loading = ref(false)
const loaded = ref(false)

async function loadReport() {
  loading.value = true
  loaded.value = false
  const { data } = await supabase
    .from('sales')
    .select('*, sale_items(*)')
    .gte('created_at', `${date.value}T00:00:00`)
    .lte('created_at', `${date.value}T23:59:59`)
    .order('created_at', { ascending: false })
  if (data) sales.value = data
  loaded.value = true
  loading.value = false
}

const totalAmount = ref(0)
const totalItems = ref(0)
const cashTotal = ref(0)
const cardTotal = ref(0)
const transferTotal = ref(0)

async function loadStats() {
  await loadReport()
  totalAmount.value = sales.value.reduce((s, r) => s + Number(r.total), 0)
  totalItems.value = sales.value.reduce((s, r) => s + (r.sale_items?.length || 0), 0)
  cashTotal.value = sales.value.filter(s => s.payment_method === 'cash').reduce((s, r) => s + Number(r.total), 0)
  cardTotal.value = sales.value.filter(s => s.payment_method === 'card').reduce((s, r) => s + Number(r.total), 0)
  transferTotal.value = sales.value.filter(s => s.payment_method === 'transfer').reduce((s, r) => s + Number(r.total), 0)
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
</script>

<template>
  <div>
    <h2 class="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Reporte Diario</h2>

    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
      <div class="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Fecha</label>
          <div class="relative">
            <Calendar class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input v-model="date" type="date"
              class="pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
          </div>
        </div>
        <button @click="loadStats"
          class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
          <FileText class="w-4 h-4" /> Generar
        </button>
      </div>
    </div>

    <div v-if="loading" class="text-center py-10 text-sm text-gray-500">Cargando...</div>

    <template v-if="loaded && !loading">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p class="text-xs text-gray-500">Total Ventas</p>
          <p class="text-2xl font-bold text-gray-900 mt-1">{{ sales.length }}</p>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p class="text-xs text-gray-500">Productos Vendidos</p>
          <p class="text-2xl font-bold text-gray-900 mt-1">{{ totalItems }}</p>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4 col-span-2">
          <p class="text-xs text-gray-500">Ingresos</p>
          <p class="text-2xl font-bold text-blue-600 mt-1">{{ formatCurrency(totalAmount) }}</p>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-3 mb-6">
        <div class="bg-green-50 rounded-xl border border-green-200 p-3">
          <p class="text-xs text-green-600">Efectivo</p>
          <p class="text-lg font-bold text-green-800">{{ formatCurrency(cashTotal) }}</p>
        </div>
        <div class="bg-blue-50 rounded-xl border border-blue-200 p-3">
          <p class="text-xs text-blue-600">Tarjeta</p>
          <p class="text-lg font-bold text-blue-800">{{ formatCurrency(cardTotal) }}</p>
        </div>
        <div class="bg-purple-50 rounded-xl border border-purple-200 p-3">
          <p class="text-xs text-purple-600">Transferencia</p>
          <p class="text-lg font-bold text-purple-800">{{ formatCurrency(transferTotal) }}</p>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <h3 class="text-sm font-semibold text-gray-700 px-4 sm:px-5 py-4 border-b border-gray-100">Ventas del día</h3>
        <div v-if="sales.length === 0" class="text-center py-10 text-sm text-gray-500">Sin ventas en esta fecha</div>

        <div class="hidden sm:block overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="bg-gray-50 border-b border-gray-100">
                <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Hora</th>
                <th class="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Total</th>
                <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Método</th>
                <th class="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Items</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in sales" :key="s.id" class="border-b border-gray-50 hover:bg-gray-50">
                <td class="px-4 py-3 text-sm text-gray-500">{{ formatDate(s.created_at) }}</td>
                <td class="px-4 py-3 text-sm font-semibold text-gray-900 text-right">{{ formatCurrency(s.total) }}</td>
                <td class="px-4 py-3 text-sm">
                  <span class="px-2 py-0.5 rounded-full text-xs font-medium"
                    :class="s.payment_method === 'cash' ? 'bg-green-100 text-green-800' : s.payment_method === 'card' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'">
                    {{ paymentLabel(s.payment_method) }}
                  </span>
                </td>
                <td class="px-4 py-3 text-sm text-center text-gray-500">{{ s.sale_items?.length || 0 }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="sm:hidden divide-y divide-gray-100">
          <div v-for="s in sales" :key="s.id" class="p-4">
            <div class="flex items-center justify-between">
              <span class="text-xs text-gray-500">{{ formatDate(s.created_at) }}</span>
              <span class="text-sm font-bold text-gray-900">{{ formatCurrency(s.total) }}</span>
            </div>
            <div class="flex items-center justify-between mt-1">
              <span class="px-2 py-0.5 rounded-full text-xs font-medium"
                :class="s.payment_method === 'cash' ? 'bg-green-100 text-green-800' : s.payment_method === 'card' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'">
                {{ paymentLabel(s.payment_method) }}
              </span>
              <span class="text-xs text-gray-400">{{ s.sale_items?.length }} items</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
