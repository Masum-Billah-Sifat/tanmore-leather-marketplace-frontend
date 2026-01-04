'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import apiClient from '@/lib/apiClient'

export default function ViewCreatedProductPage() {
  const { id } = useParams()
  const [product, setProduct] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await apiClient.get(`/api/seller/products/${id}`)
        setProduct(res.data.data)
      } catch (err: any) {
        setError('Failed to load product')
      }
    }

    if (id) fetchProduct()
  }, [id])

  if (error) return <p className="text-red-600">{error}</p>
  if (!product) return <p>Loading...</p>

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">🎉 Product Created</h1>

      <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
        {JSON.stringify(product, null, 2)}
      </pre>
    </div>
  )
}
