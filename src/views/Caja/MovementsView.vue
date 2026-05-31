<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useCajaStore } from '../../stores/caja'
import { useAuthStore } from '../../stores/auth'
import { Plus, Trash2, TrendingUp, TrendingDown, AlertCircle } from 'lucide-vue-next'

const caja = useCajaStore()
const auth = useAuthStore()

const showForm = ref(false)
const type = ref<'in' | 'out'>('in')
const concept = ref('')
const amount = ref(0)
const submitting = ref(false)
const error = ref('')

onMounted(async () => {
  await caja.fetchCurrentSession()
  if (caja.currentSession) {
    await caja.fetchMovements(caja.currentSession.id)
  }
})

async function handleSubmit() {
  if (!caja.currentSession || !concept.value || amount.value <= 0) return
  submitting.value = true
  error.value = ''
  try {
    await caja.addMovement(caja.currentSession.id, type.value, concept.value, amount.value, auth.employee!.id)
    showForm.value = false
    concept.value = ''
    amount.value = 0
  } catch (e: any) {
    error.value = e.message
  } finally {
    submitting.value = false
  }
}

async function handleDelete(id: string) {
  if (!confirm('¿Eliminar este movimiento?')) return
  try {
    await caja.deleteMovement(id)
  } catch (e: any) {
    error.value = e.message
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto space-y-6">
    <h2 class="text-xl font-bold text-gray-800">Movimientos de Caja</h2>

    <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
      {{ error }}
    </div>

    <div v-if="!caja.currentSession" class="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
      <AlertCircle class="w-4 h-4" />
      No hay caja abierta. Abrí la caja primero.
    </div>

    <template v-if="caja.currentSession">
      <button @click="showForm = !showForm"
        class="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 text-sm">
        <Plus class="w-4 h-4" />
        {{ showForm ? 'Cancelar' : 'Nuevo Movimiento' }}
      </button>

      <div v-if="showForm" class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <div class="flex gap-2">
          <button @click="type = 'in'"
            class="flex-1 py-2 rounded-lg text-sm font-medium border transition-colors"
            :class="type === 'in' ? 'bg-green-100 border-green-300 text-green-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'">
            <TrendingUp class="w-4 h-4 inline mr-1" /> Ingreso
          </button>
          <button @click="type = 'out'"
            class="flex-1 py-2 rounded-lg text-sm font-medium border transition-colors"
            :class="type === 'out' ? 'bg-red-100 border-red-300 text-red-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'">
            <TrendingDown class="w-4 h-4 inline mr-1" /> Egreso
          </button>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Concepto</label>
          <input v-model="concept" placeholder="Ej: Pago proveedor, Retiro..."
            class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Monto</label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
            <input v-model.number="amount" type="number" step="0.01" min="0"
              class="w-full pl-7 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
        </div>

        <button @click="handleSubmit" :disabled="submitting || !concept || amount <= 0"
          class="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 text-sm">
          {{ submitting ? 'Guardando...' : 'Agregar Movimiento' }}
        </button>
      </div>

      <div v-if="caja.movements.length === 0" class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center text-sm text-gray-500">
        No hay movimientos registrados
      </div>

      <div v-for="mov in caja.movements" :key="mov.id"
        class="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg flex items-center justify-center"
            :class="mov.type === 'in' ? 'bg-green-100' : 'bg-red-100'">
            <TrendingUp v-if="mov.type === 'in'" class="w-4 h-4 text-green-600" />
            <TrendingDown v-else class="w-4 h-4 text-red-600" />
          </div>
          <div>
            <p class="text-sm font-medium text-gray-800">{{ mov.concept }}</p>
            <p class="text-xs text-gray-400">{{ new Date(mov.created_at).toLocaleString() }}</p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-sm font-bold" :class="mov.type === 'in' ? 'text-green-600' : 'text-red-600'">
            {{ mov.type === 'in' ? '+' : '-' }}${{ Number(mov.amount).toFixed(2) }}
          </span>
          <button @click="handleDelete(mov.id)" class="text-gray-400 hover:text-red-600 transition-colors">
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </div>
    </template>
  </div>
</template>
