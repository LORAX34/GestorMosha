<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '../../lib/supabase'
import { Plus, Pencil, Trash2, Save, X, Loader2, Shield, User } from 'lucide-vue-next'
import type { Employee } from '../../types'

const employees = ref<Employee[]>([])
const loading = ref(false)
const showForm = ref(false)
const editingId = ref<string | null>(null)
const saving = ref(false)
const form = ref({ name: '', email: '', password: '', role: 'employee' as 'admin' | 'employee' })

onMounted(() => fetch())

async function fetch() {
  loading.value = true
  const { data } = await supabase.from('employees').select('*').order('name')
  if (data) employees.value = data
  loading.value = false
}

function openNew() {
  editingId.value = null
  form.value = { name: '', email: '', password: '', role: 'employee' }
  showForm.value = true
}

function openEdit(emp: Employee) {
  editingId.value = emp.id
  form.value = { name: emp.name, email: emp.email, password: '', role: emp.role }
  showForm.value = true
}

function cancel() {
  showForm.value = false
  editingId.value = null
  form.value = { name: '', email: '', password: '', role: 'employee' }
}

async function save() {
  if (!form.value.name.trim() || !form.value.email.trim()) return
  saving.value = true
  try {
    if (editingId.value) {
      const updates: any = { name: form.value.name, role: form.value.role }
      if (form.value.password) updates.password = form.value.password
      const { error } = await supabase.from('employees').update(updates).eq('id', editingId.value)
      if (error) throw error
    } else {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.value.email,
        password: form.value.password,
      })
      if (authError) throw authError
      if (!authData.user) throw new Error('Error al crear usuario')

      const { error } = await supabase.from('employees').insert({
        id: authData.user.id,
        name: form.value.name,
        email: form.value.email,
        role: form.value.role,
      })
      if (error) throw error
    }
    cancel()
    await fetch()
  } catch (e: any) {
    alert(e.message || 'Error al guardar')
  } finally {
    saving.value = false
  }
}

async function remove(id: string) {
  if (!confirm('¿Eliminar este empleado?')) return
  try {
    const { error } = await supabase.from('employees').delete().eq('id', id)
    if (error) throw error
    employees.value = employees.value.filter(e => e.id !== id)
  } catch (e: any) {
    alert(e.message || 'Error al eliminar')
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl sm:text-2xl font-bold text-gray-900">Empleados</h2>
      <button @click="openNew"
        class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
        <Plus class="w-4 h-4" /> Nuevo
      </button>
    </div>

    <div v-if="showForm"
      class="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
      <form @submit.prevent="save" class="space-y-3">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
          <input v-model="form.name" required
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Correo *</label>
          <input v-model="form.email" type="email" required
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ editingId ? 'Nueva contraseña (dejar vacío para mantener)' : 'Contraseña *' }}</label>
          <input v-model="form.password" type="password" :required="!editingId"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Rol</label>
          <select v-model="form.role"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="employee">Empleado</option>
            <option value="admin">Admin</option>
          </select>
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
      <div v-if="loading" class="text-center py-10 text-sm text-gray-500">Cargando...</div>
      <div v-else-if="employees.length === 0" class="text-center py-10 text-sm text-gray-500">No hay empleados</div>

      <div class="hidden sm:block overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-100">
              <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Nombre</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Correo</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Rol</th>
              <th class="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="emp in employees" :key="emp.id" class="border-b border-gray-50 hover:bg-gray-50">
              <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ emp.name }}</td>
              <td class="px-4 py-3 text-sm text-gray-500">{{ emp.email }}</td>
              <td class="px-4 py-3">
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                  :class="emp.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'">
                  <component :is="emp.role === 'admin' ? Shield : User" class="w-3 h-3" />
                  {{ emp.role === 'admin' ? 'Admin' : 'Empleado' }}
                </span>
              </td>
              <td class="px-4 py-3 text-center">
                <div class="inline-flex gap-2">
                  <button @click="openEdit(emp)" class="text-blue-600 hover:text-blue-800 p-1">
                    <Pencil class="w-4 h-4" />
                  </button>
                  <button @click="remove(emp.id)" class="text-red-500 hover:text-red-700 p-1">
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="sm:hidden divide-y divide-gray-100">
        <div v-for="emp in employees" :key="emp.id" class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-900">{{ emp.name }}</p>
              <p class="text-xs text-gray-500">{{ emp.email }}</p>
            </div>
            <div class="flex gap-2">
              <button @click="openEdit(emp)" class="text-blue-600 p-1"><Pencil class="w-4 h-4" /></button>
              <button @click="remove(emp.id)" class="text-red-500 p-1"><Trash2 class="w-4 h-4" /></button>
            </div>
          </div>
          <span class="inline-flex items-center gap-1 px-2 py-0.5 mt-2 rounded-full text-xs font-medium"
            :class="emp.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'">
            <component :is="emp.role === 'admin' ? Shield : User" class="w-3 h-3" />
            {{ emp.role === 'admin' ? 'Admin' : 'Empleado' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
