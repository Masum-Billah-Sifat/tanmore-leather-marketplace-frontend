"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import apiClient from "@/lib/apiClient"

interface Variant {
  variant_id: string
  color: string
  size: string
  is_in_stock: boolean
  stock_amount: number
  retail_price: number
  retail_discount: number
  retail_discount_type: string
  has_retail_discount: boolean
  has_wholesale_enabled: boolean
  wholesale_price: number | null
  wholesale_min_quantity: number | null
  wholesale_discount: number | null
  wholesale_discount_type: string | null
  weight_grams: number
}

interface Product {
  product_id: string
  category_id: string
  category_name: string
  seller_id: string
  seller_store_name: string
  title: string
  description: string
  image_urls: string[]
  promo_video_url: string
  variants: Variant[]
}

export default function CategoryProductsPage() {
  const [products, setProducts] = useState<Product[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const searchParams = useSearchParams()
  const categoryId = searchParams.get("category_id")

  useEffect(() => {
    const fetchProducts = async () => {
      if (!categoryId) {
        setError("category_id is required")
        return
      }

      try {
        const res = await apiClient.get("/api/category-products", {
          params: { category_id: categoryId },
        })
        setProducts(res.data.data)
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to fetch products")
      }
    }

    fetchProducts()
  }, [categoryId])

  if (error) {
    return <div className="p-6 text-red-600 text-center">{error}</div>
  }

  if (!products) {
    return <div className="p-6 text-center text-gray-600">Loading category products...</div>
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">🧾 Category Products</h1>

      <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto max-h-[600px]">
        {JSON.stringify(products, null, 2)}
      </pre>
    </div>
  )
}