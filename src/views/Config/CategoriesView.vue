<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useCategoriesStore } from '../../stores/categories'
import { Plus, Pencil, Trash2, Save, X, Loader2 } from 'lucide-vue-next'

const store = useCategoriesStore()
const showForm = ref(false)
const editingId = ref<string | null>(null)
const form = ref({ name: '', description: '' })
const saving = ref(false)

onMounted(() => store.fetch())

function openNew() {
  editingId.value = null
  form.value = { name: '', description: '' }
  showForm.value = true
}

function openEdit(cat: any) {
  editingId.value = cat.id
  form.value = { name: cat.name, description: cat.description || '' }
  showForm.value = true
}

function cancel() {
  showForm.value = false
  editingId.value = null
  form.value = { name: '', description: '' }
}

async function save() {
  if (!form.value.name.trim()) return
  saving.value = true
  try {
    if (editingId.value) {
      await store.update(editingId.value, form.value)
    } else {
      await store.create(form.value)
    }
    cancel()
  } catch (e: any) {
    alert(e.message || 'Error al guardar')
  } finally {
    saving.value = false
  }
}

async function remove(id: string) {
  if (!confirm('¿Eliminar esta categoría?')) return
  try {
    await store.remove(id)
  } catch (e: any) {
    alert(e.message || 'Error al eliminar')
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl sm:text-2xl font-bold text-gray-900">Categorías</h2>
      <button @click="openNew"
        class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
        <Plus class="w-4 h-4" /> Nueva
      </button>
    </div>

    <div v-if="showForm"
      class="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
      <form @submit.prevent="save" class="space-y-3">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
          <input v-model="form.name" required
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
          <input v-model="form.description"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
        </div>
        <div class="flex gap-2">
          <button type="submit" :disabled="saving"
            class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
            <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
            <Save v-else class="w-4 h-4" />
            {{ editingId ? 'Actualizar' : 'Crear' }}
          </button>
          <button type="button" @click="cancel"
            class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
            <X class="w-4 h-4" /> Cancelar
          </button>
        </div>
      </form>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div v-if="store.loading" class="text-center py-10 text-sm text-gray-500">Cargando...</div>
      <div v-else-if="store.categories.length === 0" class="text-center py-10 text-sm text-gray-500">No hay categorías</div>

      <div class="hidden sm:block overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-100">
              <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Nombre</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Descripción</th>
              <th class="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cat in store.categories" :key="cat.id" class="border-b border-gray-50 hover:bg-gray-50">
              <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ cat.name }}</td>
              <td class="px-4 py-3 text-sm text-gray-500">{{ cat.description || '—' }}</td>
              <td class="px-4 py-3 text-center">
                <div class="inline-flex gap-2">
                  <button @click="openEdit(cat)" class="text-blue-600 hover:text-blue-800 p-1">
                    <Pencil class="w-4 h-4" />
                  </button>
                  <button @click="remove(cat.id)" class="text-red-500 hover:text-red-700 p-1">
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="sm:hidden divide-y divide-gray-100">
        <div v-for="cat in store.categories" :key="cat.id" class="p-4 flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-900">{{ cat.name }}</p>
            <p class="text-xs text-gray-500">{{ cat.description || 'Sin descripción' }}</p>
          </div>
          <div class="flex gap-2">
            <button @click="openEdit(cat)" class="text-blue-600 p-1"><Pencil class="w-4 h-4" /></button>
            <button @click="remove(cat.id)" class="text-red-500 p-1"><Trash2 class="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
