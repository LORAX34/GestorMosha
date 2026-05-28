<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useProductsStore } from '../../stores/products'
import { useCategoriesStore } from '../../stores/categories'
import { Search, PackagePlus, AlertTriangle, Plus, Trash2, Filter } from 'lucide-vue-next'

const productStore = useProductsStore()
const categoryStore = useCategoriesStore()

const search = ref('')
const categoryFilter = ref('')
const showLowStock = ref(false)
const selectedProducts = ref<string[]>([])
const showFilters = ref(false)

const filtered = computed(() => {
  let list = productStore.products
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(p => p.name.toLowerCase().includes(q) || p.barcode?.toLowerCase().includes(q))
  }
  if (categoryFilter.value) {
    list = list.filter(p => p.category_id === categoryFilter.value)
  }
  if (showLowStock.value) {
    list = list.filter(p => p.stock <= p.min_stock)
  }
  return list
})

const allSelected = computed({
  get: () => filtered.value.length > 0 && selectedProducts.value.length === filtered.value.length,
  set: (val: boolean) => {
    selectedProducts.value = val ? filtered.value.map(p => p.id) : []
  }
})

async function handleDeleteSelected() {
  if (!confirm(`¿Eliminar ${selectedProducts.value.length} producto(s)?`)) return
  await productStore.removeBatch(selectedProducts.value)
  selectedProducts.value = []
}

onMounted(async () => {
  await Promise.all([productStore.fetch(), categoryStore.fetch()])
})

function formatCurrency(v: number) {
  return new Intl.NumberFormat('es-CU', { style: 'currency', currency: 'USD' }).format(v)
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('es-ES')
}
</script>

<template>
  <div>
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <h2 class="text-xl sm:text-2xl font-bold text-gray-900">Productos</h2>
      <div class="flex gap-2 flex-wrap">
        <button v-if="selectedProducts.length" @click="handleDeleteSelected"
          class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors">
          <Trash2 class="w-4 h-4" /> Eliminar ({{ selectedProducts.length }})
        </button>
        <router-link to="/almacen/recibir"
          class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors">
          <PackagePlus class="w-4 h-4" /> Recibir
        </router-link>
        <router-link to="/almacen/danados"
          class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors">
          <AlertTriangle class="w-4 h-4" /> Dañados
        </router-link>
        <router-link to="/almacen/nuevo"
          class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors">
          <Plus class="w-4 h-4" /> Nuevo
        </router-link>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div class="p-3 sm:p-4 border-b border-gray-100">
        <div class="flex flex-col sm:flex-row gap-3">
          <div class="relative flex-1">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input v-model="search" type="text" placeholder="Buscar por nombre o código..."
              class="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
          </div>
          <button @click="showFilters = !showFilters"
            class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors sm:hidden">
            <Filter class="w-4 h-4" /> Filtros
          </button>
          <div class="hidden sm:flex gap-3 items-center">
            <select v-model="categoryFilter"
              class="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
              <option value="">Todas las categorías</option>
              <option v-for="cat in categoryStore.categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </select>
            <button @click="showLowStock = !showLowStock"
              class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors"
              :class="showLowStock ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'">
              <AlertTriangle class="w-4 h-4" /> Stock bajo
            </button>
          </div>
        </div>
        <div v-if="showFilters" class="flex flex-col gap-2 mt-3 sm:hidden">
          <select v-model="categoryFilter"
            class="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">Todas las categorías</option>
            <option v-for="cat in categoryStore.categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </select>
          <button @click="showLowStock = !showLowStock"
            class="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors"
            :class="showLowStock ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-700'">
            <AlertTriangle class="w-4 h-4" /> Stock bajo
          </button>
        </div>
      </div>

      <div v-if="productStore.loading" class="text-center py-10 text-sm text-gray-500">Cargando...</div>
      <div v-else-if="filtered.length === 0" class="text-center py-10 text-sm text-gray-500">No hay productos</div>

      <!-- Desktop table -->
      <div class="hidden sm:block overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-100 bg-gray-50">
              <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-10">
                <input type="checkbox" v-model="allSelected"
                  class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              </th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Código</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Producto</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Categoría</th>
              <th class="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Stock</th>
              <th class="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">P. Venta</th>
              <th class="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Acción</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in filtered" :key="p.id" class="border-b border-gray-50 hover:bg-gray-50 transition-colors">
              <td class="px-4 py-3">
                <input type="checkbox" :value="p.id" v-model="selectedProducts"
                  class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              </td>
              <td class="px-4 py-3 text-xs font-mono text-gray-500">{{ p.barcode || '—' }}</td>
              <td class="px-4 py-3">
                <p class="text-sm font-medium text-gray-900">{{ p.name }}</p>
              </td>
              <td class="px-4 py-3 text-sm text-gray-500">{{ categoryStore.categories.find(c => c.id === p.category_id)?.name || '—' }}</td>
              <td class="px-4 py-3 text-right">
                <span class="text-sm font-medium" :class="p.stock <= p.min_stock ? 'text-red-600' : 'text-gray-900'">
                  {{ p.stock }}
                </span>
              </td>
              <td class="px-4 py-3 text-right text-sm">{{ formatCurrency(p.price) }}</td>
              <td class="px-4 py-3 text-center">
                <router-link :to="`/almacen/editar/${p.id}`"
                  class="text-xs font-medium text-blue-600 hover:text-blue-800">Editar</router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile cards -->
      <div class="sm:hidden divide-y divide-gray-100">
        <div v-for="p in filtered" :key="p.id" class="p-4">
          <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate">{{ p.name }}</p>
              <p class="text-xs text-gray-500 mt-0.5">{{ p.barcode || 'Sin código' }}</p>
            </div>
            <input type="checkbox" :value="p.id" v-model="selectedProducts"
              class="ml-3 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 shrink-0" />
          </div>
          <div class="flex items-center justify-between mt-2 text-sm">
            <span class="text-gray-500">{{ categoryStore.categories.find(c => c.id === p.category_id)?.name || 'Sin cat.' }}</span>
            <span :class="p.stock <= p.min_stock ? 'text-red-600 font-bold' : 'text-gray-900 font-medium'">
              Stock: {{ p.stock }}
            </span>
          </div>
          <div class="flex items-center justify-between mt-1">
            <span class="text-sm font-semibold text-gray-900">{{ formatCurrency(p.price) }}</span>
            <router-link :to="`/almacen/editar/${p.id}`"
              class="text-xs font-medium text-blue-600">Editar</router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
