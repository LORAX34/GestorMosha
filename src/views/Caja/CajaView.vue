<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useCajaStore } from '../../stores/caja'
import { useAuthStore } from '../../stores/auth'
import { DollarSign, Coins, TrendingUp, TrendingDown, Calculator } from 'lucide-vue-next'

const caja = useCajaStore()
const auth = useAuthStore()

const initialCash = ref(0)
const actualCash = ref(0)
const notes = ref('')
const submitting = ref(false)
const error = ref('')
const closeResult = ref<any>(null)

onMounted(async () => {
  await caja.fetchCurrentSession()
})

async function handleOpen() {
  if (initialCash.value < 0) return
  submitting.value = true
  error.value = ''
  try {
    await caja.open(initialCash.value, auth.employee!.id)
  } catch (e: any) {
    error.value = e.message
  } finally {
    submitting.value = false
  }
}

async function handleClose() {
  if (!caja.currentSession || actualCash.value < 0) return
  submitting.value = true
  error.value = ''
  try {
    closeResult.value = await caja.close(caja.currentSession.id, actualCash.value, auth.employee!.id, notes.value || undefined)
  } catch (e: any) {
    error.value = e.message
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto space-y-6">
    <h2 class="text-xl font-bold text-gray-800">Caja</h2>

    <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
      {{ error }}
    </div>

    <!-- Abrir Caja -->
    <div v-if="!caja.currentSession && !closeResult" class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
          <Coins class="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 class="font-semibold text-gray-800">Abrir Caja</h3>
          <p class="text-sm text-gray-500">Registra el dinero inicial en caja</p>
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Dinero Inicial</label>
        <div class="relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
          <input v-model.number="initialCash" type="number" step="0.01" min="0"
            class="w-full pl-7 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
        </div>
      </div>

      <button @click="handleOpen" :disabled="submitting"
        class="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 text-sm">
        {{ submitting ? 'Abriendo...' : 'Abrir Caja' }}
      </button>
    </div>

    <!-- Cerrar Caja -->
    <div v-if="caja.currentSession" class="space-y-4">
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
            <DollarSign class="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 class="font-semibold text-gray-800">Caja Abierta</h3>
            <p class="text-sm text-gray-500">
              Abierta el {{ new Date(caja.currentSession.opened_at).toLocaleString() }}
            </p>
          </div>
        </div>

        <div class="bg-blue-50 rounded-lg p-4 text-center">
          <p class="text-sm text-blue-600 font-medium">Saldo Inicial</p>
          <p class="text-2xl font-bold text-blue-800">${{ Number(caja.currentSession.initial_cash).toFixed(2) }}</p>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <h3 class="font-semibold text-gray-800">Cerrar Caja</h3>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Efectivo Contado</label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
            <input v-model.number="actualCash" type="number" step="0.01" min="0"
              class="w-full pl-7 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
          <textarea v-model="notes" rows="2"
            class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"></textarea>
        </div>

        <button @click="handleClose" :disabled="submitting"
          class="w-full bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 text-sm">
          {{ submitting ? 'Cerrando...' : 'Cerrar Caja' }}
        </button>
      </div>
    </div>

    <!-- Resultado del cierre -->
    <div v-if="closeResult" class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
          <Calculator class="w-5 h-5 text-purple-600" />
        </div>
        <h3 class="font-semibold text-gray-800">Resumen del Cierre</h3>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="bg-gray-50 rounded-lg p-3">
          <p class="text-xs text-gray-500">Ventas Efectivo</p>
          <p class="text-lg font-bold text-gray-800">${{ closeResult.totalCashSales.toFixed(2) }}</p>
        </div>
        <div class="bg-gray-50 rounded-lg p-3">
          <p class="text-xs text-gray-500">Mov. Ingresos</p>
          <p class="text-lg font-bold text-green-600">+${{ closeResult.totalIn.toFixed(2) }}</p>
        </div>
        <div class="bg-gray-50 rounded-lg p-3">
          <p class="text-xs text-gray-500">Mov. Egresos</p>
          <p class="text-lg font-bold text-red-600">-${{ closeResult.totalOut.toFixed(2) }}</p>
        </div>
        <div class="bg-gray-50 rounded-lg p-3">
          <p class="text-xs text-gray-500">Efectivo Esperado</p>
          <p class="text-lg font-bold text-gray-800">${{ closeResult.expectedCash.toFixed(2) }}</p>
        </div>
        <div class="bg-gray-50 rounded-lg p-3">
          <p class="text-xs text-gray-500">Efectivo Contado</p>
          <p class="text-lg font-bold text-gray-800">${{ closeResult.actual_cash.toFixed(2) }}</p>
        </div>
        <div class="rounded-lg p-3"
          :class="closeResult.difference >= 0 ? 'bg-green-50' : 'bg-red-50'">
          <p class="text-xs" :class="closeResult.difference >= 0 ? 'text-green-600' : 'text-red-600'">
            {{ closeResult.difference >= 0 ? 'Sobrante' : 'Faltante' }}
          </p>
          <p class="text-lg font-bold" :class="closeResult.difference >= 0 ? 'text-green-700' : 'text-red-700'">
            ${{ Math.abs(closeResult.difference).toFixed(2) }}
          </p>
        </div>
      </div>

      <button @click="closeResult = null"
        class="w-full bg-gray-600 text-white py-2.5 rounded-lg font-medium hover:bg-gray-700 text-sm">
        Ok
      </button>
    </div>
  </div>
</template>
