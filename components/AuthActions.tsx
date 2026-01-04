'use client'

export default function AuthActions() {
  return null // Optional: you can safely delete this file if it's unused
}


// 'use client'

// import GoogleLoginButton from './GoogleLoginButton'
// import { useAuthStore } from '@/stores/userAuthStore'
// import apiClient from '@/lib/apiClient' // 👈 import your axios client
// import { useState } from 'react'

// export default function AuthActions() {
//   const { isLoggedIn, accessToken, user, logout } = useAuthStore()
//   const [loading, setLoading] = useState(false)

//   const handleAddToCart = async () => {
//     if (!isLoggedIn || !accessToken) {
//       alert('Please log in first!')
//       return
//     }

//     try {
//       setLoading(true)

//       // Dummy IDs (replace with actual UUIDs later)
//       const product_id = '5f48e0a5-e1b6-4e08-b79d-8e4af0948ff8'
//       const variant_id = '9c30d806-990c-43af-a505-f1d5ad27dbda'

//       const res = await apiClient.post('/api/cart/add', {
//         product_id,
//         variant_id,
//         required_quantity: 1,
//       })

//       const { status } = res.data.data

//       alert(`✅ Variant ${status === 'cart_item_reactivated' ? 'reactivated in' : 'added to'} cart`)
//     } catch (err: any) {
//       console.error('Add to cart failed:', err)

//       if (err?.response?.data?.message) {
//         alert(`❌ ${err.response.data.message}`)
//       } else {
//         alert('❌ Failed to add to cart')
//       }
//     } finally {
//       setLoading(false)
//     }
//   }

//   const handleLogout = () => {
//     localStorage.removeItem('refresh_token')
//     logout()
//     alert('Logged out successfully')
//   }

//   return (
//     <div className="flex flex-col gap-4 items-center justify-center mt-10">
//       {!isLoggedIn ? (
//         <>
//           <p className="text-gray-700">You’re not logged in</p>
//           <GoogleLoginButton />
//         </>
//       ) : (
//         <>
//           <p className="text-green-600 font-semibold">
//             Logged in as {user?.name}
//           </p>

//           <button
//             onClick={handleAddToCart}
//             disabled={loading}
//             className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
//           >
//             {loading ? 'Adding...' : 'Simulate “Add to Cart”'}
//           </button>

//           <button
//             onClick={handleLogout}
//             className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
//           >
//             Logout
//           </button>
//         </>
//       )}
//     </div>
//   )
// }
