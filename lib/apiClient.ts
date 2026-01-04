import axios from 'axios'
import { useAuthStore } from '@/stores/userAuthStore'

const apiClient = axios.create({
  baseURL: 'http://localhost:8080',
})

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config
    const status = err?.response?.status

    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refresh_token')

        const res = await axios.post(
          'http://localhost:8080/api/auth/refresh',
          { refresh_token: refreshToken },
          {
            headers: {
              'User-Agent': navigator.userAgent,
              'X-Platform': 'web',
              'X-Device-Fingerprint': 'my-device-id',
            },
          }
        )

        const data = res.data.data
        const store = useAuthStore.getState()

        store.setAuth({
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          mode: store.mode,
          user: {
            ...store.user!,
            isSellerProfileApproved:
              data.user?.is_seller_profile_approved ??
              store.user!.isSellerProfileApproved,
          },
        })

        originalRequest.headers.Authorization = `Bearer ${data.access_token}`
        return apiClient(originalRequest)
      } catch (refreshErr) {
        useAuthStore.getState().logout()
        return Promise.reject(refreshErr)
      }
    }

    return Promise.reject(err)
  }
)

export default apiClient


// import axios from 'axios'
// import { useAuthStore } from '@/stores/userAuthStore'

// const apiClient = axios.create({
//   baseURL: 'http://localhost:8080',
// })

// apiClient.interceptors.request.use((config) => {
//   const token = useAuthStore.getState().accessToken
//   if (token) config.headers.Authorization = `Bearer ${token}`
//   return config
// })

// apiClient.interceptors.response.use(
//   (res) => res,
//   async (err) => {
//     const originalRequest = err.config
//     const status = err?.response?.status

//     if (status === 401 && !originalRequest._retry) {
//       originalRequest._retry = true
//       try {
//         const refreshToken = localStorage.getItem('refresh_token')
//         const res = await axios.post('http://localhost:8080/api/auth/refresh', {
//           refresh_token: refreshToken,
//         }, {
//           headers: {
//             'User-Agent': navigator.userAgent,
//             'X-Platform': 'web',
//             'X-Device-Fingerprint': 'my-device-id',
//           },
//         })

//         const newToken = res.data.data.access_token
//         useAuthStore.getState().setAuth({
//           accessToken: newToken,
//           refreshToken: res.data.data.refresh_token,
//           user: useAuthStore.getState().user!,
//           mode: useAuthStore.getState().mode,
//         })

//         originalRequest.headers.Authorization = `Bearer ${newToken}`
//         return apiClient(originalRequest)
//       } catch (refreshErr) {
//         useAuthStore.getState().logout()
//         return Promise.reject(refreshErr)
//       }
//     }

//     return Promise.reject(err)
//   }
// )

// export default apiClient
