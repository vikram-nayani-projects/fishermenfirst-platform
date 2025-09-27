import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        console.error('Auth callback error:', error.message)
        router.push('/login?error=auth_callback_failed')
        return
      }

      if (data.session) {
        // User successfully authenticated
        // Check if user exists in your users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.session.user.id)
          .single()

        if (userError || !userData) {
          // New user - redirect to role setup
          router.push('/setup-profile')
        } else {
          // Existing user - redirect based on role
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
        router.push('/login')
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Logging you in...</h2>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    </div>
  )
}