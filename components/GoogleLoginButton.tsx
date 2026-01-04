'use client'

import { GoogleLogin } from '@react-oauth/google'
import { useAuthStore } from '@/stores/userAuthStore'
import axios from 'axios'

export default function GoogleLoginButton() {
  const setAuth = useAuthStore((state) => state.setAuth)

  return (
    <GoogleLogin
      onSuccess={async (credentialResponse) => {
        const id_token = credentialResponse.credential
        if (!id_token) return

        try {
          const res = await axios.post(
            'http://localhost:8080/api/auth/google',
            { id_token },
            {
              headers: {
                'User-Agent': navigator.userAgent,
                'X-Platform': 'web',
                'X-Device-Fingerprint': 'my-device-id',
              },
            }
          )

          const data = res.data.data

          setAuth({
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            mode: 'customer',
            user: {
              id: data.user.id,
              name: data.user.name,
              email: data.user.email,
              image: data.user.image,
              isSellerProfileApproved: data.user.is_seller_profile_approved,
            },
          })

          localStorage.setItem('refresh_token', data.refresh_token)
        } catch (err) {
          alert('Login failed')
          console.error(err)
        }
      }}
      onError={() => alert('Google login failed')}
    />
  )
}


// 'use client'

// import { GoogleLogin } from '@react-oauth/google'
// import { useAuthStore } from '@/stores/userAuthStore'
// import axios from 'axios'

// export default function GoogleLoginButton() {
//   const setAuth = useAuthStore((state) => state.setAuth)

//   return (
//     <GoogleLogin
//       onSuccess={async (credentialResponse) => {
//         const id_token = credentialResponse.credential
//         if (!id_token) return

//         try {
//           const res = await axios.post('http://localhost:8080/api/auth/google', {
//             id_token,
//           }, {
//             headers: {
//               'User-Agent': navigator.userAgent,
//               'X-Platform': 'web',
//               'X-Device-Fingerprint': 'my-device-id', // later make dynamic
//             },
//           })

//           const data = res.data.data
//           setAuth({
//             accessToken: data.access_token,
//             refreshToken: data.refresh_token,
//             user: data.user,
//             mode: 'customer', // backend will return this later
//           })

//           // Optionally store refresh token in localStorage
//           localStorage.setItem('refresh_token', data.refresh_token)
//         } catch (err) {
//           alert('Login failed')
//           console.error(err)
//         }
//       }}
//       onError={() => {
//         alert('Google login failed')
//       }}
//     />
//   )
// }
