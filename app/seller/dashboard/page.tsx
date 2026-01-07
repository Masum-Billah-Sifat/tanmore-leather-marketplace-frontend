// app/seller/dashboard/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import apiClient from '@/lib/apiClient'

interface Variant {
  variant_id: string
  color: string
  size: string
  retail_price: number
  has_retail_discount: boolean
  retail_discount: number
  retail_discount_type: string
  is_in_stock: boolean
  stock_quantity: number
  has_wholesale_enabled: boolean
  wholesale_price: number
  wholesale_min_quantity: number
  wholesale_discount: number
  wholesale_discount_type: string
  weight_grams: number
  is_variant_archived: boolean
}

interface Product {
  product_id: string
  title: string
  description: string
  category_id: string
  category_name: string
  image_urls: string[]
  promo_video_url?: string
  primary_image_url: string
  valid_variants: Variant[]
  archived_variants: Variant[]
}

export default function SellerDashboardPage() {
  const router = useRouter()
  const [approvedProducts, setApprovedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSellerProducts = async () => {
    try {
      const res = await apiClient.get('/api/seller/products')
      setApprovedProducts(res.data.data.valid_non_approved_products)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSellerProducts()
  }, [])

  const handleCreateProduct = () => {
    router.push('/seller/products/create')
  }

  // const handleProductClick = (product: Product) => {
  //   router.push(`/seller/products/view?data=${encodeURIComponent(JSON.stringify(product))}`)
  // }

  const handleProductClick = (product: Product) => {
    router.push(`/seller/products/${product.product_id}`)
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">👋 Welcome to Seller Dashboard</h1>
      <p className="text-gray-700 mb-6">
        Below are your approved products. We’ll add management features soon.
      </p>

      <button
        onClick={handleCreateProduct}
        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition mb-6"
      >
        ➕ Create Product
      </button>

      {loading && <p>Loading products...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {approvedProducts?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {approvedProducts.map((product) => (
            <button
              key={product.product_id}
              onClick={() => handleProductClick(product)}
              className="text-left border border-gray-200 rounded-xl p-5 shadow-md bg-gradient-to-br from-white to-gray-50 hover:from-blue-50 hover:to-white transition-all space-y-2 group"
            >
              <h3 className="font-semibold text-lg text-gray-900 group-hover:text-blue-800">
                {product.title}
              </h3>
              <p className="text-gray-600 text-sm line-clamp-2">
                {product.description}
              </p>
              <span className="text-sm text-gray-500 italic block">
                Category: {product.category_name}
              </span>
            </button>
          ))}
        </div>
      ) : (
        !loading && <p>No approved products yet.</p>
      )}
    </div>
  )
}