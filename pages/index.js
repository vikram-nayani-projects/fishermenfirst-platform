import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function Home() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession()

    if (session) {
      // User is logged in, check their role
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (userData?.role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }
    } else {
      // No user, show landing page
      setLoading(false)
    }
  }

  async function signIn() {
    const email = prompt('Enter your email:')
    if (email) {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`
        }
      })

      if (error) {
        alert('Error: ' + error.message)
      } else {
        alert('Check your email for the magic link!')
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            Fishermen First Platform
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            Alaska TEM & Rockfish Program Compliance Platform
          </p>
          <div className="mt-8">
            <button
              onClick={signIn}
              className="bg-blue-600 text-white px-6 py-3 rounded-md text-lg font-medium hover:bg-blue-700"
            >
              Sign In with Magic Link
            </button>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">TEM Program</h3>
            <ul className="text-gray-600 space-y-2">
              <li>• 4-trip average compliance tracking</li>
              <li>• Real-time landing data entry</li>
              <li>• Egregious trip monitoring</li>
              <li>• Automated compliance calculations</li>
            </ul>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Rockfish Program</h3>
            <ul className="text-gray-600 space-y-2">
              <li>• Quota allocation management</li>
              <li>• Inter-vessel quota transfers</li>
              <li>• Salmon bycatch tracking</li>
              <li>• Species-specific monitoring</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}