<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useProductsStore } from '../../stores/products'
import { supabase } from '../../lib/supabase'
import { Plus, Minus, ShoppingCart, Search, X, Loader2 } from 'lucide-vue-next'

const router = useRouter()
const auth = useAuthStore()
const productStore = useProductsStore()

const searchQuery = ref('')
const searchResults = ref<any[]>([])
const showSearch = ref(false)
const saving = ref(false)

interface CartItem {
  product_id: string
  product_name: string
  quantity: number
  price: number
  subtotal: number
}

const cart = ref<CartItem[]>([])
const paymentMethod = ref<'cash' | 'card' | 'transfer'>('cash')

const total = computed(() => cart.value.reduce((s, i) => s + i.subtotal, 0))

onMounted(async () => {
  await productStore.fetch()
})

function searchProducts() {
  if (!searchQuery.value.trim()) {
    searchResults.value = []
    return
  }
  const q = searchQuery.value.toLowerCase()
  searchResults.value = productStore.products.filter(p =>
    p.stock > 0 &&
    (p.name.toLowerCase().includes(q) || p.barcode?.toLowerCase().includes(q))
  ).slice(0, 10)
  showSearch.value = true
}

function addToCart(product: any) {
  const existing = cart.value.find(i => i.product_id === product.id)
  if (existing) {
    existing.quantity++
    existing.subtotal = existing.quantity * existing.price
  } else {
    cart.value.push({
      product_id: product.id,
      product_name: product.name,
      quantity: 1,
      price: Number(product.price),
      subtotal: Number(product.price),
    })
  }
  searchQuery.value = ''
  searchResults.value = []
  showSearch.value = false
}

function updateItem(item: CartItem) {
  item.subtotal = item.quantity * item.price
}

function removeItem(index: number) {
  cart.value.splice(index, 1)
}

async function handleCheckout() {
  if (cart.value.length === 0) return
  saving.value = true
  try {
    const { data: sale, error: saleError } = await supabase.from('sales').insert({
      total: total.value,
      payment_method: paymentMethod.value,
      employee_id: auth.employee?.id,
    }).select().single()
    if (saleError) throw saleError

    const items = cart.value.map(i => ({
      sale_id: sale.id,
      product_id: i.product_id,
      product_name: i.product_name,
      quantity: i.quantity,
      price: i.price,
      subtotal: i.subtotal,
    }))

    const { error: itemsError } = await supabase.from('sale_items').insert(items)
    if (itemsError) throw itemsError

    for (const item of cart.value) {
      await supabase.rpc('decrease_stock', {
        p_product_id: item.product_id,
        p_quantity: item.quantity,
      })
    }

    cart.value = []
    await productStore.fetch()
    router.push('/ventas/historial')
  } catch (e: any) {
    alert(e.message || 'Error al procesar venta')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <h2 class="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Nueva Venta</h2>

    <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div class="lg:col-span-3 space-y-4">
        <div class="relative">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input v-model="searchQuery" @input="searchProducts" @focus="showSearch = true"
            placeholder="Buscar producto por nombre o código..."
            class="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
          <button v-if="showSearch && searchResults.length" @click="showSearch = false"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X class="w-4 h-4" />
          </button>
        </div>

        <div v-if="showSearch && searchResults.length"
          class="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden -mt-2">
          <button v-for="p in searchResults" :key="p.id" @click="addToCart(p)"
            class="w-full flex items-center justify-between px-4 py-3 hover:bg-blue-50 transition-colors text-left border-b border-gray-100 last:border-0">
            <div>
              <p class="text-sm font-medium text-gray-900">{{ p.name }}</p>
              <p class="text-xs text-gray-500">Stock: {{ p.stock }}</p>
            </div>
            <div class="text-right">
              <p class="text-sm font-semibold text-blue-600">${{ Number(p.price).toFixed(2) }}</p>
              <Plus class="w-4 h-4 text-blue-500 ml-auto mt-0.5" />
            </div>
          </button>
        </div>
      </div>

      <div class="lg:col-span-2">
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 sticky top-6">
          <h3 class="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ShoppingCart class="w-4 h-4" />
            Carrito ({{ cart.length }})
          </h3>

          <div v-if="cart.length === 0" class="text-center py-8 text-sm text-gray-400">
            Agrega productos para comenzar
          </div>

          <div v-else class="space-y-3 mb-4 max-h-80 overflow-y-auto">
            <div v-for="(item, i) in cart" :key="item.product_id"
              class="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">{{ item.product_name }}</p>
                <div class="flex items-center gap-2 mt-1">
                  <button @click="if (item.quantity > 1) { item.quantity--; updateItem(item) }"
                    class="p-0.5 rounded bg-gray-200 hover:bg-gray-300 transition-colors">
                    <Minus class="w-3 h-3" />
                  </button>
                  <input v-model.number="item.quantity" @input="updateItem(item)" type="number" min="1"
                    class="w-14 text-center text-sm border border-gray-300 rounded py-0.5" />
                  <button @click="item.quantity++; updateItem(item)"
                    class="p-0.5 rounded bg-gray-200 hover:bg-gray-300 transition-colors">
                    <Plus class="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div class="text-right shrink-0">
                <p class="text-sm font-semibold text-gray-900">${{ item.subtotal.toFixed(2) }}</p>
                <button @click="removeItem(i)" class="text-xs text-red-500 hover:text-red-700 mt-1">
                  <X class="w-3.5 h-3.5 inline" /> Quitar
                </button>
              </div>
            </div>
          </div>

          <div class="border-t border-gray-200 pt-3 space-y-3">
            <div class="flex justify-between text-lg font-bold text-gray-900">
              <span>Total</span>
              <span>${{ total.toFixed(2) }}</span>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Método de pago</label>
              <select v-model="paymentMethod"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="cash">Efectivo</option>
                <option value="card">Tarjeta</option>
                <option value="transfer">Transferencia</option>
              </select>
            </div>
            <button @click="handleCheckout" :disabled="cart.length === 0 || saving"
              class="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
              <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
              <ShoppingCart v-else class="w-4 h-4" />
              {{ saving ? 'Procesando...' : 'Cobrar $' + total.toFixed(2) }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
