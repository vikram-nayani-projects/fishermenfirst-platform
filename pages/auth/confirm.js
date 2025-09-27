import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function AuthConfirm() {
  const router = useRouter()

  useEffect(() => {
    const handleMagicLink = async () => {
      const { token_hash, type } = router.query

      if (token_hash && type === 'email') {
        // Official Supabase magic link verification
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash,
          type: 'email'
        })

        if (error) {
          console.error('Magic link verification failed:', error.message)
          router.push('/login?error=invalid_link')
          return
        }

        if (data.session) {
          // Successfully authenticated - check user role
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.session.user.id)
            .single()

          if (userError || !userData) {
            // User not found in users table
            router.push('/login?error=unauthorized')
            return
          }

          if (!userData.is_active) {
            // User account deactivated
            router.push('/login?error=account_deactivated')
            return
          }

          // Redirect based on user role
          switch (userData.role) {
            case 'vessel':
              router.push('/vessel-dashboard')
              break
            case 'tem_manager':
              router.push('/tem-dashboard')
              break
            case 'rockfish_manager':
              router.push('/rockfish-dashboard')
              break
            case 'admin':
              router.push('/admin-dashboard')
              break
            default:
              router.push('/dashboard')
          }
        }
      } else {
        // No valid token hash
        router.push('/login?error=invalid_link')
      }
    }

    if (router.isReady) {
      handleMagicLink()
    }
  }, [router.isReady, router.query])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Verifying your login...</h2>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Please wait while we log you in</p>
      </div>
    </div>
  )
}