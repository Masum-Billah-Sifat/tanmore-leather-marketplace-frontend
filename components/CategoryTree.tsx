'use client'

import Link from 'next/link'
import { useState } from 'react'

export interface CategoryNode {
  id: string
  name: string
  slug: string
  level: number
  is_leaf: boolean
  children: CategoryNode[]
}

interface CategoryTreeProps {
  categories: CategoryNode[]
}

export default function CategoryTree({ categories }: CategoryTreeProps) {
  const [expanded, setExpanded] = useState<string | null>(null)

  const toggleExpand = (id: string) => {
    setExpanded((prev) => (prev === id ? null : id))
  }

  const renderNode = (node: CategoryNode) => {
    const isOpen = expanded === node.id
    return (
      <div key={node.id} className="w-full">
        {node.is_leaf ? (
          <Link
            href={`/category-products?category_id=${node.id}`}
            className="block px-4 py-3 text-lg text-gray-800 hover:bg-gray-200 transition rounded"
          >
            {node.name}
          </Link>
        ) : (
          <div
            onMouseEnter={() => setExpanded(node.id)}
            onMouseLeave={() => setExpanded(null)}
            className="relative w-full"
          >
            <button
              className="block w-full px-4 py-3 text-xl font-semibold text-gray-900 bg-white hover:bg-gray-100 transition rounded"
            >
              {node.name}
            </button>

            {/* Dropdown below parent */}
            {isOpen && node.children.length > 0 && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-white shadow-lg rounded border z-50">
                {node.children.map((child) => (
                  <div key={child.id}>
                    {renderNode(child)}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="w-full bg-gray-100 border-y border-gray-300 py-4 px-6 flex gap-8 overflow-x-auto whitespace-nowrap">
      {categories.map((cat) => (
        <div key={cat.id} className="relative">
          {renderNode(cat)}
        </div>
      ))}
    </div>
  )
}
