<script setup lang="ts">
import { onMounted } from 'vue'
import { useCajaStore } from '../../stores/caja'
import { useRouter } from 'vue-router'
import { Coins, TrendingUp, TrendingDown, Calculator, ArrowLeft } from 'lucide-vue-next'

const caja = useCajaStore()
const router = useRouter()

onMounted(async () => {
  await caja.fetchHistory()
})

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="max-w-2xl mx-auto space-y-6">
    <h2 class="text-xl font-bold text-gray-800">Historial de Caja</h2>

    <div v-if="caja.history.length === 0" class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center text-sm text-gray-500">
      No hay cierres registrados
    </div>

    <div v-for="s in caja.history" :key="s.id"
      class="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Coins class="w-4 h-4 text-gray-400" />
          <span class="text-sm text-gray-500">{{ formatDate(s.opened_at) }}</span>
        </div>
        <span class="text-xs text-gray-400">Cerrado {{ s.closed_at ? formatDate(s.closed_at) : '' }}</span>
      </div>

      <div class="grid grid-cols-3 gap-3">
        <div class="bg-gray-50 rounded-lg p-2 text-center">
          <p class="text-xs text-gray-500">Inicial</p>
          <p class="text-sm font-bold text-gray-800">${{ Number(s.initial_cash).toFixed(2) }}</p>
        </div>
        <div class="bg-gray-50 rounded-lg p-2 text-center">
          <p class="text-xs text-gray-500">Esperado</p>
          <p class="text-sm font-bold text-gray-800">${{ Number(s.expected_cash || 0).toFixed(2) }}</p>
        </div>
        <div class="bg-gray-50 rounded-lg p-2 text-center">
          <p class="text-xs text-gray-500">Contado</p>
          <p class="text-sm font-bold text-gray-800">${{ Number(s.actual_cash || 0).toFixed(2) }}</p>
        </div>
      </div>

      <div class="flex items-center justify-between pt-1 border-t border-gray-100">
        <div class="flex items-center gap-1 text-sm"
          :class="Number(s.difference || 0) >= 0 ? 'text-green-600' : 'text-red-600'">
          <TrendingUp v-if="Number(s.difference || 0) >= 0" class="w-4 h-4" />
          <TrendingDown v-else class="w-4 h-4" />
          <span class="font-medium">
            {{ Number(s.difference || 0) >= 0 ? 'Sobrante' : 'Faltante' }}: ${{ Math.abs(Number(s.difference || 0)).toFixed(2) }}
          </span>
        </div>
        <span v-if="s.notes" class="text-xs text-gray-400 truncate max-w-[150px]">{{ s.notes }}</span>
      </div>
    </div>
  </div>
</template>
