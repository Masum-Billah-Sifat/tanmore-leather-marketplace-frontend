'use client'

import { GoogleOAuthProvider } from '@react-oauth/google'

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  return (
    <GoogleOAuthProvider clientId="298730921658-nj1a8n496nr3ltfg212vt4v2fh9df8v4.apps.googleusercontent.com">
      {children}
    </GoogleOAuthProvider>
  )
}
