import { createClient } from '@supabase/supabase-js'
import { calculateFourTripAverage } from './tem-calculations'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Simple database operations using Supabase directly
export const db = {
  // TEM Operations
  async addLanding(landingData) {
    const { data, error } = await supabase
      .from('tem_pollock_landings')
      .insert(landingData)
      .select()
      .single()

    if (!error && data) {
      // Trigger calculation after successful insert
      await calculateFourTripAverage(data.vessel_id)
    }

    return { data, error }
  },

  async getVesselLandings(vesselId) {
    return await supabase
      .from('tem_pollock_landings')
      .select('*')
      .eq('vessel_id', vesselId)
      .order('landing_date', { ascending: false })
  },

  async getVesselCompliance(vesselId) {
    return await supabase
      .from('tem_four_trip_calculations')
      .select('*')
      .eq('vessel_id', vesselId)
      .order('calculation_date', { ascending: false })
      .limit(1)
      .single()
  },

  // Rockfish Operations
  async getVesselQuotas(vesselId) {
    return await supabase
      .from('rp_quota_allocations')
      .select('*')
      .eq('vessel_id', vesselId)
  },

  async addQuotaTransfer(transferData) {
    return await supabase
      .from('rp_quota_transfers')
      .insert(transferData)
      .select()
      .single()
  },

  // User Operations
  async getUser(userId) {
    return await supabase
      .from('users')
      .select(`
        *,
        vessels(name, registration_number)
      `)
      .eq('id', userId)
      .single()
  }
}

export default db