'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'

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
      <h2 className="text-2xl font-bold mb-4">📦 Feed Data</h2>
      {error && <p className="text-red-600">❌ {error}</p>}
      <pre className="bg-gray-100 p-4 text-sm rounded max-h-[300px] overflow-auto">
        {JSON.stringify(feedData, null, 2)}
      </pre>

      <h2 className="text-2xl font-bold mt-10 mb-4">🔍 Search Data</h2>
      <pre className="bg-gray-100 p-4 text-sm rounded max-h-[300px] overflow-auto">
        {JSON.stringify(searchData, null, 2)}
      </pre>
    </div>
  )
}
