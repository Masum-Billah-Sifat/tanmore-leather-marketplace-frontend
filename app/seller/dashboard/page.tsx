// app/seller/dashboard/page.tsx
'use client'

import { useRouter } from 'next/navigation'

export default function SellerDashboardPage() {
  const router = useRouter()

  const handleCreateProduct = () => {
    router.push('/seller/products/create')
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">👋 Welcome to Seller Dashboard</h1>
      <p className="text-gray-700 mb-6">
        This is a placeholder. You’ll build seller analytics, orders, and product management here later.
      </p>

      <button
        onClick={handleCreateProduct}
        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        ➕ Create Product
      </button>
    </div>
  )
}
