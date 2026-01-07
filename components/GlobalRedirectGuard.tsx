'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/userAuthStore'

export default function GlobalRedirectGuard() {
  const router = useRouter()
  const pathname = usePathname()

  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const mode = useAuthStore((s) => s.mode)
  const hasHydrated = useAuthStore((s) => s.hasHydrated)

  useEffect(() => {
    // ⛔ DO NOTHING until Zustand is hydrated
    if (!hasHydrated) return

    if (!isLoggedIn) {
      const protectedPaths = ['/cart', '/checkout', '/seller', '/profile']
      const isProtected = protectedPaths.some((p) =>
        pathname.startsWith(p)
      )

      if (isProtected) {
        router.replace('/login')
      }
    } else if (mode === 'seller') {
      const isOutsideSeller = !pathname.startsWith('/seller')
      if (isOutsideSeller) {
        router.replace('/seller/dashboard')
      }
    }
  }, [hasHydrated, isLoggedIn, mode, pathname, router])

  return null
}


// 'use client'

// import { useEffect } from 'react'
// import { useRouter, usePathname } from 'next/navigation'
// import { useAuthStore } from '@/stores/userAuthStore'

// export default function GlobalRedirectGuard() {
//   const router = useRouter()
//   const pathname = usePathname()

//   const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
//   const mode = useAuthStore((s) => s.mode)

//   useEffect(() => {
//     if (!isLoggedIn) {
//       // Block all protected pages and force login
//       const protectedPaths = ['/cart', '/checkout', '/seller', '/profile']
//       const isProtected = protectedPaths.some((p) => pathname.startsWith(p))
//       if (isProtected) {
//         router.replace('/login')
//       }
//     } else if (mode === 'seller') {
//       const isOutsideSeller = !pathname.startsWith('/seller')
//       if (isOutsideSeller) {
//         router.replace('/seller/dashboard')
//       }
//     }
//   }, [isLoggedIn, mode, pathname, router])

//   return null
// }
