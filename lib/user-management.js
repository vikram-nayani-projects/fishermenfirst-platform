import { createClient } from '@supabase/supabase-js'

// Use service role key for admin functions
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Admin function to invite new users
export async function inviteUser(email, role, vesselId = null) {
  try {
    // 1. Create auth user and send magic link invitation
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { role, vessel_id: vesselId }
    })

    if (authError) {
      return { error: authError.message }
    }

    // 2. Create user record in your users table
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email: email,
        role: role,
        vessel_id: vesselId,
        is_active: true
      })
      .select()
      .single()

    if (userError) {
      return { error: userError.message }
    }

    return { data: userData }

  } catch (error) {
    return { error: error.message }
  }
}

// Get all users (admin only)
export async function getAllUsers() {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select(`
      *,
      vessels(name, registration_number)
    `)
    .order('created_at', { ascending: false })

  return { data, error }
}

// Update user role/vessel
export async function updateUser(userId, updates) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  return { data, error }
}

// Deactivate user
export async function deactivateUser(userId) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .update({ is_active: false })
    .eq('id', userId)

  return { data, error }
}