'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import Link from 'next/link'
import Image from 'next/image'

interface Variant {
  variant_id: string
  color: string
  size: string
  retail_price: number
  retail_discount: number
  retail_discount_type: string
  has_retail_discount: boolean
  wholesale_enabled: boolean
  wholesale_price: number
  wholesale_min_qty: number
  wholesale_discount: number
  wholesale_discount_type: string
  weight_grams: number
  relevance_score: number
}

interface Product {
  product_id: string
  title: string
  description: string
  images: string[]
  promo_video_url: string | null
  seller_id: string
  seller_store_name: string
  category_id: string
  category_name: string
  variants: Variant[]
}

export default function FeedAndSearchTest() {
  const [feedData, setFeedData] = useState<Product[]>([])
  const [searchData, setSearchData] = useState<Product[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const res = await axios.get('http://localhost:8080/api/feed?page=1&per_page=10')
        setFeedData(res.data.data.products)
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Feed fetch error')
      }
    }

    const fetchSearch = async () => {
      try {
        const res = await axios.get('http://localhost:8080/api/search?q=shirt&page=1&per_page=10')
        setSearchData(res.data.data.products)
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Search fetch error')
      }
    }

    fetchFeed()
    fetchSearch()
  }, [])

  return (
    <div className="bg-white px-4 py-8">
      <h2 className="text-2xl font-bold mb-4">📦 Feed Products</h2>
      {error && <p className="text-red-600">❌ {error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {feedData.map((product) => {
          const firstImage = product.images?.[0] || 'https://via.placeholder.com/300x200?text=No+Image'
          return (
            <div
              key={product.product_id}
              className="border rounded-lg p-4 shadow hover:shadow-md transition"
            >
              <Image
                src={firstImage}
                alt={product.title || 'Product Image'}
                width={400}
                height={200}
                className="object-cover rounded mb-4"
              />
              <h3 className="text-lg font-semibold">{product.title}</h3>
              <p className="text-sm text-gray-600 mb-2">{product.category_name}</p>
              <Link href={`/products/${product.product_id}`}>
                <button className="mt-2 bg-black text-white px-4 py-2 rounded hover:bg-gray-800">
                  View Product
                </button>
              </Link>
            </div>
          )
        })}
      </div>

      {/* ✅ Feed JSON */}
      <div className="mt-12">
        <h2 className="text-xl font-bold mb-2">🧾 Raw Feed JSON</h2>
        <pre className="bg-gray-100 text-sm p-4 rounded max-h-[400px] overflow-auto">
          {JSON.stringify(feedData, null, 2)}
        </pre>
      </div>

      {/* ✅ Search section */}
      <h2 className="text-2xl font-bold mt-12 mb-4">🔍 Search Results</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {searchData.map((product) => {
          const firstImage = product.images?.[0] || 'https://via.placeholder.com/300x200?text=No+Image'
          return (
            <div
              key={product.product_id}
              className="border rounded-lg p-4 shadow hover:shadow-md transition"
            >
              <Image
                src={firstImage}
                alt={product.title || 'Product Image'}
                width={400}
                height={200}
                className="object-cover rounded mb-4"
              />
              <h3 className="text-lg font-semibold">{product.title}</h3>
              <p className="text-sm text-gray-600 mb-2">{product.category_name}</p>
              <Link href={`/products/${product.product_id}`}>
                <button className="mt-2 bg-black text-white px-4 py-2 rounded hover:bg-gray-800">
                  View Product
                </button>
              </Link>
            </div>
          )
        })}
      </div>

      {/* ✅ Search JSON */}
      <div className="mt-12">
        <h2 className="text-xl font-bold mb-2">🧾 Raw Search JSON</h2>
        <pre className="bg-gray-100 text-sm p-4 rounded max-h-[400px] overflow-auto">
          {JSON.stringify(searchData, null, 2)}
        </pre>
      </div>
    </div>
  )
}
