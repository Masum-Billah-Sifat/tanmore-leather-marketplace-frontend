// ✅ UPDATED: /app/seller/products/[product_id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import apiClient from '@/lib/apiClient'
import axios from 'axios'
import Image from 'next/image'

interface CategoryNode {
  id: string
  name: string
  slug: string
  level: number
  is_leaf: boolean
  children: CategoryNode[]
}

interface MediaItem {
  media_id: string
  media_type: 'image' | 'video'
  media_url: string
  is_primary: boolean
  is_archived: boolean
}

export default function ViewCreatedProductPage() {
  const params = useParams()
  const productId = params?.product_id as string

  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [editing, setEditing] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const [categoryTree, setCategoryTree] = useState<CategoryNode[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')
  const [categoryUpdateMessage, setCategoryUpdateMessage] = useState<string | null>(null)
  const [updatingCategory, setUpdatingCategory] = useState(false)

  const [uploading, setUploading] = useState(false)
  const [mediaError, setMediaError] = useState<string | null>(null)


  useEffect(() => {
  // Temporary hardcoded mock
  setProduct({
    product_id: "eb301811-1c79-4d73-af24-b0cb2e2dfea5",
    title: "product one",
    description: "product description one",
    category_id: "0fe45d37-1fc1-40b0-b3b5-5c1f00c3dfe2",
    category_name: "Watches",
    image_media_items: [
      {
        media_id: "88d0ed6f-ebfe-42f5-b6b1-835c0273ec64",
        media_url: "https://cdn.tanmore.com/media/0905529c-342c-4c84-8905-85eaccdce89b_1767694415.jpg",
        media_type: "image",
        is_primary: true,
        is_archived: false,
      },
      {
        media_id: "81ffc8c3-f364-4a67-9e48-d642c9570849",
        media_url: "https://cdn.tanmore.com/media/1763bfbc-7f55-458e-8d3f-b9072c54a558_1767694385.jpg",
        media_type: "image",
        is_primary: false,
        is_archived: false,
      },
      {
        media_id: "3c3c8628-385c-49b0-8739-f0bc947f7ac2",
        media_url: "https://cdn.tanmore.com/media/f45e7f1d-fd32-499f-8819-b74929f9e7e8_1767694421.jpg",
        media_type: "image",
        is_primary: false,
        is_archived: false,
      }
    ],
    promo_video_item: {
      media_id: "dd4d60ab-1895-476c-a5b3-596a31a12a18",
      media_url: "https://cdn.tanmore.com/media/1b1a4add-8c61-45a6-9edd-c2dba9e529d2_1767694426.mp4",
      media_type: "video",
      is_primary: false,
      is_archived: false,
    }
  });
    setLoading(false)

}, []);


  // useEffect(() => {
  //   const fetchProduct = async () => {
  //     try {
  //       const res = await apiClient.get(`/api/seller/products/${productId}`)
  //       console.log('✅ PRODUCT FETCH RESPONSE', res.data)
  //       setProduct(res.data.data)
  //       setNewTitle(res.data.data.title)
  //       setNewDescription(res.data.data.description)
  //       setSelectedCategoryId(res.data.data.category_id)
  //     } catch (err: any) {
  //       console.error('❌ PRODUCT FETCH ERROR', err)
  //       setError(err?.response?.data?.message || 'Failed to load product')
  //     } finally {
  //       setLoading(false)
  //     }
  //   }

  //   if (productId) fetchProduct()
  // }, [productId])

  useEffect(() => {
  const fetchCategories = async () => {
    try {
      const res = await apiClient.get('/api/categories/tree')  // hits Next.js route or proxy
      setCategoryTree(res.data.data)
    } catch (err) {
      console.error('❌ Failed to load categories:', err)
    }
  }
  fetchCategories()
}, [])


  const handleUpdateProductInfo = async () => {
    setUpdateError(null)
    setSuccessMsg(null)

    if (newTitle === product.title && newDescription === product.description) {
      setUpdateError('No changes made to title or description')
      return
    }

    const payload: any = {}
    if (newTitle !== product.title) payload.title = newTitle
    if (newDescription !== product.description) payload.description = newDescription

    try {
      setUpdating(true)
      const res = await apiClient.put(`/api/seller/products/${productId}`, payload)
      console.log('✅ PRODUCT UPDATE RESPONSE', res.data)
      setSuccessMsg('Product info updated successfully')
      setProduct({ ...product, ...payload })
      setEditing(false)
    } catch (err: any) {
      setUpdateError(err?.response?.data?.message || 'Failed to update product info')
    } finally {
      setUpdating(false)
    }
  }

  const renderCategoryOptions = (nodes: CategoryNode[], level = 0): JSX.Element[] => {
    return nodes.flatMap((node) => {
      const prefix = '—'.repeat(level)
      const self = (
        <option key={node.id} value={node.id} disabled={!node.is_leaf}>
          {prefix} {node.name} {node.is_leaf ? '' : '(not leaf)'}
        </option>
      )
      return [self, ...renderCategoryOptions(node.children, level + 1)]
    })
  }

  const handleCategoryUpdate = async () => {
    setCategoryUpdateMessage(null)
    if (!selectedCategoryId) return
    if (selectedCategoryId === product.category_id) {
      setCategoryUpdateMessage('Please choose a different category')
      return
    }
    try {
      setUpdatingCategory(true)
      const res = await apiClient.put(`/api/seller/products/${productId}/category`, {
        category_id: selectedCategoryId
      })
      setProduct({ ...product, category_id: selectedCategoryId })
      setCategoryUpdateMessage('✅ Category updated successfully')
    } catch (err: any) {
      setCategoryUpdateMessage(err?.response?.data?.message || 'Failed to update category')
    } finally {
      setUpdatingCategory(false)
    }
  }

  const uploadMedia = async (file: File, media_type: 'image' | 'video') => {
    const ext = file.name.split('.').pop()?.toLowerCase()
    const presign = await apiClient.post('/api/media/presign-upload', {
      media_type,
      file_extension: ext,
    })

    const { upload_url, media_url } = presign.data.data
    await axios.put(upload_url, file, { headers: { 'Content-Type': file.type } })
    return media_url
  }

  if (loading) return <p className="p-8">Loading product...</p>
  if (error) return <p className="p-8 text-red-600">{error}</p>

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      <h1 className="text-3xl font-bold">🧾 Product Detail (Seller)</h1>

      {/* Product Info + Category (unchanged) */}
        {/* EXISTING PRODUCT INFO + CATEGORY UI BLOCKS KEEP AS IS */}

            <div className="border rounded-lg p-6 bg-white shadow space-y-4">
        {!editing ? (
          <>
            <h2 className="text-2xl font-semibold">{product.title}</h2>
            <p className="text-gray-700">{product.description}</p>
            <p className="text-sm text-gray-500">Category: {product.category_name}</p>

            <button
              onClick={() => setEditing(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              ✏️ Update Product Info
            </button>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="Title"
              />
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="Description"
                rows={4}
              />

              {updateError && <p className="text-red-600 text-sm">{updateError}</p>}
              {successMsg && <p className="text-green-600 text-sm">{successMsg}</p>}

              <div className="flex gap-3 mt-2">
                <button
                  onClick={handleUpdateProductInfo}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  disabled={updating}
                >
                  {updating ? 'Updating…' : '✅ Update'}
                </button>

                <button
                  onClick={() => {
                    setEditing(false)
                    setNewTitle(product.title)
                    setNewDescription(product.description)
                  }}
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
                >
                  ❌ Cancel
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="border rounded-lg p-6 bg-white shadow space-y-4">
        <h2 className="text-xl font-semibold">🌳 Update Product Category</h2>
        <select
          className="w-full border px-3 py-2 rounded"
          value={selectedCategoryId}
          onChange={(e) => setSelectedCategoryId(e.target.value)}
        >
          <option value="">Select a category</option>
          {renderCategoryOptions(categoryTree)}
        </select>

        {categoryUpdateMessage && (
          <p className="text-sm text-blue-600 mt-1">{categoryUpdateMessage}</p>
        )}

        <button
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
          onClick={handleCategoryUpdate}
          disabled={updatingCategory}
        >
          {updatingCategory ? 'Updating…' : '🔁 Update Category'}
        </button>
      </div>

      {/* 🖼️ Product Images */}
      <div className="border rounded-lg p-6 bg-white shadow space-y-4">
        <h2 className="text-xl font-semibold">🖼️ Product Images</h2>
        {product.image_media_items.map((media: MediaItem) => (
          <div key={media.media_id} className="flex items-center gap-4 border-b py-2">
            <Image src={media.media_url} alt="Product" width={96} height={96} className="w-24 h-24 object-cover rounded" />
            <div className="flex gap-2">
              {media.is_primary ? (
                <span className="text-green-600 font-semibold">✅ Primary Image</span>
              ) : (
                <>
                  <button
                    onClick={async () => {
                      await apiClient.put(`/api/seller/products/${productId}/images/${media.media_id}/set-primary`)
                      setProduct({ ...product, primary_image_item: media })
                    }}
                    className="text-sm bg-yellow-500 text-white px-3 py-1 rounded"
                  >
                    Set as Primary
                  </button>
                  <button
                    onClick={async () => {
                      await apiClient.delete(`/api/seller/products/${productId}/media/${media.media_id}?media_type=image`)
                      setProduct({
                        ...product,
                        image_media_items: product.image_media_items.filter((m: MediaItem) => m.media_id !== media.media_id),
                      })
                    }}
                    className="text-sm bg-red-500 text-white px-3 py-1 rounded"
                  >
                    Remove
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 🎞️ Promo Video */}
      <div className="border rounded-lg p-6 bg-white shadow space-y-4">
        <h2 className="text-xl font-semibold">🎞️ Promo Video</h2>
        {product.promo_video_item ? (
          <div className="space-y-2">
            <video src={product.promo_video_item.media_url} controls className="w-full max-w-sm rounded" />
            <button
              onClick={async () => {
                await apiClient.delete(`/api/seller/products/${productId}/media/${product.promo_video_item.media_id}?media_type=promo_video`)
                setProduct({ ...product, promo_video_item: null })
              }}
              className="bg-red-600 text-white px-4 py-2 rounded"
            >
              🗑️ Remove Promo Video
            </button>
          </div>
        ) : (
          <div>
            <input
              type="file"
              accept="video/mp4"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                try {
                  setUploading(true)
                  const media_url = await uploadMedia(file, 'video')
                  await apiClient.post(`/api/seller/products/${productId}/media`, {
                    media_url,
                    media_type: 'promo_video',
                  })
                  // Refresh product or manually patch it
                } catch (err: any) {
                  alert(err?.response?.data?.message || 'Failed to upload promo video')
                } finally {
                  setUploading(false)
                }
              }}
            />
            {uploading && <p className="text-sm text-gray-600">Uploading video…</p>}
          </div>
        )}
      </div>

      {/* Debug */}
      <div>
        <h3 className="font-semibold mb-2">🔍 Raw API Response (Debug)</h3>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
          {JSON.stringify(product, null, 2)}
        </pre>
      </div>
    </div>
  )
}


// ================================================================================================================================
// // app/seller/products/[product_id]/page.tsx
// 'use client'

// import { useEffect, useState } from 'react'
// import { useParams } from 'next/navigation'
// import apiClient from '@/lib/apiClient'
// import axios from 'axios'
// import Image from 'next/image'

// interface CategoryNode {
//   id: string
//   name: string
//   slug: string
//   level: number
//   is_leaf: boolean
//   children: CategoryNode[]
// }

// interface Media {
//   media_id: string
//   media_url: string
//   media_type: 'image' | 'promo_video'
//   is_primary: boolean
//   is_archived: boolean
// }

// export default function ViewCreatedProductPage() {
//   const params = useParams()
//   const productId = params?.product_id as string

//   const [product, setProduct] = useState<any>(null)
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState<string | null>(null)

//   const [editing, setEditing] = useState(false)
//   const [newTitle, setNewTitle] = useState('')
//   const [newDescription, setNewDescription] = useState('')
//   const [updateError, setUpdateError] = useState<string | null>(null)
//   const [updating, setUpdating] = useState(false)
//   const [successMsg, setSuccessMsg] = useState<string | null>(null)

//   const [categoryTree, setCategoryTree] = useState<CategoryNode[]>([])
//   const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')
//   const [categoryUpdateMessage, setCategoryUpdateMessage] = useState<string | null>(null)
//   const [updatingCategory, setUpdatingCategory] = useState(false)

//   const [uploading, setUploading] = useState(false)
//   const [mediaError, setMediaError] = useState<string | null>(null)

//   useEffect(() => {
//     const fetchProduct = async () => {
//       try {
//         const res = await apiClient.get(`/api/seller/products/${productId}`)
//         console.log('✅ PRODUCT FETCH RESPONSE', res.data)
//         setProduct(res.data.data)
//         setNewTitle(res.data.data.title)
//         setNewDescription(res.data.data.description)
//         setSelectedCategoryId(res.data.data.category_id)
//       } catch (err: any) {
//         console.error('❌ PRODUCT FETCH ERROR', err)
//         setError(err?.response?.data?.message || 'Failed to load product')
//       } finally {
//         setLoading(false)
//       }
//     }

//     if (productId) fetchProduct()
//   }, [productId])

//   useEffect(() => {
//     const fetchCategories = async () => {
//       try {
//         const res = await apiClient.get('/api/categories/tree', { baseURL: undefined })
//         setCategoryTree(res.data.data)
//       } catch (err) {
//         console.error('❌ Failed to load categories')
//       }
//     }
//     fetchCategories()
//   }, [])

//   const handleUpdateProductInfo = async () => {
//     setUpdateError(null)
//     setSuccessMsg(null)

//     if (newTitle === product.title && newDescription === product.description) {
//       setUpdateError('No changes made to title or description')
//       return
//     }

//     const payload: any = {}
//     if (newTitle !== product.title) payload.title = newTitle
//     if (newDescription !== product.description) payload.description = newDescription

//     try {
//       setUpdating(true)
//       const res = await apiClient.put(`/api/seller/products/${productId}`, payload)
//       console.log('✅ PRODUCT UPDATE RESPONSE', res.data)
//       setSuccessMsg('Product info updated successfully')
//       setProduct({ ...product, ...payload })
//       setEditing(false)
//     } catch (err: any) {
//       setUpdateError(err?.response?.data?.message || 'Failed to update product info')
//     } finally {
//       setUpdating(false)
//     }
//   }

//   const renderCategoryOptions = (nodes: CategoryNode[], level = 0): JSX.Element[] => {
//     return nodes.flatMap((node) => {
//       const prefix = '—'.repeat(level)
//       const self = (
//         <option key={node.id} value={node.id} disabled={!node.is_leaf}>
//           {prefix} {node.name} {node.is_leaf ? '' : '(not leaf)'}
//         </option>
//       )
//       return [self, ...renderCategoryOptions(node.children, level + 1)]
//     })
//   }

//   const handleCategoryUpdate = async () => {
//     setCategoryUpdateMessage(null)
//     if (!selectedCategoryId) return
//     if (selectedCategoryId === product.category_id) {
//       setCategoryUpdateMessage('Please choose a different category')
//       return
//     }
//     try {
//       setUpdatingCategory(true)
//       const res = await apiClient.put(`/api/seller/products/${productId}/category`, {
//         category_id: selectedCategoryId
//       })
//       setProduct({ ...product, category_id: selectedCategoryId })
//       setCategoryUpdateMessage('✅ Category updated successfully')
//     } catch (err: any) {
//       setCategoryUpdateMessage(err?.response?.data?.message || 'Failed to update category')
//     } finally {
//       setUpdatingCategory(false)
//     }
//   }

//   const uploadMedia = async (file: File, media_type: 'image' | 'video') => {
//     const ext = file.name.split('.').pop()?.toLowerCase()
//     const presign = await apiClient.post('/api/media/presign-upload', {
//       media_type,
//       file_extension: ext,
//     })

//     const { upload_url, media_url } = presign.data.data
//     await axios.put(upload_url, file, { headers: { 'Content-Type': file.type } })
//     return media_url
//   }

//   if (loading) return <p className="p-8">Loading product...</p>
//   if (error) return <p className="p-8 text-red-600">{error}</p>

//   return (
//     <div className="max-w-4xl mx-auto p-8 space-y-6">
//       <h1 className="text-3xl font-bold">🧾 Product Detail (Seller)</h1>

//       {/* EXISTING PRODUCT INFO + CATEGORY UI BLOCKS KEEP AS IS */}

//             <div className="border rounded-lg p-6 bg-white shadow space-y-4">
//         {!editing ? (
//           <>
//             <h2 className="text-2xl font-semibold">{product.title}</h2>
//             <p className="text-gray-700">{product.description}</p>
//             <p className="text-sm text-gray-500">Category: {product.category_name}</p>

//             <button
//               onClick={() => setEditing(true)}
//               className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
//             >
//               ✏️ Update Product Info
//             </button>
//           </>
//         ) : (
//           <>
//             <div className="space-y-2">
//               <input
//                 type="text"
//                 value={newTitle}
//                 onChange={(e) => setNewTitle(e.target.value)}
//                 className="w-full border rounded px-3 py-2"
//                 placeholder="Title"
//               />
//               <textarea
//                 value={newDescription}
//                 onChange={(e) => setNewDescription(e.target.value)}
//                 className="w-full border rounded px-3 py-2"
//                 placeholder="Description"
//                 rows={4}
//               />

//               {updateError && <p className="text-red-600 text-sm">{updateError}</p>}
//               {successMsg && <p className="text-green-600 text-sm">{successMsg}</p>}

//               <div className="flex gap-3 mt-2">
//                 <button
//                   onClick={handleUpdateProductInfo}
//                   className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
//                   disabled={updating}
//                 >
//                   {updating ? 'Updating…' : '✅ Update'}
//                 </button>

//                 <button
//                   onClick={() => {
//                     setEditing(false)
//                     setNewTitle(product.title)
//                     setNewDescription(product.description)
//                   }}
//                   className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
//                 >
//                   ❌ Cancel
//                 </button>
//               </div>
//             </div>
//           </>
//         )}
//       </div>

//       <div className="border rounded-lg p-6 bg-white shadow space-y-4">
//         <h2 className="text-xl font-semibold">🌳 Update Product Category</h2>
//         <select
//           className="w-full border px-3 py-2 rounded"
//           value={selectedCategoryId}
//           onChange={(e) => setSelectedCategoryId(e.target.value)}
//         >
//           <option value="">Select a category</option>
//           {renderCategoryOptions(categoryTree)}
//         </select>

//         {categoryUpdateMessage && (
//           <p className="text-sm text-blue-600 mt-1">{categoryUpdateMessage}</p>
//         )}

//         <button
//           className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
//           onClick={handleCategoryUpdate}
//           disabled={updatingCategory}
//         >
//           {updatingCategory ? 'Updating…' : '🔁 Update Category'}
//         </button>
//       </div>


//       {/* NEW BLOCKS FOR MEDIA HANDLING WILL BE ADDED HERE IN NEXT STEP */}

//       {/* 🖼️ Product Images Management */}
// <div className="border rounded-lg p-6 bg-white shadow space-y-4">
//   <h2 className="text-xl font-semibold">🖼️ Product Images</h2>

//   {product.image_urls.map((imgUrl: string) => {
//     const isPrimary = imgUrl === product.primary_image_url
//     return (
//       <div key={imgUrl} className="flex items-center gap-4 border-b py-2">
//         {/* <Image src={imgUrl} alt="Product" className="w-24 h-24 object-cover rounded" /> */}
//         <Image
//   src={imgUrl}
//   alt="Product"
//   width={96}
//   height={96}
//   className="w-24 h-24 object-cover rounded"
// />
//         <div className="flex gap-2">
//           {isPrimary ? (
//             <span className="text-green-600 font-semibold">✅ Primary Image</span>
//           ) : (
//             <>
//               <button
//                 onClick={async () => {
//                   try {
//                     await apiClient.put(`/api/seller/products/${productId}/images/${extractMediaId(imgUrl)}/set-primary`)
//                     setProduct({ ...product, primary_image_url: imgUrl })
//                   } catch (err: any) {
//                     alert(err?.response?.data?.message || 'Failed to set primary image')
//                   }
//                 }}
//                 className="text-sm bg-yellow-500 text-white px-3 py-1 rounded"
//               >
//                 Set as Primary
//               </button>
//               <button
//                 onClick={async () => {
//                   try {
//                        const mediaId = extractMediaId(imgUrl)
// console.log("🧩 Deleting media with ID:", mediaId)
//                     await apiClient.delete(`/api/seller/products/${productId}/media/${extractMediaId(imgUrl)}?media_type=image`)
//                     setProduct({
//                       ...product,
//                       image_urls: product.image_urls.filter((url: string) => url !== imgUrl),
//                     })
//                   } catch (err: any) {
//                     alert(err?.response?.data?.message || 'Failed to remove image')
//                   }
//                 }}
//                 className="text-sm bg-red-500 text-white px-3 py-1 rounded"
//               >
//                 Remove
//               </button>
//             </>
//           )}
//         </div>
//       </div>
//     )
//   })}

//   {/* Upload New Image */}
//   <div className="mt-4">
//     <input
//       type="file"
//       accept="image/*"
//       onChange={async (e) => {
//         const file = e.target.files?.[0]
//         if (!file) return
//         try {
//           setUploading(true)
//           const media_url = await uploadMedia(file, 'image')
//           await apiClient.post(`/api/seller/products/${productId}/media`, {
//             media_url,
//             media_type: 'image',
//           })
//           setProduct({
//             ...product,
//             image_urls: [...product.image_urls, media_url],
//           })
//         } catch (err: any) {
//           setMediaError(err?.response?.data?.message || 'Failed to upload image')
//         } finally {
//           setUploading(false)
//         }
//       }}
//     />
//     {uploading && <p className="text-sm text-gray-600">Uploading image…</p>}
//     {mediaError && <p className="text-sm text-red-600">{mediaError}</p>}
//   </div>
// </div>

// {/* 🎞️ Promo Video Handling */}
// <div className="border rounded-lg p-6 bg-white shadow space-y-4">
//   <h2 className="text-xl font-semibold">🎞️ Promo Video</h2>

//   {product.promo_video_url ? (
//     <div className="space-y-2">
//       <video src={product.promo_video_url} controls className="w-full max-w-sm rounded" />
//       <button
//         onClick={async () => {
//           try {
//             const mediaId = extractMediaId(product.promo_video_url)
// console.log("🧩 Deleting media with ID:", mediaId)

//             await apiClient.delete(`/api/seller/products/${productId}/media/${extractMediaId(product.promo_video_url)}?media_type=promo_video`)
//             setProduct({ ...product, promo_video_url: null })
//           } catch (err: any) {
//             alert(err?.response?.data?.message || 'Failed to remove promo video')
//           }
//         }}
//         className="bg-red-600 text-white px-4 py-2 rounded"
//       >
//         🗑️ Remove Promo Video
//       </button>
//     </div>
//   ) : (
//     <div>
//       <input
//         type="file"
//         accept="video/mp4"
//         onChange={async (e) => {
//           const file = e.target.files?.[0]
//           if (!file) return
//           try {
//             setUploading(true)
//             const media_url = await uploadMedia(file, 'video')
//             await apiClient.post(`/api/seller/products/${productId}/media`, {
//               media_url,
//               media_type: 'promo_video',
//             })
//             setProduct({ ...product, promo_video_url: media_url })
//           } catch (err: any) {
//             alert(err?.response?.data?.message || 'Failed to upload promo video')
//           } finally {
//             setUploading(false)
//           }
//         }}
//       />
//       {uploading && <p className="text-sm text-gray-600">Uploading video…</p>}
//     </div>
//   )}
// </div>

//       <div>
//         <h3 className="font-semibold mb-2">🔍 Raw API Response (Debug)</h3>
//         <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
//           {JSON.stringify(product, null, 2)}
//         </pre>
//       </div>
//     </div>
//   )
// }


// const extractMediaId = (url: string): string => {
//   const parts = url.split('/')
//   const filename = parts[parts.length - 1]
//   return filename.split('_')[0] // extract UUID from something like abc-uuid_timestamp.jpg
// }

// =====================================================
// // app/seller/products/[product_id]/page.tsx
// 'use client'

// import { useEffect, useState } from 'react'
// import { useParams } from 'next/navigation'
// import apiClient from '@/lib/apiClient'

// interface CategoryNode {
//   id: string
//   name: string
//   slug: string
//   level: number
//   is_leaf: boolean
//   children: CategoryNode[]
// }

// export default function ViewCreatedProductPage() {
//   const params = useParams()
//   const productId = params?.product_id as string

//   const [product, setProduct] = useState<any>(null)
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState<string | null>(null)

//   const [editing, setEditing] = useState(false)
//   const [newTitle, setNewTitle] = useState('')
//   const [newDescription, setNewDescription] = useState('')
//   const [updateError, setUpdateError] = useState<string | null>(null)
//   const [updating, setUpdating] = useState(false)
//   const [successMsg, setSuccessMsg] = useState<string | null>(null)

//   const [categoryTree, setCategoryTree] = useState<CategoryNode[]>([])
//   const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')
//   const [categoryUpdateMessage, setCategoryUpdateMessage] = useState<string | null>(null)
//   const [updatingCategory, setUpdatingCategory] = useState(false)

//   useEffect(() => {
//     const fetchProduct = async () => {
//       try {
//         const res = await apiClient.get(`/api/seller/products/${productId}`)
//         console.log('✅ PRODUCT FETCH RESPONSE', res.data)
//         setProduct(res.data.data)
//         setNewTitle(res.data.data.title)
//         setNewDescription(res.data.data.description)
//         setSelectedCategoryId(res.data.data.category_id)
//       } catch (err: any) {
//         console.error('❌ PRODUCT FETCH ERROR', err)
//         setError(err?.response?.data?.message || 'Failed to load product')
//       } finally {
//         setLoading(false)
//       }
//     }

//     if (productId) fetchProduct()
//   }, [productId])

//   useEffect(() => {
//     const fetchCategories = async () => {
//       try {
//         const res = await apiClient.get('/api/categories/tree', { baseURL: undefined })
//         setCategoryTree(res.data.data)
//       } catch (err) {
//         console.error('❌ Failed to load categories')
//       }
//     }
//     fetchCategories()
//   }, [])

//   const handleUpdateProductInfo = async () => {
//     setUpdateError(null)
//     setSuccessMsg(null)

//     if (newTitle === product.title && newDescription === product.description) {
//       setUpdateError('No changes made to title or description')
//       return
//     }

//     const payload: any = {}
//     if (newTitle !== product.title) payload.title = newTitle
//     if (newDescription !== product.description) payload.description = newDescription

//     try {
//       setUpdating(true)
//       const res = await apiClient.put(`/api/seller/products/${productId}`, payload)
//       console.log('✅ PRODUCT UPDATE RESPONSE', res.data)
//       setSuccessMsg('Product info updated successfully')
//       setProduct({ ...product, ...payload })
//       setEditing(false)
//     } catch (err: any) {
//       setUpdateError(err?.response?.data?.message || 'Failed to update product info')
//     } finally {
//       setUpdating(false)
//     }
//   }

//   const renderCategoryOptions = (nodes: CategoryNode[], level = 0): JSX.Element[] => {
//   return nodes.flatMap((node) => {
//     const prefix = '—'.repeat(level)
//     const self = (
//       <option
//         key={node.id}
//         value={node.id}
//         disabled={!node.is_leaf}
//       >
//         {prefix} {node.name} {node.is_leaf ? '' : '(not leaf)'}
//       </option>
//     )
//     return [self, ...renderCategoryOptions(node.children, level + 1)]
//   })
// }


//   const handleCategoryUpdate = async () => {
//     setCategoryUpdateMessage(null)
//     if (!selectedCategoryId) return
//     if (selectedCategoryId === product.category_id) {
//       setCategoryUpdateMessage('Please choose a different category')
//       return
//     }
//     try {
//       setUpdatingCategory(true)
//       const res = await apiClient.put(`/api/seller/products/${productId}/category`, {
//         category_id: selectedCategoryId
//       })
//       setProduct({ ...product, category_id: selectedCategoryId })
//       setCategoryUpdateMessage('✅ Category updated successfully')
//     } catch (err: any) {
//       setCategoryUpdateMessage(err?.response?.data?.message || 'Failed to update category')
//     } finally {
//       setUpdatingCategory(false)
//     }
//   }

//   if (loading) return <p className="p-8">Loading product...</p>
//   if (error) return <p className="p-8 text-red-600">{error}</p>

//   return (
//     <div className="max-w-4xl mx-auto p-8 space-y-6">
//       <h1 className="text-3xl font-bold">🧾 Product Detail (Seller)</h1>

      // <div className="border rounded-lg p-6 bg-white shadow space-y-4">
      //   {!editing ? (
      //     <>
      //       <h2 className="text-2xl font-semibold">{product.title}</h2>
      //       <p className="text-gray-700">{product.description}</p>
      //       <p className="text-sm text-gray-500">Category: {product.category_name}</p>

      //       <button
      //         onClick={() => setEditing(true)}
      //         className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      //       >
      //         ✏️ Update Product Info
      //       </button>
      //     </>
      //   ) : (
      //     <>
      //       <div className="space-y-2">
      //         <input
      //           type="text"
      //           value={newTitle}
      //           onChange={(e) => setNewTitle(e.target.value)}
      //           className="w-full border rounded px-3 py-2"
      //           placeholder="Title"
      //         />
      //         <textarea
      //           value={newDescription}
      //           onChange={(e) => setNewDescription(e.target.value)}
      //           className="w-full border rounded px-3 py-2"
      //           placeholder="Description"
      //           rows={4}
      //         />

      //         {updateError && <p className="text-red-600 text-sm">{updateError}</p>}
      //         {successMsg && <p className="text-green-600 text-sm">{successMsg}</p>}

      //         <div className="flex gap-3 mt-2">
      //           <button
      //             onClick={handleUpdateProductInfo}
      //             className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      //             disabled={updating}
      //           >
      //             {updating ? 'Updating…' : '✅ Update'}
      //           </button>

      //           <button
      //             onClick={() => {
      //               setEditing(false)
      //               setNewTitle(product.title)
      //               setNewDescription(product.description)
      //             }}
      //             className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
      //           >
      //             ❌ Cancel
      //           </button>
      //         </div>
      //       </div>
      //     </>
      //   )}
      // </div>

      // <div className="border rounded-lg p-6 bg-white shadow space-y-4">
      //   <h2 className="text-xl font-semibold">🌳 Update Product Category</h2>
      //   <select
      //     className="w-full border px-3 py-2 rounded"
      //     value={selectedCategoryId}
      //     onChange={(e) => setSelectedCategoryId(e.target.value)}
      //   >
      //     <option value="">Select a category</option>
      //     {renderCategoryOptions(categoryTree)}
      //   </select>

      //   {categoryUpdateMessage && (
      //     <p className="text-sm text-blue-600 mt-1">{categoryUpdateMessage}</p>
      //   )}

      //   <button
      //     className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
      //     onClick={handleCategoryUpdate}
      //     disabled={updatingCategory}
      //   >
      //     {updatingCategory ? 'Updating…' : '🔁 Update Category'}
      //   </button>
      // </div>

//       <div>
//         <h3 className="font-semibold mb-2">🔍 Raw API Response (Debug)</h3>
//         <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
//           {JSON.stringify(product, null, 2)}
//         </pre>
//       </div>
//     </div>
//   )
// }


// // app/seller/products/[product_id]/page.tsx
// 'use client'

// import { useEffect, useState } from 'react'
// import { useParams } from 'next/navigation'
// import apiClient from '@/lib/apiClient'

// export default function ViewCreatedProductPage() {
//   const params = useParams()
//   const productId = params?.product_id as string

//   const [product, setProduct] = useState<any>(null)
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState<string | null>(null)

//   const [editing, setEditing] = useState(false)
//   const [newTitle, setNewTitle] = useState('')
//   const [newDescription, setNewDescription] = useState('')
//   const [updateError, setUpdateError] = useState<string | null>(null)
//   const [updating, setUpdating] = useState(false)
//   const [successMsg, setSuccessMsg] = useState<string | null>(null)

//   useEffect(() => {
//     const fetchProduct = async () => {
//       try {
//         const res = await apiClient.get(`/api/seller/products/${productId}`)
//         console.log('✅ PRODUCT FETCH RESPONSE', res.data)
//         setProduct(res.data.data)
//         setNewTitle(res.data.data.title)
//         setNewDescription(res.data.data.description)
//       } catch (err: any) {
//         console.error('❌ PRODUCT FETCH ERROR', err)
//         setError(err?.response?.data?.message || 'Failed to load product')
//       } finally {
//         setLoading(false)
//       }
//     }

//     if (productId) fetchProduct()
//   }, [productId])

//   const handleUpdateProductInfo = async () => {
//     setUpdateError(null)
//     setSuccessMsg(null)

//     if (newTitle === product.title && newDescription === product.description) {
//       setUpdateError('No changes made to title or description')
//       return
//     }

//     const payload: any = {}
//     if (newTitle !== product.title) payload.title = newTitle
//     if (newDescription !== product.description) payload.description = newDescription

//     try {
//       setUpdating(true)
//       const res = await apiClient.put(`/api/seller/products/${productId}`, payload)
//       console.log('✅ PRODUCT UPDATE RESPONSE', res.data)
//       setSuccessMsg('Product info updated successfully')
//       setProduct({ ...product, ...payload })
//       setEditing(false)
//     } catch (err: any) {
//       setUpdateError(err?.response?.data?.message || 'Failed to update product info')
//     } finally {
//       setUpdating(false)
//     }
//   }

//   if (loading) return <p className="p-8">Loading product...</p>
//   if (error) return <p className="p-8 text-red-600">{error}</p>

//   return (
//     <div className="max-w-4xl mx-auto p-8 space-y-6">
//       <h1 className="text-3xl font-bold">🧾 Product Detail (Seller)</h1>

//       <div className="border rounded-lg p-6 bg-white shadow space-y-4">
//         {!editing ? (
//           <>
//             <h2 className="text-2xl font-semibold">{product.title}</h2>
//             <p className="text-gray-700">{product.description}</p>
//             <p className="text-sm text-gray-500">Category: {product.category_name}</p>

//             <button
//               onClick={() => setEditing(true)}
//               className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
//             >
//               ✏️ Update Product Info
//             </button>
//           </>
//         ) : (
//           <>
//             <div className="space-y-2">
//               <input
//                 type="text"
//                 value={newTitle}
//                 onChange={(e) => setNewTitle(e.target.value)}
//                 className="w-full border rounded px-3 py-2"
//                 placeholder="Title"
//               />
//               <textarea
//                 value={newDescription}
//                 onChange={(e) => setNewDescription(e.target.value)}
//                 className="w-full border rounded px-3 py-2"
//                 placeholder="Description"
//                 rows={4}
//               />

//               {updateError && <p className="text-red-600 text-sm">{updateError}</p>}
//               {successMsg && <p className="text-green-600 text-sm">{successMsg}</p>}

//               <div className="flex gap-3 mt-2">
//                 <button
//                   onClick={handleUpdateProductInfo}
//                   className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
//                   disabled={updating}
//                 >
//                   {updating ? 'Updating…' : '✅ Update'}
//                 </button>

//                 <button
//                   onClick={() => {
//                     setEditing(false)
//                     setNewTitle(product.title)
//                     setNewDescription(product.description)
//                   }}
//                   className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
//                 >
//                   ❌ Cancel
//                 </button>
//               </div>
//             </div>
//           </>
//         )}
//       </div>

//       <div>
//         <h3 className="font-semibold mb-2">🔍 Raw API Response (Debug)</h3>
//         <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
//           {JSON.stringify(product, null, 2)}
//         </pre>
//       </div>
//     </div>
//   )
// }
