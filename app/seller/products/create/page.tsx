'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import apiClient from '@/lib/apiClient'
import Image from 'next/image'

interface CategoryNode {
  id: string
  name: string
  slug: string
  level: number
  is_leaf: boolean
  children: CategoryNode[]
}

interface Variant {
  color: string
  size: string
  retail_price: number | ''
  in_stock: boolean
  stock_quantity: number
  weight_grams: number

  enableRetailDiscount: boolean
  retail_discount?: number
  retail_discount_type?: 'flat' | 'percentage'

  enableWholesale: boolean
  wholesale_price?: number
  min_qty_wholesale?: number

  enableWholesaleDiscount: boolean
  wholesale_discount?: number
  wholesale_discount_type?: 'flat' | 'percentage'
}

export default function CreateProductPage() {
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const [categories, setCategories] = useState<CategoryNode[]>([])
  const [categoryPath, setCategoryPath] = useState<CategoryNode[]>([])
  const selectedCategory = categoryPath.at(-1)

//   const [images, setImages] = useState<File[]>([])
//   const [video, setVideo] = useState<File | null>(null)

  const [images, setImages] = useState<string[]>([])  // media_urls, not Files
  const [video, setVideo] = useState<string | null>(null)


  const [variants, setVariants] = useState<Variant[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /* ---------------- FETCH CATEGORIES ---------------- */
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await apiClient.get('/api/categories/tree')
        setCategories(res.data.data)
      } catch (err) {
        console.error('Failed to fetch categories', err)
      }
    }
    fetchCategories()
  }, [])

  const handleSelectCategory = (cat: CategoryNode) => {
    setCategoryPath((prev) => [...prev, cat])
  }

  const resetCategoryFromLevel = (level: number) => {
    setCategoryPath((prev) => prev.slice(0, level))
  }

  /* ---------------- MEDIA UPLOAD ---------------- */

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

  /* ---------------- VARIANT HANDLERS ---------------- */

  const addVariant = () => {
    setVariants((prev) => [
      ...prev,
      {
        color: '',
        size: '',
        retail_price: '',
        in_stock: true,
        stock_quantity: 0,
        weight_grams: 0,
        enableRetailDiscount: false,
        enableWholesale: false,
        enableWholesaleDiscount: false,
      },
    ])
  }

  const removeVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index))
  }

  const updateVariant = <K extends keyof Variant>(
    index: number,
    key: K,
    value: Variant[K]
  ) => {
    const updated = [...variants]
    updated[index] = { ...updated[index], [key]: value }
    setVariants(updated)
  }


  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = Array.from(e.target.files || [])
  const uploaded: string[] = []

  for (const file of files) {
    try {
      const url = await uploadMedia(file, 'image')
      uploaded.push(url)
    } catch (err) {
      console.error('Image upload failed', err)
      setError('Failed to upload one or more images.')
    }
  }

  setImages(prev => [...prev, ...uploaded])
}

const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (!file) return

  try {
    const url = await uploadMedia(file, 'video')
    setVideo(url)
  } catch (err) {
    console.error('Video upload failed', err)
    setError('Failed to upload video.')
  }
}


  /* ---------------- SUBMIT (DEBUG ONLY) ---------------- */

  const handleSubmit = async () => {
  setLoading(true)
  setError(null)

  try {
    if (!selectedCategory?.is_leaf) {
      setError('Please select a leaf category')
      return
    }

    if (images.length < 1) {
      setError('At least one product image is required')
      return
    }

    if (variants.length < 1) {
      setError('At least one variant is required')
      return
    }

    // // Upload images
    // const image_urls = await Promise.all(
    //   images.map((img) => uploadMedia(img, 'image'))
    // )

    // // Upload video if available
    // let promo_video_url: string | undefined
    // if (video) {
    //   promo_video_url = await uploadMedia(video, 'video')
    // }

    // const image_urls = await Promise.all(
    //   images.map((img) => uploadMedia(img, 'image'))
    // )

    // let promo_video_url: string | undefined
    // if (video) promo_video_url = await uploadMedia(video, 'video')


    // ✅ Skip re-uploading — already uploaded at selection
    const image_urls = images
    const promo_video_url = video || undefined


    // Prepare variants
    const payloadVariants = variants.map((v) => ({
      color: v.color,
      size: v.size,
      retail_price: v.retail_price,
      in_stock: v.in_stock,
      stock_quantity: v.stock_quantity,
      weight_grams: v.weight_grams,

      retail_discount: v.enableRetailDiscount ? v.retail_discount : undefined,
      retail_discount_type: v.enableRetailDiscount
        ? v.retail_discount_type
        : undefined,

      wholesale_price: v.enableWholesale ? v.wholesale_price : undefined,
      min_qty_wholesale: v.enableWholesale ? v.min_qty_wholesale : undefined,

      wholesale_discount:
        v.enableWholesale && v.enableWholesaleDiscount
          ? v.wholesale_discount
          : undefined,
      wholesale_discount_type:
        v.enableWholesale && v.enableWholesaleDiscount
          ? v.wholesale_discount_type
          : undefined,
    }))

    // 🔥 Hit product creation endpoint
    const response = await apiClient.post('/api/seller/products', {
      category_id: selectedCategory.id,
      title,
      description,
      image_urls,
      promo_video_url,
      variants: payloadVariants,
    })

    const createdProduct = response.data.data
    console.log('✅ Created Product:', createdProduct)

    // Redirect to dummy product preview page with ID
    router.push(`/seller/products/view/${createdProduct.id}`)

  } catch (err: any) {
    console.error(err)
    setError(err?.response?.data?.message || 'Failed to create product')
  } finally {
    setLoading(false)
  }
}


//   const handleSubmit = async () => {
//     console.log('handle submit worked at least')
//     setError(null)

//     if (!selectedCategory?.is_leaf) {
//       setError('Please select a leaf category')
//       return
//     }

//     if (images.length < 1) {
//       setError('At least one product image is required')
//       return
//     }
//     if (variants.length < 1) {
//       setError('At least one variant is required')
//       return
//     }

//     // const image_urls = await Promise.all(
//     //   images.map((img) => uploadMedia(img, 'image'))
//     // )

//     // let promo_video_url: string | undefined
//     // if (video) promo_video_url = await uploadMedia(video, 'video')

//     const payloadVariants = variants.map((v) => ({
//       color: v.color,
//       size: v.size,
//       retail_price: v.retail_price,
//       in_stock: v.in_stock,
//       stock_quantity: v.stock_quantity,
//       weight_grams: v.weight_grams,

//       retail_discount: v.enableRetailDiscount ? v.retail_discount : undefined,
//       retail_discount_type: v.enableRetailDiscount
//         ? v.retail_discount_type
//         : undefined,

//       wholesale_price: v.enableWholesale ? v.wholesale_price : undefined,
//       min_qty_wholesale: v.enableWholesale ? v.min_qty_wholesale : undefined,

//       wholesale_discount:
//         v.enableWholesale && v.enableWholesaleDiscount
//           ? v.wholesale_discount
//           : undefined,
//       wholesale_discount_type:
//         v.enableWholesale && v.enableWholesaleDiscount
//           ? v.wholesale_discount_type
//           : undefined,
//     }))

//     // const fullPayload = {
//     //   title,
//     //   description,
//     //   category_id: selectedCategory.id,
//     //   image_urls,
//     //   promo_video_url,
//     //   variants: payloadVariants,
//     // }

//     const fullPayload = {
//         title,
//         description,
//         category_id: selectedCategory.id,
//         image_urls: images,
//         promo_video_url: video || undefined,
//         variants: payloadVariants,
//     }


//     console.log('🧪 FINAL PAYLOAD', fullPayload)
//   }

  /* ---------------- UI ---------------- */

  return (
  <div className="max-w-5xl mx-auto p-8 space-y-10">
    <h1 className="text-4xl font-bold mb-6 text-gray-800">🛠️ Create New Product</h1>

    {error && <p className="text-red-600 font-semibold">{error}</p>}

    {/* PRODUCT INFO */}
    <section className="bg-white shadow-md rounded-xl p-6 space-y-4 border border-gray-200">
      <label className="font-semibold text-lg text-gray-700">Product Title</label>
      <input className="input bg-gray-50 border border-gray-300 rounded-md px-4 py-2" value={title} onChange={(e) => setTitle(e.target.value)} />

      <label className="font-semibold text-lg text-gray-700">Product Description</label>
      <textarea className="input bg-gray-50 border border-gray-300 rounded-md px-4 py-2" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
    </section>

    {/* CATEGORY */}
    <section className="bg-white shadow-md rounded-xl p-6 space-y-4 border border-gray-200">
      <h2 className="text-2xl font-semibold text-gray-800">Category</h2>

      <div className="flex flex-wrap gap-2">
        {categoryPath.map((cat, i) => (
          <button
            key={cat.id}
            onClick={() => resetCategoryFromLevel(i)}
            className="text-sm text-blue-600 underline hover:text-blue-800"
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mt-2">
        {(categoryPath.length === 0 ? categories : categoryPath.at(-1)?.children || []).map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleSelectCategory(cat)}
            className="border px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200"
          >
            {cat.name}
          </button>
        ))}
      </div>

      {selectedCategory?.is_leaf && (
        <p className="text-green-600 text-sm font-medium">
          ✅ Selected: {selectedCategory.name}
        </p>
      )}
    </section>

    {/* IMAGES */}
    <section className="bg-white shadow-md rounded-xl p-6 border border-gray-200">
      <h2 className="text-2xl font-semibold text-gray-800 mb-3">Product Images</h2>
      <input type="file" multiple accept="image/*" onChange={handleImageSelect} className="mb-4" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {images.map((img, i) => (
          <div key={i} className="relative border rounded-lg overflow-hidden">
            <Image
              src={img}
              alt={`Product image ${i + 1}`}
              width={300}
              height={200}
              className="h-32 w-full object-cover"
              unoptimized
            />
            {images.length > 1 && (
              <button
                onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                className="absolute top-2 right-2 text-xs bg-red-600 text-white px-2 py-1 rounded-md"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
    </section>

    {/* VIDEO */}
    <section className="bg-white shadow-md rounded-xl p-6 border border-gray-200">
      <h2 className="text-2xl font-semibold text-gray-800 mb-3">Promo Video (Optional)</h2>
      {!video ? (
        <input type="file" accept="video/mp4" onChange={handleVideoSelect} />
      ) : (
        <div className="flex items-center gap-4">
          <span className="text-sm truncate text-gray-700">{video.split('/').pop()}</span>
          <button onClick={() => setVideo(null)} className="text-red-600 text-sm hover:underline">
            Remove
          </button>
        </div>
      )}
    </section>

    {/* VARIANTS */}
    <section className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800">Variants</h2>

      {variants.map((v, i) => (
        <div key={i} className="border rounded-xl shadow-sm bg-white p-6 space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Variant #{i + 1}</h3>
            <button onClick={() => removeVariant(i)} className="text-red-500 hover:underline text-sm">
              ✕ Remove
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <input placeholder="Color" className="input bg-gray-50 border border-gray-300 rounded-md px-4 py-2" onChange={(e) => updateVariant(i, 'color', e.target.value)} />
            <input placeholder="Size" className="input bg-gray-50 border border-gray-300 rounded-md px-4 py-2" onChange={(e) => updateVariant(i, 'size', e.target.value)} />
          </div>

          <input type="number" placeholder="Retail Price" className="input bg-gray-50 border border-gray-300 rounded-md px-4 py-2 w-full" onChange={(e) => updateVariant(i, 'retail_price', Number(e.target.value))} />

          <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
            <input type="checkbox" checked={v.enableRetailDiscount} onChange={() => updateVariant(i, 'enableRetailDiscount', !v.enableRetailDiscount)} />
            💸 Add Retail Discount
          </label>

          {v.enableRetailDiscount && (
            <div className="grid grid-cols-2 gap-4">
              <input type="number" placeholder="Discount" className="input bg-gray-50 border border-gray-300 rounded-md px-4 py-2" onChange={(e) => updateVariant(i, 'retail_discount', Number(e.target.value))} />
              <select className="input bg-gray-50 border border-gray-300 rounded-md px-4 py-2" onChange={(e) => updateVariant(i, 'retail_discount_type', e.target.value as any)}>
                <option value="flat">Flat</option>
                <option value="percentage">Percentage</option>
              </select>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
            <input type="checkbox" checked={v.enableWholesale} onChange={() => updateVariant(i, 'enableWholesale', !v.enableWholesale)} />
            🧺 Enable Wholesale
          </label>

          {v.enableWholesale && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder="Wholesale Price" className="input bg-gray-50 border border-gray-300 rounded-md px-4 py-2" onChange={(e) => updateVariant(i, 'wholesale_price', Number(e.target.value))} />
                <input type="number" placeholder="Min Qty" className="input bg-gray-50 border border-gray-300 rounded-md px-4 py-2" onChange={(e) => updateVariant(i, 'min_qty_wholesale', Number(e.target.value))} />
              </div>

              <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <input type="checkbox" checked={v.enableWholesaleDiscount} onChange={() => updateVariant(i, 'enableWholesaleDiscount', !v.enableWholesaleDiscount)} />
                🎯 Add Wholesale Discount
              </label>

              {v.enableWholesaleDiscount && (
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" placeholder="Wholesale Discount" className="input bg-gray-50 border border-gray-300 rounded-md px-4 py-2" onChange={(e) => updateVariant(i, 'wholesale_discount', Number(e.target.value))} />
                  <select className="input bg-gray-50 border border-gray-300 rounded-md px-4 py-2" onChange={(e) => updateVariant(i, 'wholesale_discount_type', e.target.value as any)}>
                    <option value="flat">Flat</option>
                    <option value="percentage">Percentage</option>
                  </select>
                </div>
              )}
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <input type="number" placeholder="Stock Quantity" className="input bg-gray-50 border border-gray-300 rounded-md px-4 py-2" onChange={(e) => updateVariant(i, 'stock_quantity', Number(e.target.value))} />
            <input type="number" placeholder="Weight (grams)" className="input bg-gray-50 border border-gray-300 rounded-md px-4 py-2" onChange={(e) => updateVariant(i, 'weight_grams', Number(e.target.value))} />
          </div>
        </div>
      ))}

      <button onClick={addVariant} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-md transition duration-200">
        ➕ Add New Variant
      </button>
    </section>

    <button
      type="button"
      onClick={handleSubmit}
      disabled={loading}
      className="bg-black text-white px-6 py-3 rounded text-lg hover:bg-gray-900 transition duration-200"
    >
      {loading ? 'Creating…' : 'Create Product'}
    </button>
  </div>
);

}

// 'use client'

// import { useEffect, useState } from 'react'
// import { useRouter } from 'next/navigation'
// import axios from 'axios'
// import apiClient from '@/lib/apiClient'
// import Image from 'next/image'

// interface CategoryNode {
//   id: string
//   name: string
//   slug: string
//   level: number
//   is_leaf: boolean
//   children: CategoryNode[]
// }

// interface Variant {
//   color: string
//   size: string
//   retail_price: number | ''
//   in_stock: boolean
//   stock_quantity: number
//   weight_grams: number

//   enableRetailDiscount: boolean
//   retail_discount?: number
//   retail_discount_type?: 'flat' | 'percentage'

//   enableWholesale: boolean
//   wholesale_price?: number
//   min_qty_wholesale?: number

//   enableWholesaleDiscount: boolean
//   wholesale_discount?: number
//   wholesale_discount_type?: 'flat' | 'percentage'
// }

// export default function CreateProductPage() {
//   const router = useRouter()

//   const [title, setTitle] = useState('')
//   const [description, setDescription] = useState('')

//   const [categories, setCategories] = useState<CategoryNode[]>([])
//   const [categoryPath, setCategoryPath] = useState<CategoryNode[]>([])
//   const selectedCategory = categoryPath.at(-1)

// //   const [images, setImages] = useState<File[]>([])
// //   const [video, setVideo] = useState<File | null>(null)

//   const [images, setImages] = useState<string[]>([])  // media_urls, not Files
//   const [video, setVideo] = useState<string | null>(null)


//   const [variants, setVariants] = useState<Variant[]>([])
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState<string | null>(null)

//   /* ---------------- FETCH CATEGORIES ---------------- */
//   useEffect(() => {
//     const fetchCategories = async () => {
//       try {
//         const res = await apiClient.get('/api/categories/tree')
//         setCategories(res.data.data)
//       } catch (err) {
//         console.error('Failed to fetch categories', err)
//       }
//     }
//     fetchCategories()
//   }, [])

//   const handleSelectCategory = (cat: CategoryNode) => {
//     setCategoryPath((prev) => [...prev, cat])
//   }

//   const resetCategoryFromLevel = (level: number) => {
//     setCategoryPath((prev) => prev.slice(0, level))
//   }

//   /* ---------------- MEDIA UPLOAD ---------------- */

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

//   /* ---------------- VARIANT HANDLERS ---------------- */

//   const addVariant = () => {
//     setVariants((prev) => [
//       ...prev,
//       {
//         color: '',
//         size: '',
//         retail_price: '',
//         in_stock: true,
//         stock_quantity: 0,
//         weight_grams: 0,
//         enableRetailDiscount: false,
//         enableWholesale: false,
//         enableWholesaleDiscount: false,
//       },
//     ])
//   }

//   const removeVariant = (index: number) => {
//     setVariants((prev) => prev.filter((_, i) => i !== index))
//   }

//   const updateVariant = <K extends keyof Variant>(
//     index: number,
//     key: K,
//     value: Variant[K]
//   ) => {
//     const updated = [...variants]
//     updated[index] = { ...updated[index], [key]: value }
//     setVariants(updated)
//   }


//   const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
//   const files = Array.from(e.target.files || [])
//   const uploaded: string[] = []

//   for (const file of files) {
//     try {
//       const url = await uploadMedia(file, 'image')
//       uploaded.push(url)
//     } catch (err) {
//       console.error('Image upload failed', err)
//       setError('Failed to upload one or more images.')
//     }
//   }

//   setImages(prev => [...prev, ...uploaded])
// }

// const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
//   const file = e.target.files?.[0]
//   if (!file) return

//   try {
//     const url = await uploadMedia(file, 'video')
//     setVideo(url)
//   } catch (err) {
//     console.error('Video upload failed', err)
//     setError('Failed to upload video.')
//   }
// }


//   /* ---------------- SUBMIT (DEBUG ONLY) ---------------- */

//   const handleSubmit = async () => {
//   setLoading(true)
//   setError(null)

//   try {
//     if (!selectedCategory?.is_leaf) {
//       setError('Please select a leaf category')
//       return
//     }

//     if (images.length < 1) {
//       setError('At least one product image is required')
//       return
//     }

//     if (variants.length < 1) {
//       setError('At least one variant is required')
//       return
//     }

//     // // Upload images
//     // const image_urls = await Promise.all(
//     //   images.map((img) => uploadMedia(img, 'image'))
//     // )

//     // // Upload video if available
//     // let promo_video_url: string | undefined
//     // if (video) {
//     //   promo_video_url = await uploadMedia(video, 'video')
//     // }

//     // const image_urls = await Promise.all(
//     //   images.map((img) => uploadMedia(img, 'image'))
//     // )

//     // let promo_video_url: string | undefined
//     // if (video) promo_video_url = await uploadMedia(video, 'video')


//     // ✅ Skip re-uploading — already uploaded at selection
//     const image_urls = images
//     const promo_video_url = video || undefined


//     // Prepare variants
//     const payloadVariants = variants.map((v) => ({
//       color: v.color,
//       size: v.size,
//       retail_price: v.retail_price,
//       in_stock: v.in_stock,
//       stock_quantity: v.stock_quantity,
//       weight_grams: v.weight_grams,

//       retail_discount: v.enableRetailDiscount ? v.retail_discount : undefined,
//       retail_discount_type: v.enableRetailDiscount
//         ? v.retail_discount_type
//         : undefined,

//       wholesale_price: v.enableWholesale ? v.wholesale_price : undefined,
//       min_qty_wholesale: v.enableWholesale ? v.min_qty_wholesale : undefined,

//       wholesale_discount:
//         v.enableWholesale && v.enableWholesaleDiscount
//           ? v.wholesale_discount
//           : undefined,
//       wholesale_discount_type:
//         v.enableWholesale && v.enableWholesaleDiscount
//           ? v.wholesale_discount_type
//           : undefined,
//     }))

//     // 🔥 Hit product creation endpoint
//     const response = await apiClient.post('/api/seller/products', {
//       category_id: selectedCategory.id,
//       title,
//       description,
//       image_urls,
//       promo_video_url,
//       variants: payloadVariants,
//     })

//     const createdProduct = response.data.data
//     console.log('✅ Created Product:', createdProduct)

//     // Redirect to dummy product preview page with ID
//     router.push(`/seller/products/view/${createdProduct.id}`)

//   } catch (err: any) {
//     console.error(err)
//     setError(err?.response?.data?.message || 'Failed to create product')
//   } finally {
//     setLoading(false)
//   }
// }


// //   const handleSubmit = async () => {
// //     console.log('handle submit worked at least')
// //     setError(null)

// //     if (!selectedCategory?.is_leaf) {
// //       setError('Please select a leaf category')
// //       return
// //     }

// //     if (images.length < 1) {
// //       setError('At least one product image is required')
// //       return
// //     }
// //     if (variants.length < 1) {
// //       setError('At least one variant is required')
// //       return
// //     }

// //     // const image_urls = await Promise.all(
// //     //   images.map((img) => uploadMedia(img, 'image'))
// //     // )

// //     // let promo_video_url: string | undefined
// //     // if (video) promo_video_url = await uploadMedia(video, 'video')

// //     const payloadVariants = variants.map((v) => ({
// //       color: v.color,
// //       size: v.size,
// //       retail_price: v.retail_price,
// //       in_stock: v.in_stock,
// //       stock_quantity: v.stock_quantity,
// //       weight_grams: v.weight_grams,

// //       retail_discount: v.enableRetailDiscount ? v.retail_discount : undefined,
// //       retail_discount_type: v.enableRetailDiscount
// //         ? v.retail_discount_type
// //         : undefined,

// //       wholesale_price: v.enableWholesale ? v.wholesale_price : undefined,
// //       min_qty_wholesale: v.enableWholesale ? v.min_qty_wholesale : undefined,

// //       wholesale_discount:
// //         v.enableWholesale && v.enableWholesaleDiscount
// //           ? v.wholesale_discount
// //           : undefined,
// //       wholesale_discount_type:
// //         v.enableWholesale && v.enableWholesaleDiscount
// //           ? v.wholesale_discount_type
// //           : undefined,
// //     }))

// //     // const fullPayload = {
// //     //   title,
// //     //   description,
// //     //   category_id: selectedCategory.id,
// //     //   image_urls,
// //     //   promo_video_url,
// //     //   variants: payloadVariants,
// //     // }

// //     const fullPayload = {
// //         title,
// //         description,
// //         category_id: selectedCategory.id,
// //         image_urls: images,
// //         promo_video_url: video || undefined,
// //         variants: payloadVariants,
// //     }


// //     console.log('🧪 FINAL PAYLOAD', fullPayload)
// //   }

//   /* ---------------- UI ---------------- */

//   return (
//     <div className="max-w-5xl mx-auto p-8 space-y-10">
//       <h1 className="text-4xl font-bold">🛠️ Create New Product</h1>

//       {error && <p className="text-red-600">{error}</p>}

//       {/* PRODUCT INFO */}
//       <section className="space-y-4">
//         <label className="font-semibold text-lg">Product Title</label>
//         <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />

//         <label className="font-semibold text-lg">Description</label>
//         <textarea className="input" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
//       </section>

//       {/* CATEGORY */}
//       <section className="space-y-3">
//         <h2 className="text-2xl font-semibold">Category</h2>

//         {categoryPath.map((cat, i) => (
//           <button
//             key={cat.id}
//             onClick={() => resetCategoryFromLevel(i)}
//             className="text-sm text-blue-600 underline mr-2"
//           >
//             {cat.name}
//           </button>
//         ))}

//         <div className="flex flex-wrap gap-3 mt-2">
//           {(categoryPath.length === 0 ? categories : categoryPath.at(-1)?.children || []).map(
//             (cat) => (
//               <button
//                 key={cat.id}
//                 onClick={() => handleSelectCategory(cat)}
//                 className="border px-4 py-2 rounded hover:bg-gray-100"
//               >
//                 {cat.name}
//               </button>
//             )
//           )}
//         </div>

//         {selectedCategory?.is_leaf && (
//           <p className="text-green-600 text-sm">
//             ✅ Selected: {selectedCategory.name}
//           </p>
//         )}
//       </section>

//       {/* IMAGE & VIDEO HANDLING REMAINS SAME */}
//       {/* VARIANT HANDLING REMAINS SAME */}
//       {/* SUBMIT BUTTON REMAINS SAME */}

//       {/* ... retain rest of your existing JSX from previous file ... */}
//             {/* IMAGES */}
//       <section>
//         <h2 className="text-2xl font-semibold mb-3">Product Images</h2>
//         <input type="file" multiple accept="image/*" onChange={handleImageSelect} />

//         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
//           {images.map((img, i) => (
//             <div key={i} className="relative border rounded p-2">
//               <Image
//                 src={img}
//                 alt={`Product image ${i + 1}`}
//                 width={300}
//                 height={200}
//                 className="h-32 w-full object-cover rounded"
//                 unoptimized
//               />
//               {images.length > 1 && (
//                 <button
//                   onClick={() => setImages(images.filter((_, idx) => idx !== i))}
//                   className="absolute top-1 right-1 text-xs bg-red-600 text-white px-2 py-1 rounded"
//                 >
//                   Remove
//                 </button>
//               )}
//             </div>
//           ))}
//         </div>
//       </section>

//       {/* VIDEO */}
//       <section>
//         <h2 className="text-2xl font-semibold mb-3">Promo Video (Optional)</h2>
//         {!video ? (
//           <input type="file" accept="video/mp4" onChange={handleVideoSelect} />
//         ) : (
//           <div className="flex items-center gap-4">
//             {/* <span className="text-sm">{video.name}</span> */}
//             <span className="text-sm truncate">
//                {video.split('/').pop()}
//             </span>

//             <button onClick={() => setVideo(null)} className="text-red-600 text-sm">
//               Remove
//             </button>
//           </div>
//         )}
//       </section>

//       {/* VARIANTS */}
//       <section className="space-y-6">
//         <h2 className="text-2xl font-semibold">Variants</h2>

//         {variants.map((v, i) => (
//           <div key={i} className="border rounded-lg p-6 space-y-4">
//             <div className="flex justify-between items-center">
//               <h3 className="font-semibold">Variant #{i + 1}</h3>
//               <button onClick={() => removeVariant(i)} className="text-red-600 text-sm">
//                 Remove
//               </button>
//             </div>

//             <div className="grid grid-cols-2 gap-4">
//               <input placeholder="Color" className="input" onChange={(e) => updateVariant(i, 'color', e.target.value)} />
//               <input placeholder="Size" className="input" onChange={(e) => updateVariant(i, 'size', e.target.value)} />
//             </div>

//             <input type="number" placeholder="Retail Price" className="input" onChange={(e) => updateVariant(i, 'retail_price', Number(e.target.value))} />

//             <label className="flex gap-2">
//               <input type="checkbox" checked={v.enableRetailDiscount} onChange={() => updateVariant(i, 'enableRetailDiscount', !v.enableRetailDiscount)} />
//               Add Retail Discount
//             </label>

//             {v.enableRetailDiscount && (
//               <div className="grid grid-cols-2 gap-4">
//                 <input type="number" placeholder="Discount" className="input" onChange={(e) => updateVariant(i, 'retail_discount', Number(e.target.value))} />
//                 <select className="input" onChange={(e) => updateVariant(i, 'retail_discount_type', e.target.value as any)}>
//                   <option value="flat">Flat</option>
//                   <option value="percentage">Percentage</option>
//                 </select>
//               </div>
//             )}

//             <label className="flex gap-2">
//               <input type="checkbox" checked={v.enableWholesale} onChange={() => updateVariant(i, 'enableWholesale', !v.enableWholesale)} />
//               Enable Wholesale
//             </label>

//             {v.enableWholesale && (
//               <>
//                 <div className="grid grid-cols-2 gap-4">
//                   <input type="number" placeholder="Wholesale Price" className="input" onChange={(e) => updateVariant(i, 'wholesale_price', Number(e.target.value))} />
//                   <input type="number" placeholder="Min Qty" className="input" onChange={(e) => updateVariant(i, 'min_qty_wholesale', Number(e.target.value))} />
//                 </div>

//                 <label className="flex gap-2">
//                   <input type="checkbox" checked={v.enableWholesaleDiscount} onChange={() => updateVariant(i, 'enableWholesaleDiscount', !v.enableWholesaleDiscount)} />
//                   Add Wholesale Discount
//                 </label>

//                 {v.enableWholesaleDiscount && (
//                   <div className="grid grid-cols-2 gap-4">
//                     <input type="number" placeholder="Wholesale Discount" className="input" onChange={(e) => updateVariant(i, 'wholesale_discount', Number(e.target.value))} />
//                     <select className="input" onChange={(e) => updateVariant(i, 'wholesale_discount_type', e.target.value as any)}>
//                       <option value="flat">Flat</option>
//                       <option value="percentage">Percentage</option>
//                     </select>
//                   </div>
//                 )}
//               </>
//             )}

//             <div className="grid grid-cols-2 gap-4">
//               <input type="number" placeholder="Stock Quantity" className="input" onChange={(e) => updateVariant(i, 'stock_quantity', Number(e.target.value))} />
//               <input type="number" placeholder="Weight (grams)" className="input" onChange={(e) => updateVariant(i, 'weight_grams', Number(e.target.value))} />
//             </div>
//           </div>
//         ))}

//         <button onClick={addVariant} className="border px-4 py-2 rounded hover:bg-gray-100">
//           ➕ Add New Variant
//         </button>
//       </section>

//       <button   type="button"  // ✅ this prevents unexpected page reload
//                 onClick={handleSubmit} 
//                 // onClick={() => console.log("🔥 BASIC BUTTON WORKS")}
//                 disabled={loading} 
//                 className="bg-black text-white px-6 py-3 rounded text-lg"
//     >
//         {loading ? 'Creating…' : 'Create Product'}
//       </button>
//     </div>
//   )
// }

// 'use client'

// import { useEffect, useState } from 'react'
// import { useRouter } from 'next/navigation'
// import axios from 'axios'
// import apiClient from '@/lib/apiClient'
// import Image from 'next/image'

// interface CategoryNode {
//   id: string
//   name: string
//   slug: string
//   level: number
//   is_leaf: boolean
//   children: CategoryNode[]
// }

// interface Variant {
//   color: string
//   size: string
//   retail_price: number | ''
//   in_stock: boolean
//   stock_quantity: number
//   weight_grams: number

//   enableRetailDiscount: boolean
//   retail_discount?: number
//   retail_discount_type?: 'flat' | 'percentage'

//   enableWholesale: boolean
//   wholesale_price?: number
//   min_qty_wholesale?: number

//   enableWholesaleDiscount: boolean
//   wholesale_discount?: number
//   wholesale_discount_type?: 'flat' | 'percentage'
// }

// export default function CreateProductPage() {
//   const router = useRouter()

//   const [title, setTitle] = useState('')
//   const [description, setDescription] = useState('')

//   const [categories, setCategories] = useState<CategoryNode[]>([])
//   const [categoryPath, setCategoryPath] = useState<CategoryNode[]>([])
//   const selectedCategory = categoryPath.at(-1)

//   const [images, setImages] = useState<File[]>([])
//   const [video, setVideo] = useState<File | null>(null)

//   const [variants, setVariants] = useState<Variant[]>([])
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState<string | null>(null)

//   /* ---------------- FETCH CATEGORIES ---------------- */
//   useEffect(() => {
//     const fetchCategories = async () => {
//       try {
//         const res = await apiClient.get('/api/categories/tree')
//         setCategories(res.data.data)
//       } catch (err) {
//         console.error('Failed to fetch categories', err)
//       }
//     }
//     fetchCategories()
//   }, [])

//   const handleSelectCategory = (cat: CategoryNode) => {
//     setCategoryPath((prev) => [...prev, cat])
//   }

//   const resetCategoryFromLevel = (level: number) => {
//     setCategoryPath((prev) => prev.slice(0, level))
//   }

//   /* ---------------- MEDIA UPLOAD ---------------- */

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

//   /* ---------------- VARIANT HANDLERS ---------------- */

//   const addVariant = () => {
//     setVariants((prev) => [
//       ...prev,
//       {
//         color: '',
//         size: '',
//         retail_price: '',
//         in_stock: true,
//         stock_quantity: 0,
//         weight_grams: 0,
//         enableRetailDiscount: false,
//         enableWholesale: false,
//         enableWholesaleDiscount: false,
//       },
//     ])
//   }

//   const removeVariant = (index: number) => {
//     setVariants((prev) => prev.filter((_, i) => i !== index))
//   }

//   const updateVariant = <K extends keyof Variant>(
//     index: number,
//     key: K,
//     value: Variant[K]
//   ) => {
//     const updated = [...variants]
//     updated[index] = { ...updated[index], [key]: value }
//     setVariants(updated)
//   }

//   /* ---------------- SUBMIT (DEBUG ONLY) ---------------- */

//   const handleSubmit = async () => {
//     setError(null)

//     if (!selectedCategory?.is_leaf) {
//       setError('Please select a leaf category')
//       return
//     }

//     if (images.length < 1) {
//       setError('At least one product image is required')
//       return
//     }
//     if (variants.length < 1) {
//       setError('At least one variant is required')
//       return
//     }

//     const image_urls = await Promise.all(
//       images.map((img) => uploadMedia(img, 'image'))
//     )

//     let promo_video_url: string | undefined
//     if (video) promo_video_url = await uploadMedia(video, 'video')

//     const payloadVariants = variants.map((v) => ({
//       color: v.color,
//       size: v.size,
//       retail_price: v.retail_price,
//       in_stock: v.in_stock,
//       stock_quantity: v.stock_quantity,
//       weight_grams: v.weight_grams,

//       retail_discount: v.enableRetailDiscount ? v.retail_discount : undefined,
//       retail_discount_type: v.enableRetailDiscount
//         ? v.retail_discount_type
//         : undefined,

//       wholesale_price: v.enableWholesale ? v.wholesale_price : undefined,
//       min_qty_wholesale: v.enableWholesale ? v.min_qty_wholesale : undefined,

//       wholesale_discount:
//         v.enableWholesale && v.enableWholesaleDiscount
//           ? v.wholesale_discount
//           : undefined,
//       wholesale_discount_type:
//         v.enableWholesale && v.enableWholesaleDiscount
//           ? v.wholesale_discount_type
//           : undefined,
//     }))

//     const fullPayload = {
//       title,
//       description,
//       category_id: selectedCategory.id,
//       image_urls,
//       promo_video_url,
//       variants: payloadVariants,
//     }

//     console.log('🧪 FINAL PAYLOAD', fullPayload)
//   }

//   /* ---------------- UI ---------------- */

//   return (
//     <div className="max-w-5xl mx-auto p-8 space-y-10">
//       <h1 className="text-4xl font-bold">🛠️ Create New Product</h1>

//       {error && <p className="text-red-600">{error}</p>}

//       {/* PRODUCT INFO */}
//       <section className="space-y-4">
//         <label className="font-semibold text-lg">Product Title</label>
//         <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />

//         <label className="font-semibold text-lg">Description</label>
//         <textarea className="input" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
//       </section>

//       {/* CATEGORY */}
//       <section className="space-y-3">
//         <h2 className="text-2xl font-semibold">Category</h2>

//         {categoryPath.map((cat, i) => (
//           <button
//             key={cat.id}
//             onClick={() => resetCategoryFromLevel(i)}
//             className="text-sm text-blue-600 underline mr-2"
//           >
//             {cat.name}
//           </button>
//         ))}

//         <div className="flex flex-wrap gap-3 mt-2">
//           {(categoryPath.length === 0 ? categories : categoryPath.at(-1)?.children || []).map(
//             (cat) => (
//               <button
//                 key={cat.id}
//                 onClick={() => handleSelectCategory(cat)}
//                 className="border px-4 py-2 rounded hover:bg-gray-100"
//               >
//                 {cat.name}
//               </button>
//             )
//           )}
//         </div>

//         {selectedCategory?.is_leaf && (
//           <p className="text-green-600 text-sm">
//             ✅ Selected: {selectedCategory.name}
//           </p>
//         )}
//       </section>

//       {/* IMAGE & VIDEO HANDLING REMAINS SAME */}
//       {/* VARIANT HANDLING REMAINS SAME */}
//       {/* SUBMIT BUTTON REMAINS SAME */}

//       {/* ... retain rest of your existing JSX from previous file ... */}
//             {/* IMAGES */}
//       <section>
//         <h2 className="text-2xl font-semibold mb-3">Product Images</h2>
//         <input type="file" multiple accept="image/*" onChange={(e) => setImages([...images, ...Array.from(e.target.files || [])])} />

//         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
//           {images.map((img, i) => (
//             <div key={i} className="relative border rounded p-2">
//               <Image
//                 src={URL.createObjectURL(img)}
//                 alt={`Product image ${i + 1}`}
//                 width={300}
//                 height={200}
//                 className="h-32 w-full object-cover rounded"
//                 unoptimized
//               />
//               {images.length > 1 && (
//                 <button
//                   onClick={() => setImages(images.filter((_, idx) => idx !== i))}
//                   className="absolute top-1 right-1 text-xs bg-red-600 text-white px-2 py-1 rounded"
//                 >
//                   Remove
//                 </button>
//               )}
//             </div>
//           ))}
//         </div>
//       </section>

//       {/* VIDEO */}
//       <section>
//         <h2 className="text-2xl font-semibold mb-3">Promo Video (Optional)</h2>
//         {!video ? (
//           <input type="file" accept="video/mp4" onChange={(e) => setVideo(e.target.files?.[0] || null)} />
//         ) : (
//           <div className="flex items-center gap-4">
//             <span className="text-sm">{video.name}</span>
//             <button onClick={() => setVideo(null)} className="text-red-600 text-sm">
//               Remove
//             </button>
//           </div>
//         )}
//       </section>

//       {/* VARIANTS */}
//       <section className="space-y-6">
//         <h2 className="text-2xl font-semibold">Variants</h2>

//         {variants.map((v, i) => (
//           <div key={i} className="border rounded-lg p-6 space-y-4">
//             <div className="flex justify-between items-center">
//               <h3 className="font-semibold">Variant #{i + 1}</h3>
//               <button onClick={() => removeVariant(i)} className="text-red-600 text-sm">
//                 Remove
//               </button>
//             </div>

//             <div className="grid grid-cols-2 gap-4">
//               <input placeholder="Color" className="input" onChange={(e) => updateVariant(i, 'color', e.target.value)} />
//               <input placeholder="Size" className="input" onChange={(e) => updateVariant(i, 'size', e.target.value)} />
//             </div>

//             <input type="number" placeholder="Retail Price" className="input" onChange={(e) => updateVariant(i, 'retail_price', Number(e.target.value))} />

//             <label className="flex gap-2">
//               <input type="checkbox" checked={v.enableRetailDiscount} onChange={() => updateVariant(i, 'enableRetailDiscount', !v.enableRetailDiscount)} />
//               Add Retail Discount
//             </label>

//             {v.enableRetailDiscount && (
//               <div className="grid grid-cols-2 gap-4">
//                 <input type="number" placeholder="Discount" className="input" onChange={(e) => updateVariant(i, 'retail_discount', Number(e.target.value))} />
//                 <select className="input" onChange={(e) => updateVariant(i, 'retail_discount_type', e.target.value as any)}>
//                   <option value="flat">Flat</option>
//                   <option value="percentage">Percentage</option>
//                 </select>
//               </div>
//             )}

//             <label className="flex gap-2">
//               <input type="checkbox" checked={v.enableWholesale} onChange={() => updateVariant(i, 'enableWholesale', !v.enableWholesale)} />
//               Enable Wholesale
//             </label>

//             {v.enableWholesale && (
//               <>
//                 <div className="grid grid-cols-2 gap-4">
//                   <input type="number" placeholder="Wholesale Price" className="input" onChange={(e) => updateVariant(i, 'wholesale_price', Number(e.target.value))} />
//                   <input type="number" placeholder="Min Qty" className="input" onChange={(e) => updateVariant(i, 'min_qty_wholesale', Number(e.target.value))} />
//                 </div>

//                 <label className="flex gap-2">
//                   <input type="checkbox" checked={v.enableWholesaleDiscount} onChange={() => updateVariant(i, 'enableWholesaleDiscount', !v.enableWholesaleDiscount)} />
//                   Add Wholesale Discount
//                 </label>

//                 {v.enableWholesaleDiscount && (
//                   <div className="grid grid-cols-2 gap-4">
//                     <input type="number" placeholder="Wholesale Discount" className="input" onChange={(e) => updateVariant(i, 'wholesale_discount', Number(e.target.value))} />
//                     <select className="input" onChange={(e) => updateVariant(i, 'wholesale_discount_type', e.target.value as any)}>
//                       <option value="flat">Flat</option>
//                       <option value="percentage">Percentage</option>
//                     </select>
//                   </div>
//                 )}
//               </>
//             )}

//             <div className="grid grid-cols-2 gap-4">
//               <input type="number" placeholder="Stock Quantity" className="input" onChange={(e) => updateVariant(i, 'stock_quantity', Number(e.target.value))} />
//               <input type="number" placeholder="Weight (grams)" className="input" onChange={(e) => updateVariant(i, 'weight_grams', Number(e.target.value))} />
//             </div>
//           </div>
//         ))}

//         <button onClick={addVariant} className="border px-4 py-2 rounded hover:bg-gray-100">
//           ➕ Add New Variant
//         </button>
//       </section>

//       <button onClick={handleSubmit} disabled={loading} className="bg-black text-white px-6 py-3 rounded text-lg">
//         {loading ? 'Creating…' : 'Create Product'}
//       </button>
//     </div>
//   )
// }


// 'use client'

// import { useEffect, useState } from 'react'
// import Image from 'next/image'

// interface CategoryNode {
//   id: string
//   name: string
//   slug: string
//   level: number
//   is_leaf: boolean
//   children: CategoryNode[]
// }

// interface Variant {
//   color: string
//   size: string
//   retail_price: number | ''
//   in_stock: boolean
//   stock_quantity: number
//   weight_grams: number

//   enableRetailDiscount: boolean
//   retail_discount?: number
//   retail_discount_type?: 'flat' | 'percentage'

//   enableWholesale: boolean
//   wholesale_price?: number
//   min_qty_wholesale?: number

//   enableWholesaleDiscount: boolean
//   wholesale_discount?: number
//   wholesale_discount_type?: 'flat' | 'percentage'
// }

// export default function CreateProductPage() {
//   /* ---------------- BASIC INFO ---------------- */
//   const [title, setTitle] = useState('')
//   const [description, setDescription] = useState('')

//   /* ---------------- CATEGORY ---------------- */
//   const [categories, setCategories] = useState<CategoryNode[]>([])
//   const [categoryPath, setCategoryPath] = useState<CategoryNode[]>([])
//   const selectedCategory = categoryPath.at(-1)

//   /* ---------------- MEDIA ---------------- */
//   const [images, setImages] = useState<File[]>([])
//   const [video, setVideo] = useState<File | null>(null)

//   /* ---------------- VARIANTS ---------------- */
//   const [variants, setVariants] = useState<Variant[]>([])

//   /* ---------------- UI ---------------- */
//   const [error, setError] = useState<string | null>(null)

//   /* ---------------- FETCH CATEGORIES ---------------- */

//   useEffect(() => {
//     const fetchCategories = async () => {
//       try {
//         const res = await fetch('http://localhost:8080/api/categories/tree')
//         const json = await res.json()
//         setCategories(json.data)
//       } catch (err) {
//         console.error('Failed to fetch categories', err)
//       }
//     }
//     fetchCategories()
//   }, [])

//   /* ---------------- CATEGORY HANDLERS ---------------- */

//   const handleSelectCategory = (cat: CategoryNode) => {
//     setCategoryPath((prev) => [...prev, cat])
//   }

//   const resetCategoryFromLevel = (level: number) => {
//     setCategoryPath((prev) => prev.slice(0, level))
//   }

//   /* ---------------- VARIANT HANDLERS ---------------- */

//   const addVariant = () => {
//     setVariants((prev) => [
//       ...prev,
//       {
//         color: '',
//         size: '',
//         retail_price: '',
//         in_stock: true,
//         stock_quantity: 0,
//         weight_grams: 0,
//         enableRetailDiscount: false,
//         enableWholesale: false,
//         enableWholesaleDiscount: false,
//       },
//     ])
//   }

//   const removeVariant = (index: number) => {
//     setVariants((prev) => prev.filter((_, i) => i !== index))
//   }

//   const updateVariant = <K extends keyof Variant>(
//     index: number,
//     key: K,
//     value: Variant[K]
//   ) => {
//     setVariants((prev) => {
//       const updated = [...prev]
//       updated[index] = { ...updated[index], [key]: value }
//       return updated
//     })
//   }

//   /* ---------------- SUBMIT (DEBUG ONLY) ---------------- */

//   const handleSubmit = () => {
//     setError(null)

//     if (!selectedCategory?.is_leaf) {
//       setError('Please select a leaf category')
//       return
//     }

//     if (variants.length === 0) {
//       setError('At least one variant is required')
//       return
//     }

//     console.log('📦 PRODUCT FORM DATA')
//     console.log({
//       title,
//       description,
//       category_id: selectedCategory.id,
//       images,
//       video,
//       variants,
//     })
//   }

//   /* ---------------- UI ---------------- */

//   return (
//     <div className="max-w-6xl mx-auto p-8 space-y-10">
//       <h1 className="text-4xl font-bold">🛠️ Create New Product</h1>

//       {error && <p className="text-red-600">{error}</p>}

//       {/* PRODUCT INFO */}
//       <section className="space-y-4">
//         <label className="font-semibold text-lg">Product Title</label>
//         <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />

//         <label className="font-semibold text-lg">Description</label>
//         <textarea className="input" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
//       </section>

//       {/* CATEGORY SELECTOR */}
//       <section className="space-y-3">
//         <h2 className="text-2xl font-semibold">Category</h2>

//         {categoryPath.map((cat, i) => (
//           <button
//             key={cat.id}
//             onClick={() => resetCategoryFromLevel(i)}
//             className="text-sm text-blue-600 underline mr-2"
//           >
//             {cat.name}
//           </button>
//         ))}

//         <div className="flex flex-wrap gap-3 mt-2">
//           {(categoryPath.length === 0 ? categories : categoryPath.at(-1)?.children || []).map(
//             (cat) => (
//               <button
//                 key={cat.id}
//                 onClick={() => handleSelectCategory(cat)}
//                 className="border px-4 py-2 rounded hover:bg-gray-100"
//               >
//                 {cat.name}
//               </button>
//             )
//           )}
//         </div>

//         {selectedCategory?.is_leaf && (
//           <p className="text-green-600 text-sm">
//             ✅ Selected: {selectedCategory.name}
//           </p>
//         )}
//       </section>

//       {/* IMAGES */}
//       <section>
//         <h2 className="text-2xl font-semibold mb-3">Product Images</h2>
//         <input type="file" multiple accept="image/*" onChange={(e) => setImages([...images, ...Array.from(e.target.files || [])])} />

//         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
//           {images.map((img, i) => (
//             <div key={i} className="relative border rounded p-2">
//               <Image
//                 src={URL.createObjectURL(img)}
//                 alt={`Product image ${i + 1}`}
//                 width={300}
//                 height={200}
//                 className="h-32 w-full object-cover rounded"
//                 unoptimized
//               />
//               {images.length > 1 && (
//                 <button
//                   onClick={() => setImages(images.filter((_, idx) => idx !== i))}
//                   className="absolute top-1 right-1 text-xs bg-red-600 text-white px-2 py-1 rounded"
//                 >
//                   Remove
//                 </button>
//               )}
//             </div>
//           ))}
//         </div>
//       </section>

//       {/* VIDEO */}
//       <section>
//         <h2 className="text-2xl font-semibold mb-3">Promo Video</h2>
//         {!video ? (
//           <input type="file" accept="video/mp4" onChange={(e) => setVideo(e.target.files?.[0] || null)} />
//         ) : (
//           <div className="flex items-center gap-4">
//             <span className="text-sm">{video.name}</span>
//             <button onClick={() => setVideo(null)} className="text-red-600 text-sm">
//               Remove
//             </button>
//           </div>
//         )}
//       </section>

//       {/* VARIANTS */}
//       <section className="space-y-6">
//         <h2 className="text-2xl font-semibold">Variants</h2>

//         {variants.map((_, i) => (
//           <div key={i} className="border rounded-lg p-6 flex justify-between">
//             <span>Variant #{i + 1}</span>
//             <button onClick={() => removeVariant(i)} className="text-red-600 text-sm">
//               Remove
//             </button>
//           </div>
//         ))}

//         <button onClick={addVariant} className="border px-4 py-2 rounded hover:bg-gray-100">
//           ➕ Add New Variant
//         </button>
//       </section>

//       <button onClick={handleSubmit} className="bg-black text-white px-6 py-3 rounded text-lg">
//         Debug Form State
//       </button>
//     </div>
//   )
// }


// 'use client'

// import { useState } from 'react'
// import { useRouter } from 'next/navigation'
// import axios from 'axios'
// import apiClient from '@/lib/apiClient'
// import Image from 'next/image'

// interface Variant {
//   color: string
//   size: string
//   retail_price: number | ''
//   in_stock: boolean
//   stock_quantity: number
//   weight_grams: number

//   enableRetailDiscount: boolean
//   retail_discount?: number
//   retail_discount_type?: 'flat' | 'percentage'

//   enableWholesale: boolean
//   wholesale_price?: number
//   min_qty_wholesale?: number

//   enableWholesaleDiscount: boolean
//   wholesale_discount?: number
//   wholesale_discount_type?: 'flat' | 'percentage'
// }

// export default function CreateProductPage() {
//   const router = useRouter()

//   const [title, setTitle] = useState('')
//   const [description, setDescription] = useState('')
//   const [categoryId, setCategoryId] = useState('')

//   const [images, setImages] = useState<File[]>([])
//   const [video, setVideo] = useState<File | null>(null)

//   const [variants, setVariants] = useState<Variant[]>([])
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState<string | null>(null)

//   /* ---------------- MEDIA UPLOAD ---------------- */

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

//   /* ---------------- VARIANT HANDLERS ---------------- */

//   const addVariant = () => {
//     setVariants((prev) => [
//       ...prev,
//       {
//         color: '',
//         size: '',
//         retail_price: '',
//         in_stock: true,
//         stock_quantity: 0,
//         weight_grams: 0,
//         enableRetailDiscount: false,
//         enableWholesale: false,
//         enableWholesaleDiscount: false,
//       },
//     ])
//   }

//   const removeVariant = (index: number) => {
//     setVariants((prev) => prev.filter((_, i) => i !== index))
//   }

//   const updateVariant = <K extends keyof Variant>(
//     index: number,
//     key: K,
//     value: Variant[K]
//   ) => {
//     const updated = [...variants]
//     updated[index] = { ...updated[index], [key]: value }
//     setVariants(updated)
//   }

//   /* ---------------- SUBMIT ---------------- */

//   const handleSubmit = async () => {
//     setLoading(true)
//     setError(null)

//     try {
//       if (images.length < 1) {
//         setError('At least one product image is required')
//         return
//       }
//       if (variants.length < 1) {
//         setError('At least one variant is required')
//         return
//       }

//       const image_urls = await Promise.all(
//         images.map((img) => uploadMedia(img, 'image'))
//       )

//       let promo_video_url: string | undefined
//       if (video) promo_video_url = await uploadMedia(video, 'video')

//       const payloadVariants = variants.map((v) => ({
//         color: v.color,
//         size: v.size,
//         retail_price: v.retail_price,
//         in_stock: v.in_stock,
//         stock_quantity: v.stock_quantity,
//         weight_grams: v.weight_grams,

//         retail_discount: v.enableRetailDiscount ? v.retail_discount : undefined,
//         retail_discount_type: v.enableRetailDiscount
//           ? v.retail_discount_type
//           : undefined,

//         wholesale_price: v.enableWholesale ? v.wholesale_price : undefined,
//         min_qty_wholesale: v.enableWholesale ? v.min_qty_wholesale : undefined,

//         wholesale_discount:
//           v.enableWholesale && v.enableWholesaleDiscount
//             ? v.wholesale_discount
//             : undefined,
//         wholesale_discount_type:
//           v.enableWholesale && v.enableWholesaleDiscount
//             ? v.wholesale_discount_type
//             : undefined,
//       }))

//       await apiClient.post('/api/seller/products', {
//         category_id: categoryId,
//         title,
//         description,
//         image_urls,
//         promo_video_url,
//         variants: payloadVariants,
//       })

//       router.push('/seller/dashboard')
//     } catch (err: any) {
//       setError(err?.response?.data?.message || 'Failed to create product')
//     } finally {
//       setLoading(false)
//     }
//   }

//   /* ---------------- UI ---------------- */

//   return (
//     <div className="max-w-5xl mx-auto p-8 space-y-10">
//       <h1 className="text-4xl font-bold">🛠️ Create New Product</h1>

//       {error && <p className="text-red-600">{error}</p>}

//       {/* PRODUCT INFO */}
//       <section className="space-y-4">
//         <label className="font-semibold text-lg">Product Title</label>
//         <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />

//         <label className="font-semibold text-lg">Description</label>
//         <textarea className="input" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />

//         <label className="font-semibold text-lg">Category ID</label>
//         <input className="input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} />
//       </section>

    //   {/* IMAGES */}
    //   <section>
    //     <h2 className="text-2xl font-semibold mb-3">Product Images</h2>
    //     <input type="file" multiple accept="image/*" onChange={(e) => setImages([...images, ...Array.from(e.target.files || [])])} />

    //     <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
    //       {images.map((img, i) => (
    //         <div key={i} className="relative border rounded p-2">
    //           <Image
    //             src={URL.createObjectURL(img)}
    //             alt={`Product image ${i + 1}`}
    //             width={300}
    //             height={200}
    //             className="h-32 w-full object-cover rounded"
    //             unoptimized
    //           />
    //           {images.length > 1 && (
    //             <button
    //               onClick={() => setImages(images.filter((_, idx) => idx !== i))}
    //               className="absolute top-1 right-1 text-xs bg-red-600 text-white px-2 py-1 rounded"
    //             >
    //               Remove
    //             </button>
    //           )}
    //         </div>
    //       ))}
    //     </div>
    //   </section>

    //   {/* VIDEO */}
    //   <section>
    //     <h2 className="text-2xl font-semibold mb-3">Promo Video (Optional)</h2>
    //     {!video ? (
    //       <input type="file" accept="video/mp4" onChange={(e) => setVideo(e.target.files?.[0] || null)} />
    //     ) : (
    //       <div className="flex items-center gap-4">
    //         <span className="text-sm">{video.name}</span>
    //         <button onClick={() => setVideo(null)} className="text-red-600 text-sm">
    //           Remove
    //         </button>
    //       </div>
    //     )}
    //   </section>

    //   {/* VARIANTS */}
    //   <section className="space-y-6">
    //     <h2 className="text-2xl font-semibold">Variants</h2>

    //     {variants.map((v, i) => (
    //       <div key={i} className="border rounded-lg p-6 space-y-4">
    //         <div className="flex justify-between items-center">
    //           <h3 className="font-semibold">Variant #{i + 1}</h3>
    //           <button onClick={() => removeVariant(i)} className="text-red-600 text-sm">
    //             Remove
    //           </button>
    //         </div>

    //         <div className="grid grid-cols-2 gap-4">
    //           <input placeholder="Color" className="input" onChange={(e) => updateVariant(i, 'color', e.target.value)} />
    //           <input placeholder="Size" className="input" onChange={(e) => updateVariant(i, 'size', e.target.value)} />
    //         </div>

    //         <input type="number" placeholder="Retail Price" className="input" onChange={(e) => updateVariant(i, 'retail_price', Number(e.target.value))} />

    //         <label className="flex gap-2">
    //           <input type="checkbox" checked={v.enableRetailDiscount} onChange={() => updateVariant(i, 'enableRetailDiscount', !v.enableRetailDiscount)} />
    //           Add Retail Discount
    //         </label>

    //         {v.enableRetailDiscount && (
    //           <div className="grid grid-cols-2 gap-4">
    //             <input type="number" placeholder="Discount" className="input" onChange={(e) => updateVariant(i, 'retail_discount', Number(e.target.value))} />
    //             <select className="input" onChange={(e) => updateVariant(i, 'retail_discount_type', e.target.value as any)}>
    //               <option value="flat">Flat</option>
    //               <option value="percentage">Percentage</option>
    //             </select>
    //           </div>
    //         )}

    //         <label className="flex gap-2">
    //           <input type="checkbox" checked={v.enableWholesale} onChange={() => updateVariant(i, 'enableWholesale', !v.enableWholesale)} />
    //           Enable Wholesale
    //         </label>

    //         {v.enableWholesale && (
    //           <>
    //             <div className="grid grid-cols-2 gap-4">
    //               <input type="number" placeholder="Wholesale Price" className="input" onChange={(e) => updateVariant(i, 'wholesale_price', Number(e.target.value))} />
    //               <input type="number" placeholder="Min Qty" className="input" onChange={(e) => updateVariant(i, 'min_qty_wholesale', Number(e.target.value))} />
    //             </div>

    //             <label className="flex gap-2">
    //               <input type="checkbox" checked={v.enableWholesaleDiscount} onChange={() => updateVariant(i, 'enableWholesaleDiscount', !v.enableWholesaleDiscount)} />
    //               Add Wholesale Discount
    //             </label>

    //             {v.enableWholesaleDiscount && (
    //               <div className="grid grid-cols-2 gap-4">
    //                 <input type="number" placeholder="Wholesale Discount" className="input" onChange={(e) => updateVariant(i, 'wholesale_discount', Number(e.target.value))} />
    //                 <select className="input" onChange={(e) => updateVariant(i, 'wholesale_discount_type', e.target.value as any)}>
    //                   <option value="flat">Flat</option>
    //                   <option value="percentage">Percentage</option>
    //                 </select>
    //               </div>
    //             )}
    //           </>
    //         )}

    //         <div className="grid grid-cols-2 gap-4">
    //           <input type="number" placeholder="Stock Quantity" className="input" onChange={(e) => updateVariant(i, 'stock_quantity', Number(e.target.value))} />
    //           <input type="number" placeholder="Weight (grams)" className="input" onChange={(e) => updateVariant(i, 'weight_grams', Number(e.target.value))} />
    //         </div>
    //       </div>
    //     ))}

    //     <button onClick={addVariant} className="border px-4 py-2 rounded hover:bg-gray-100">
    //       ➕ Add New Variant
    //     </button>
    //   </section>

    //   <button onClick={handleSubmit} disabled={loading} className="bg-black text-white px-6 py-3 rounded text-lg">
    //     {loading ? 'Creating…' : 'Create Product'}
    //   </button>
//     </div>
//   )
// }
