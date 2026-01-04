'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/userAuthStore'
import apiClient from '@/lib/apiClient'
import GoogleLoginButton from './GoogleLoginButton'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()

  const isLoggedIn = useAuthStore((state) => state.isLoggedIn)
  const mode = useAuthStore((state) => state.mode)
  const user = useAuthStore((state) => state.user)
  const setAuth = useAuthStore((state) => state.setAuth)
  const refreshToken = useAuthStore((state) => state.refreshToken)
  const logout = useAuthStore((state) => state.logout)

  const isSellerApproved = user?.isSellerProfileApproved ?? false

  const handleBecomeSeller = () => {
    if (!isLoggedIn) {
      alert('Please log in to become a seller.')
      return
    }
    router.push('/seller/profile')
  }

  const handleSwitchMode = async () => {
    try {
      const toMode = mode === 'customer' ? 'seller' : 'customer'
      const res = await apiClient.post('/api/user/switch-mode', { to_mode: toMode })
      const { access_token, refresh_token, mode: newMode } = res.data.data

      setAuth({
        accessToken: access_token,
        refreshToken: refresh_token ?? refreshToken!,
        user: user!,
        mode: newMode,
      })

      localStorage.setItem('refresh_token', refresh_token ?? refreshToken!)

      alert(`🎉 Switched to ${newMode} mode successfully!`)

      if (newMode === 'seller') {
        router.push('/seller/dashboard')
      } else {
        router.push('/')
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || '❌ Failed to switch mode. Please try again.'
      alert(msg)
    }
  }

  const handleLogout = async () => {
    try {
      await apiClient.post('/api/auth/logout', {})
      logout()
      localStorage.removeItem('refresh_token')
      alert('👋 Logged out successfully!')
      router.push('/') // Optional: redirect to home
    } catch (err: any) {
      const msg = err?.response?.data?.message || '❌ Failed to logout.'
      alert(msg)
    }
  }

  const showBecomeSeller =
    pathname !== '/seller/profile' && (!isLoggedIn || !isSellerApproved)

  const showSwitchMode = isLoggedIn && isSellerApproved
  const switchButtonLabel =
    mode === 'customer' ? 'Switch to Seller Mode' : 'Switch to Customer Mode'

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-md py-3 px-6 flex justify-between items-center">
      {/* Left: Logo */}
      <Link href="/" className="text-2xl font-bold text-black">
        Tanmore
      </Link>

      {/* Right Buttons */}
      <div className="flex items-center gap-4">
        {/* ✅ Become a Seller */}
        {showBecomeSeller && (
          <button
            onClick={handleBecomeSeller}
            className="text-white bg-black px-4 py-2 rounded-lg hover:opacity-90"
          >
            Become a Seller
          </button>
        )}

        {/* 🔄 Switch Mode */}
        {showSwitchMode && (
          <button
            onClick={handleSwitchMode}
            className="text-black border border-black px-4 py-2 rounded-lg hover:bg-black hover:text-white transition"
          >
            {switchButtonLabel}
          </button>
        )}

        {/* 🔐 Login / Logout */}
        {!isLoggedIn ? (
          <GoogleLoginButton />
        ) : (
          <button
            onClick={handleLogout}
            className="text-white bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg"
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  )
}


// 'use client'

// import Link from 'next/link'
// import { useRouter, usePathname } from 'next/navigation'
// import { useAuthStore } from '@/stores/userAuthStore'
// import apiClient from '@/lib/apiClient'

// export default function Navbar() {
//   const pathname = usePathname()
//   const router = useRouter()

//   const isLoggedIn = useAuthStore((state) => state.isLoggedIn)
//   const mode = useAuthStore((state) => state.mode)
//   const user = useAuthStore((state) => state.user)
//   const setAuth = useAuthStore((state) => state.setAuth)
//   const refreshToken = useAuthStore((state) => state.refreshToken)

//   const isSellerApproved = user?.isSellerProfileApproved ?? false

//   const handleBecomeSeller = () => {
//     if (!isLoggedIn) {
//       alert('Please log in to become a seller.')
//       return
//     }

//     router.push('/seller/profile')
//   }

//   const handleSwitchMode = async () => {
//     try {
//       const toMode = mode === 'customer' ? 'seller' : 'customer'

//       const res = await apiClient.post('/api/user/switch-mode', {
//         to_mode: toMode,
//       })

//       const { access_token, refresh_token, mode: newMode } = res.data.data

//       setAuth({
//         accessToken: access_token,
//         refreshToken: refresh_token ?? refreshToken!,
//         user: user!,
//         mode: newMode,
//       })

//       localStorage.setItem('refresh_token', refresh_token ?? refreshToken!)

//       alert(`🎉 Switched to ${newMode} mode successfully!`)

//       // Redirect accordingly
//       if (newMode === 'seller') {
//         router.push('/seller/dashboard')
//       } else {
//         router.push('/')
//       }
//     } catch (err: any) {
//       const msg =
//         err?.response?.data?.message || '❌ Failed to switch mode. Please try again.'
//       alert(msg)
//     }
//   }

//   const showBecomeSeller =
//     pathname !== '/seller/profile' &&
//     (!isLoggedIn || !isSellerApproved)

//   const showSwitchMode =
//     isLoggedIn && isSellerApproved // ✅ now show regardless of current mode

//   const switchButtonLabel =
//     mode === 'customer' ? 'Switch to Seller Mode' : 'Switch to Customer Mode'

//   return (
//     <nav className="sticky top-0 z-50 bg-white shadow-md py-3 px-6 flex justify-between items-center">
//       {/* Left: Tanmore Logo */}
//       <Link href="/" className="text-2xl font-bold text-black">
//         Tanmore
//       </Link>

//       <div className="flex items-center gap-4">
//         {/* ✅ Become a Seller: Show only if not yet approved */}
//         {showBecomeSeller && (
//           <button
//             onClick={handleBecomeSeller}
//             className="text-white bg-black px-4 py-2 rounded-lg hover:opacity-90"
//           >
//             Become a Seller
//           </button>
//         )}

//         {/* 🔄 Switch Mode: Always show if seller profile is approved */}
//         {showSwitchMode && (
//           <button
//             onClick={handleSwitchMode}
//             className="text-black border border-black px-4 py-2 rounded-lg hover:bg-black hover:text-white transition"
//           >
//             {switchButtonLabel}
//           </button>
//         )}
//       </div>
//     </nav>
//   )
// }



// 'use client'

// import Link from 'next/link'
// import { useRouter, usePathname } from 'next/navigation'
// import { useAuthStore } from '@/stores/userAuthStore'

// export default function Navbar() {
//   const pathname = usePathname()
//   const router = useRouter()

//   const isLoggedIn = useAuthStore((state) => state.isLoggedIn)
//   const mode = useAuthStore((state) => state.mode)
//   const user = useAuthStore((state) => state.user)

//   const isSellerApproved = user?.isSellerProfileApproved ?? false

//   const handleBecomeSeller = () => {
//     if (!isLoggedIn) {
//       alert('Please log in to become a seller.')
//       return
//     }

//     router.push('/seller/profile')
//   }

//   const handleSwitchMode = () => {
//     alert('🔄 Switch mode logic will go here soon...')
//     // You’ll implement /api/user/switch-mode here later
//   }

//   const showSwitchMode =
//     isLoggedIn && isSellerApproved && mode === 'customer'

//   const showBecomeSeller =
//     pathname !== '/seller/profile' &&
//     (!isLoggedIn || !isSellerApproved)

//   return (
//     <nav className="sticky top-0 z-50 bg-white shadow-md py-3 px-6 flex justify-between items-center">
//       {/* Left: Tanmore Logo */}
//       <Link href="/" className="text-2xl font-bold text-black">
//         Tanmore
//       </Link>

//       <div className="flex items-center gap-4">
//         {/* ✅ Become a Seller: Only show if not approved or not logged in */}
//         {showBecomeSeller && (
//           <button
//             onClick={handleBecomeSeller}
//             className="text-white bg-black px-4 py-2 rounded-lg hover:opacity-90"
//           >
//             Become a Seller
//           </button>
//         )}

//         {/* ✅ Switch Mode: Only if seller profile is approved and mode is customer */}
//         {showSwitchMode && (
//           <button
//             onClick={handleSwitchMode}
//             className="text-black border border-black px-4 py-2 rounded-lg hover:bg-black hover:text-white transition"
//           >
//             Switch to Seller Mode
//           </button>
//         )}
//       </div>
//     </nav>
//   )
// }


// 'use client'

// import Link from 'next/link'
// import { useRouter, usePathname } from 'next/navigation'
// import { useAuthStore } from '@/stores/userAuthStore'

// export default function Navbar() {
//   const pathname = usePathname()
//   const router = useRouter()

//   const isLoggedIn = useAuthStore((state) => state.isLoggedIn)
//   const mode = useAuthStore((state) => state.mode)
//   const user = useAuthStore((state) => state.user)

//   const handleBecomeSeller = () => {
//     if (!isLoggedIn) {
//       alert('Please log in to become a seller.')
//       return
//     }

//     router.push('/seller/profile')
//   }

//   const handleSwitchMode = () => {
//     alert('🔄 Switch mode logic will go here soon...')
//     // You’ll implement /api/user/switch-mode here later
//   }

//   const showSwitchMode =
//     isLoggedIn &&
//     user?.isSellerProfileApproved &&
//     mode === 'customer' // Show only if in customer mode

//   return (
//     <nav className="sticky top-0 z-50 bg-white shadow-md py-3 px-6 flex justify-between items-center">
//       {/* Left: Tanmore Logo */}
//       <Link href="/" className="text-2xl font-bold text-black">
//         Tanmore
//       </Link>

//       <div className="flex items-center gap-4">
//         {/* ✅ Become a Seller: Always show (hide only on seller profile page) */}
//         {pathname !== '/seller/profile' && (
//           <button
//             onClick={handleBecomeSeller}
//             className="text-white bg-black px-4 py-2 rounded-lg hover:opacity-90"
//           >
//             Become a Seller
//           </button>
//         )}

//         {/* ✅ Switch Mode: Only if seller profile is approved and mode is customer */}
//         {showSwitchMode && (
//           <button
//             onClick={handleSwitchMode}
//             className="text-black border border-black px-4 py-2 rounded-lg hover:bg-black hover:text-white transition"
//           >
//             Switch to Seller Mode
//           </button>
//         )}
//       </div>
//     </nav>
//   )
// }


// // "use client";

// // import Link from "next/link";
// // import { useRouter, usePathname } from "next/navigation";
// // import { useAuthStore } from "@/stores/userAuthStore";

// // export default function Navbar() {
// //   const pathname = usePathname();
// //   const router = useRouter();
// //   const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

// //   const handleBecomeSeller = () => {
// //     if (!isLoggedIn) {
// //       alert("Please log in to become a seller.");
// //       return;
// //     }

// //     router.push("/seller/profile");
// //   };

// //   return (
// //     <nav className="sticky top-0 z-50 bg-white shadow-md py-3 px-6 flex justify-between items-center">
// //       {/* Left: Tanmore Logo */}
// //       <Link href="/" className="text-2xl font-bold text-black">
// //         Tanmore
// //       </Link>

// //       {/* Right: Become a Seller button (hidden on seller profile page) */}
// //       {pathname !== "/seller/profile" && (
// //         <button
// //           onClick={handleBecomeSeller}
// //           className="text-white bg-black px-4 py-2 rounded-lg hover:opacity-90"
// //         >
// //           Become a Seller
// //         </button>
// //       )}
// //     </nav>
// //   );
// // }
