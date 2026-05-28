<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useProductsStore } from '../../stores/products'
import { useCategoriesStore } from '../../stores/categories'
import { ArrowLeft, Save, Loader2 } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const productStore = useProductsStore()
const categoryStore = useCategoriesStore()

const isEdit = computed(() => !!route.params.id)
const saving = ref(false)

const form = ref({
  name: '',
  description: '',
  barcode: '',
  price: 0,
  cost: 0,
  category_id: '',
  stock: 0,
  min_stock: 0,
})

onMounted(async () => {
  await categoryStore.fetch()
  if (isEdit.value) {
    const p = await productStore.getById(route.params.id as string)
    if (p) form.value = { ...p }
  }
})

async function handleSubmit() {
  saving.value = true
  try {
    if (isEdit.value) {
      await productStore.update(route.params.id as string, form.value)
    } else {
      await productStore.create({ ...form.value, stock: 0 })
    }
    router.push('/almacen/productos')
  } catch (e: any) {
    alert(e.message || 'Error al guardar')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="max-w-lg mx-auto">
    <div class="flex items-center gap-3 mb-6">
      <router-link to="/almacen/productos" class="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors">
        <ArrowLeft class="w-5 h-5 text-gray-600" />
      </router-link>
      <h2 class="text-xl font-bold text-gray-900">{{ isEdit ? 'Editar' : 'Nuevo' }} Producto</h2>
    </div>

    <form @submit.prevent="handleSubmit" class="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
        <input v-model="form.name" required
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
        <textarea v-model="form.description" rows="2"
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"></textarea>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Código de barra</label>
          <input v-model="form.barcode"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
          <select v-model="form.category_id"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
            <option value="">Sin categoría</option>
            <option v-for="cat in categoryStore.categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </select>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Precio de venta *</label>
          <input v-model.number="form.price" type="number" step="0.01" required
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Costo</label>
          <input v-model.number="form.cost" type="number" step="0.01"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
        </div>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Stock mínimo</label>
          <input v-model.number="form.min_stock" type="number" step="1"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
        </div>
        <div v-if="isEdit">
          <label class="block text-sm font-medium text-gray-700 mb-1">Stock actual</label>
          <input :value="form.stock" disabled
            class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500" />
        </div>
      </div>

      <div class="flex gap-3 pt-2">
        <button type="submit" :disabled="saving"
          class="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
          <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
          <Save v-else class="w-4 h-4" />
          {{ saving ? 'Guardando...' : 'Guardar' }}
        </button>
        <router-link to="/almacen/productos"
          class="flex-1 sm:flex-none inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
          Cancelar
        </router-link>
      </div>
    </form>
  </div>
</template>
