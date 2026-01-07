import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  name: string
  email: string
  image: string
  isSellerProfileApproved: boolean
}

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: User | null
  mode: 'customer' | 'seller'
  isLoggedIn: boolean

  // 🔹 NEW
  hasHydrated: boolean

  setAuth: (data: {
    accessToken: string
    refreshToken: string
    user: User
    mode: 'customer' | 'seller'
  }) => void

  updateSellerApproval: (approved: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      mode: 'customer',
      isLoggedIn: false,

      // 🔹 NEW
      hasHydrated: false,

      setAuth: ({ accessToken, refreshToken, user, mode }) =>
        set({
          accessToken,
          refreshToken,
          user,
          mode,
          isLoggedIn: true,
        }),

      updateSellerApproval: (approved) =>
        set((state) => ({
          user: state.user
            ? { ...state.user, isSellerProfileApproved: approved }
            : state.user,
        })),

      logout: () =>
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          mode: 'customer',
          isLoggedIn: false,
        }),
    }),
    {
      name: 'tanmore-auth',
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.hasHydrated = true
        }
      },
    }
  )
)


// import { create } from 'zustand'
// import { persist } from 'zustand/middleware'

// interface User {
//   id: string
//   name: string
//   email: string
//   image: string
//   isSellerProfileApproved: boolean
// }

// interface AuthState {
//   accessToken: string | null
//   refreshToken: string | null
//   user: User | null
//   mode: 'customer' | 'seller'
//   isLoggedIn: boolean

//   setAuth: (data: {
//     accessToken: string
//     refreshToken: string
//     user: User
//     mode: 'customer' | 'seller'
//   }) => void

//   updateSellerApproval: (approved: boolean) => void

//   logout: () => void
// }

// export const useAuthStore = create<AuthState>()(
//   persist(
//     (set) => ({
//       accessToken: null,
//       refreshToken: null,
//       user: null,
//       mode: 'customer',
//       isLoggedIn: false,

//       setAuth: ({ accessToken, refreshToken, user, mode }) =>
//         set({
//           accessToken,
//           refreshToken,
//           user,
//           mode,
//           isLoggedIn: true,
//         }),

//       updateSellerApproval: (approved) =>
//         set((state) => ({
//           user: state.user
//             ? { ...state.user, isSellerProfileApproved: approved }
//             : state.user,
//         })),

//       logout: () =>
//         set({
//           accessToken: null,
//           refreshToken: null,
//           user: null,
//           mode: 'customer',
//           isLoggedIn: false,
//         }),
//     }),
//     {
//       name: 'tanmore-auth',
//     }
//   )
// )


// import { create } from 'zustand'
// import { persist } from 'zustand/middleware'

// interface User {
//   id: string
//   name: string
//   email: string
//   image: string
// }

// interface AuthState {
//   accessToken: string | null
//   refreshToken: string | null
//   user: User | null
//   mode: 'customer' | 'seller'
//   isLoggedIn: boolean
//   setAuth: (data: {
//     accessToken: string
//     refreshToken: string
//     user: User
//     mode: 'customer' | 'seller'
//   }) => void
//   logout: () => void
// }

// export const useAuthStore = create<AuthState>()(
//   persist(
//     (set) => ({
//       accessToken: null,
//       refreshToken: null,
//       user: null,
//       mode: 'customer',
//       isLoggedIn: false,
//       setAuth: ({ accessToken, refreshToken, user, mode }) =>
//         set({
//           accessToken,
//           refreshToken,
//           user,
//           mode,
//           isLoggedIn: true,
//         }),
//       logout: () =>
//         set({
//           accessToken: null,
//           refreshToken: null,
//           user: null,
//           mode: 'customer',
//           isLoggedIn: false,
//         }),
//     }),
//     {
//       name: 'tanmore-auth', // key in localStorage
//     }
//   )
// )


// // import { create } from 'zustand'

// // interface User {
// //   id: string
// //   name: string
// //   email: string
// //   image: string
// // }

// // interface AuthState {
// //   accessToken: string | null
// //   refreshToken: string | null
// //   user: User | null
// //   mode: 'customer' | 'seller'
// //   isLoggedIn: boolean
// //   setAuth: (data: {
// //     accessToken: string
// //     refreshToken: string
// //     user: User
// //     mode: 'customer' | 'seller'
// //   }) => void
// //   logout: () => void
// // }

// // export const useAuthStore = create<AuthState>((set) => ({
// //   accessToken: null,
// //   refreshToken: null,
// //   user: null,
// //   mode: 'customer',
// //   isLoggedIn: false,
// //   setAuth: ({ accessToken, refreshToken, user, mode }) =>
// //     set({
// //       accessToken,
// //       refreshToken,
// //       user,
// //       mode,
// //       isLoggedIn: true,
// //     }),
// //   logout: () =>
// //     set({
// //       accessToken: null,
// //       refreshToken: null,
// //       user: null,
// //       mode: 'customer',
// //       isLoggedIn: false,
// //     }),
// // }))
