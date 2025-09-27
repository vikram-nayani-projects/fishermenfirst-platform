import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Send magic link to user's email (Official Supabase pattern)
export async function signInWithMagicLink(email) {
  const { data, error } = await supabase.auth.signInWithOtp({
    email: email,
    options: {
      // Prevent auto signup - users must be invited by admin
      shouldCreateUser: false,
      emailRedirectTo: `${window.location.origin}/auth/confirm`
    }
  })

  if (error) {
    console.error('Error sending magic link:', error.message)
    return { error }
  }

  return { data }
}

// Get current user
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Sign out
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

// Listen for auth changes
export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback)
}