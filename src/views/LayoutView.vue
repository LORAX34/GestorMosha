<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import {
  LayoutDashboard, Package, ShoppingCart, BarChart3, Settings, LogOut,
  ClipboardList, PlusCircle, PackageCheck, AlertTriangle, History, DollarSign,
  Tags, Users, Menu, X, FileText, CalendarRange
} from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const sidebarOpen = ref(false)

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  {
    label: 'Almacén', icon: Package, children: [
      { path: '/almacen/productos', label: 'Productos', icon: ClipboardList },
      { path: '/almacen/nuevo', label: 'Nuevo Producto', icon: PlusCircle },
      { path: '/almacen/recibir', label: 'Recibir Stock', icon: PackageCheck },
      { path: '/almacen/danados', label: 'P. Dañados', icon: AlertTriangle },
    ]
  },
  {
    label: 'Ventas', icon: ShoppingCart, children: [
      { path: '/ventas/nueva', label: 'Nueva Venta', icon: DollarSign },
      { path: '/ventas/historial', label: 'Historial', icon: History },
    ]
  },
  {
    label: 'Reportes', icon: BarChart3, children: [
      { path: '/reportes/diario', label: 'Reporte Diario', icon: FileText },
      { path: '/reportes/mensual', label: 'Reporte Mensual', icon: CalendarRange },
    ]
  },
  {
    label: 'Configuración', icon: Settings, children: [
      { path: '/config/categorias', label: 'Categorías', icon: Tags },
      { path: '/config/empleados', label: 'Empleados', icon: Users },
    ]
  },
]

function isActive(path: string) {
  return route.path === path
}

function isChildActive(children: { path: string }[]) {
  return children.some(c => route.path.startsWith(c.path))
}

async function handleLogout() {
  await auth.logout()
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex">
    <aside
      class="fixed inset-y-0 left-0 z-30 w-64 bg-blue-900 transform transition-transform duration-200 lg:translate-x-0 lg:static lg:inset-auto"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'">
      <div class="h-16 flex items-center px-6 border-b border-blue-800">
        <h1 class="text-lg font-bold text-white">Sistema Gestión</h1>
      </div>
      <nav class="mt-2 px-3 space-y-1 overflow-y-auto pb-6" style="height: calc(100vh - 4rem);">
        <template v-for="item in navItems" :key="item.label">
          <div v-if="'children' in item">
            <p class="px-3 py-2 mt-3 text-xs font-semibold text-blue-300 uppercase tracking-wider">{{ item.label }}</p>
            <router-link v-for="child in item.children" :key="child.path" :to="child.path"
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors"
              :class="isActive(child.path) ? 'bg-blue-800 text-white font-medium' : 'text-blue-100 hover:bg-blue-800/50'">
              <component :is="child.icon" class="w-4 h-4" />
              {{ child.label }}
            </router-link>
          </div>
          <router-link v-else :to="item.path"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors mt-1"
            :class="isActive(item.path) ? 'bg-blue-800 text-white font-medium' : 'text-blue-100 hover:bg-blue-800/50'">
            <component :is="item.icon" class="w-4 h-4" />
            {{ item.label }}
          </router-link>
        </template>
      </nav>
    </aside>

    <div class="flex-1 flex flex-col min-w-0">
      <header class="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20">
        <button @click="sidebarOpen = !sidebarOpen" class="lg:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100">
          <Menu v-if="!sidebarOpen" class="w-5 h-5" />
          <X v-else class="w-5 h-5" />
        </button>
        <div class="flex items-center gap-4 ml-auto">
          <span class="text-sm text-gray-600">{{ auth.employee?.name }}</span>
          <button @click="handleLogout"
            class="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition-colors">
            <LogOut class="w-4 h-4" />
            <span class="hidden sm:inline">Salir</span>
          </button>
        </div>
      </header>
      <main class="flex-1 p-4 lg:p-6 overflow-auto">
        <router-view />
      </main>
    </div>

    <div v-if="sidebarOpen" @click="sidebarOpen = false" class="fixed inset-0 bg-black/50 z-20 lg:hidden" />
  </div>
</template>
