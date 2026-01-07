"use client"

import { useEffect, useState } from "react"
import apiClient from "@/lib/apiClient"
import { useAuthStore } from "@/stores/userAuthStore"

interface CartVariant {
  variant_id: string
  color: string
  size: string
  retail_price: number
  has_retail_discount: boolean
  retail_discount: number
  retail_discount_type: string
  has_wholesale_enabled: boolean
  wholesale_price: number | null
  wholesale_min_qty: number | null
  has_wholesale_discount: boolean
  wholesale_discount: number | null
  wholesale_discount_type: string | null
  weight_grams: number
  quantity_in_cart: number
}

interface CartProduct {
  product_id: string
  category_name: string
  product_title: string
  product_description: string
  product_primary_image: string
  variants: CartVariant[]
}

interface CartGroup {
  seller_id: string
  store_name: string
  products: CartProduct[]
}

export default function CartPage() {
  const [cartData, setCartData] = useState<CartGroup[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const hasHydrated = useAuthStore((s) => s.hasHydrated)

  useEffect(() => {
    // ⛔ wait for hydration
    if (!hasHydrated) return

    const fetchCartItems = async () => {
      if (!isLoggedIn) {
        setError("Please log in to view your cart.")
        setLoading(false)
        return
      }

      try {
        const res = await apiClient.get("/api/cart/items")
        setCartData(res.data.data.valid_items)
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to fetch cart items")
      } finally {
        setLoading(false)
      }
    }

    fetchCartItems()
  }, [hasHydrated, isLoggedIn])

  // 🧊 hydration phase
  if (!hasHydrated || loading) {
    return <div className="p-6 text-center text-gray-600">Loading cart...</div>
  }

  if (error) {
    return <div className="p-6 text-red-600 text-center">{error}</div>
  }

  if (!cartData) {
    return <div className="p-6 text-center text-gray-600">Cart is empty.</div>
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">🛒 Your Cart</h1>

      <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto max-h-[600px]">
        {JSON.stringify(cartData, null, 2)}
      </pre>
    </div>
  )
}


// "use client"

// import { useEffect, useState } from "react"
// import apiClient from "@/lib/apiClient"
// import { useAuthStore } from "@/stores/userAuthStore"

// interface CartVariant {
//   variant_id: string
//   color: string
//   size: string
//   retail_price: number
//   has_retail_discount: boolean
//   retail_discount: number
//   retail_discount_type: string
//   has_wholesale_enabled: boolean
//   wholesale_price: number | null
//   wholesale_min_qty: number | null
//   has_wholesale_discount: boolean
//   wholesale_discount: number | null
//   wholesale_discount_type: string | null
//   weight_grams: number
//   quantity_in_cart: number
// }

// interface CartProduct {
//   product_id: string
//   category_name: string
//   product_title: string
//   product_description: string
//   product_primary_image: string
//   variants: CartVariant[]
// }

// interface CartGroup {
//   seller_id: string
//   store_name: string
//   products: CartProduct[]
// }

// export default function CartPage() {
//   const [cartData, setCartData] = useState<CartGroup[] | null>(null)
//   const [error, setError] = useState<string | null>(null)

//   const isLoggedIn = useAuthStore((state) => state.isLoggedIn)

//   useEffect(() => {
//     const fetchCartItems = async () => {
//       if (!isLoggedIn) {
//         setError("Please log in to view your cart.")
//         return
//       }

//       try {
//         const res = await apiClient.get("/api/cart/items")
//         setCartData(res.data.data.valid_items)
//       } catch (err: any) {
//         setError(err.response?.data?.message || "Failed to fetch cart items")
//       }
//     }

//     fetchCartItems()
//   }, [isLoggedIn])

//   if (error) {
//     return <div className="p-6 text-red-600 text-center">{error}</div>
//   }

//   if (!cartData) {
//     return <div className="p-6 text-center text-gray-600">Loading cart...</div>
//   }

//   return (
//     <div className="max-w-5xl mx-auto p-6">
//       <h1 className="text-2xl font-bold mb-4">🛒 Your Cart</h1>

//       <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto max-h-[600px]">
//         {JSON.stringify(cartData, null, 2)}
//       </pre>
//     </div>
//   )
// }
