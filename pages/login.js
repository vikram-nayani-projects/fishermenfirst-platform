import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function Login() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const { error: errorParam } = router.query
    if (errorParam) {
      const errorMessages = {
        'invalid_link': 'Invalid or expired magic link. Please try signing in again.',
        'unauthorized': 'You are not authorized to access this platform. Please contact an administrator.',
        'account_deactivated': 'Your account has been deactivated. Please contact an administrator.'
      }
      setError(errorMessages[errorParam] || 'An error occurred during login.')
    }
  }, [router.query])

  async function signIn() {
    const email = prompt('Enter your email:')
    if (email) {
      setLoading(true)
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`
        }
      })

      if (error) {
        setError('Error: ' + error.message)
      } else {
        alert('Check your email for the magic link!')
      }
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to Fishermen First Platform
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Alaska TEM & Rockfish Program Compliance Platform
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="mt-8 space-y-6">
          <div className="text-center">
            <button
              onClick={signIn}
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Sign In with Magic Link'}
            </button>
          </div>

          <div className="text-center">
            <button
              onClick={() => router.push('/')}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}