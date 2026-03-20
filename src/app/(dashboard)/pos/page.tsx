"use client"

import React, { useState, useEffect, useTransition } from "react"
import { getProducts } from "@/actions/products"
import { createSale, CartItem } from "@/actions/sales"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, Banknote, Search } from "lucide-react"
import { useRouter } from "next/navigation"

export default function POSPage() {
  const router = useRouter()
  const [products, setProducts] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [cart, setCart] = useState<(CartItem & { name: string, stock: number })[]>([])
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [isPending, startTransition] = useTransition()
  const [loadingInitial, setLoadingInitial] = useState(true)

  useEffect(() => {
    getProducts().then(data => {
      // Only active ones
      setProducts(data.filter(p => p.is_active))
      setLoadingInitial(false)
    })
  }, [])

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku?.toLowerCase().includes(search.toLowerCase())
  )

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.product_id === product.id)
      
      if (existing) {
        if (existing.quantity >= product.stock_quantity) {
          alert("No hay más stock disponible de este producto.")
          return prev
        }
        return prev.map(item => 
          item.product_id === product.id 
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.unit_price }
            : item
        )
      }

      if (product.stock_quantity <= 0) {
        alert("Producto sin stock.")
        return prev
      }

      return [...prev, {
        product_id: product.id,
        name: product.name,
        stock: product.stock_quantity,
        unit_price: product.price,
        quantity: 1,
        subtotal: product.price
      }]
    })
  }

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product_id === id) {
        const newQty = item.quantity + delta
        if (newQty < 1) return item
        if (newQty > item.stock) {
          alert("Límite de stock alcanzado.")
          return item
        }
        return { ...item, quantity: newQty, subtotal: newQty * item.unit_price }
      }
      return item
    }))
  }

  const removeItem = (id: string) => {
    setCart(prev => prev.filter(item => item.product_id !== id))
  }

  const total = cart.reduce((sum, item) => sum + item.subtotal, 0)

  const handleCheckout = () => {
    if (cart.length === 0) return

    startTransition(async () => {
      try {
        await createSale(total, paymentMethod, cart)
        alert("¡Venta realizada con éxito!")
        setCart([]) // Vaciar carrito
        
        // Refrescar lista de productos internamente restando el stock vendido visualmente
        setProducts(prev => prev.map(p => {
          const sold = cart.find(c => c.product_id === p.id)
          return sold ? { ...p, stock_quantity: p.stock_quantity - sold.quantity } : p
        }))

      } catch (error: any) {
        alert(error.message)
      }
    })
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-6 -m-4 md:-m-8 p-4 md:p-8 bg-zinc-50/50 dark:bg-zinc-950/50">
      
      {/* LEFT: PRODUCTS */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden h-full">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <Input 
            className="pl-10 h-12 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm"
            placeholder="Buscar productos por nombre o código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto pr-2 pb-10">
          {loadingInitial ? (
            <div className="flex items-center justify-center h-full text-zinc-500">Cargando catálogo...</div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map(p => (
                <div 
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col cursor-pointer transition-all hover:border-black dark:hover:border-white shadow-sm hover:shadow-md ${p.stock_quantity <= 0 ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                >
                  <p className="font-semibold text-lg leading-tight mb-1">{p.name}</p>
                  <p className="text-sm font-medium text-zinc-500 mb-4">${p.price?.toFixed(2)}</p>
                  <div className="mt-auto flex items-center justify-between">
                    <span className={`text-xs px-2 py-1 rounded-md font-medium ${p.stock_quantity > p.min_stock ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                      Stock: {p.stock_quantity}
                    </span>
                    <Button size="icon" variant="secondary" className="h-7 w-7 rounded-full">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: CART */}
      <div className="w-full md:w-96 flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden h-full flex-shrink-0">
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
          <ShoppingCart className="w-5 h-5" />
          <h2 className="font-semibold text-lg">Ticket de Venta</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-400 text-center">
              <ShoppingCart className="w-12 h-12 mb-3 opacity-20" />
              <p>El carrito está vacío</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map(item => (
                <div key={item.product_id} className="flex flex-col gap-2 p-3 bg-zinc-50 dark:bg-zinc-950 rounded-lg border border-zinc-100 dark:border-zinc-800">
                  <div className="flex justify-between items-start">
                    <span className="font-medium text-sm pr-2 leading-tight">{item.name}</span>
                    <span className="font-semibold">${item.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-0.5">
                      <Button size="icon" variant="ghost" className="h-7 w-7 rounded-md" onClick={() => updateQuantity(item.product_id, -1)}>
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <Button size="icon" variant="ghost" className="h-7 w-7 rounded-md" onClick={() => updateQuantity(item.product_id, 1)}>
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => removeItem(item.product_id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-5 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant={paymentMethod === 'cash' ? 'default' : 'outline'} 
              className={paymentMethod === 'cash' ? 'bg-black dark:bg-white text-white dark:text-black' : ''}
              onClick={() => setPaymentMethod('cash')}
            >
              <Banknote className="w-4 h-4 mr-2" /> Efectivo
            </Button>
            <Button 
              variant={paymentMethod === 'card' ? 'default' : 'outline'} 
              className={paymentMethod === 'card' ? 'bg-black dark:bg-white text-white dark:text-black' : ''}
              onClick={() => setPaymentMethod('card')}
            >
              <CreditCard className="w-4 h-4 mr-2" /> Tarjeta
            </Button>
          </div>

          <div className="flex justify-between items-center py-2">
            <span className="text-zinc-500 font-medium">Total a cobrar</span>
            <span className="text-3xl font-bold tracking-tight">${total.toFixed(2)}</span>
          </div>

          <Button 
            className="w-full h-14 text-lg items-center gap-2 bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200" 
            size="lg"
            disabled={cart.length === 0 || isPending}
            onClick={handleCheckout}
          >
            {isPending ? "Procesando..." : "Cobrar"} <ShoppingCart className="w-5 h-5" />
          </Button>
        </div>
      </div>
      
    </div>
  )
}
