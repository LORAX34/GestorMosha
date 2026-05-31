import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/',
    component: () => import('../views/LayoutView.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'Dashboard', component: () => import('../views/DashboardView.vue') },
      { path: 'almacen', redirect: '/almacen/productos' },
      { path: 'almacen/productos', name: 'ProductList', component: () => import('../views/Almacen/ProductListView.vue') },
      { path: 'almacen/nuevo', name: 'ProductCreate', component: () => import('../views/Almacen/ProductFormView.vue') },
      { path: 'almacen/editar/:id', name: 'ProductEdit', component: () => import('../views/Almacen/ProductFormView.vue') },
      { path: 'almacen/recibir', name: 'ReceiveStock', component: () => import('../views/Almacen/ReceiveStockView.vue') },
      { path: 'almacen/danados', name: 'DamagedProducts', component: () => import('../views/Almacen/DamagedProductsView.vue') },
      { path: 'ventas', redirect: '/ventas/historial' },
      { path: 'ventas/historial', name: 'SalesHistory', component: () => import('../views/Ventas/SalesHistoryView.vue') },
      { path: 'ventas/nueva', name: 'NewSale', component: () => import('../views/Ventas/NewSaleView.vue') },
      { path: 'reportes', redirect: '/reportes/diario' },
      { path: 'reportes/diario', name: 'DailyReport', component: () => import('../views/Reportes/DailyReportView.vue') },
      { path: 'reportes/mensual', name: 'MonthlyReport', component: () => import('../views/Reportes/MonthlyReportView.vue') },
      { path: 'config', redirect: '/config/categorias' },
      { path: 'caja', redirect: '/caja/actual' },
      { path: 'caja/actual', name: 'Caja', component: () => import('../views/Caja/CajaView.vue') },
      { path: 'caja/movimientos', name: 'CajaMovements', component: () => import('../views/Caja/MovementsView.vue') },
      { path: 'caja/historial', name: 'CajaHistory', component: () => import('../views/Caja/HistoryView.vue') },
      { path: 'config/categorias', name: 'Categories', component: () => import('../views/Config/CategoriesView.vue') },
      { path: 'config/empleados', name: 'Employees', component: () => import('../views/Config/EmployeesView.vue') },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth !== false && !auth.isAuthenticated) {
    next('/login')
  } else if (to.path === '/login' && auth.isAuthenticated) {
    next('/')
  } else {
    next()
  }
})

export default router
