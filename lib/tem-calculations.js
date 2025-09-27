import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/**
 * Calculate 4-trip averages for TEM compliance
 * From TEM IPA: Vessels ≥60ft must average ≤300,000 lbs over 4 consecutive trips
 * Egregious trips (>335,000 lbs) are excluded from averages but tracked separately
 */

export async function calculateFourTripAverage(vesselId, newLandingId = null) {
  try {
    // 1. Get vessel info to check if ≥60ft (requirement for 4-trip averaging)
    const { data: vessel, error: vesselError } = await supabase
      .from('vessels')
      .select('id, name, length_feet')
      .eq('id', vesselId)
      .single()

    if (vesselError || !vessel) {
      return { error: 'Vessel not found' }
    }

    if (vessel.length_feet < 60) {
      return { message: 'Vessel <60ft - not subject to 4-trip averaging' }
    }

    // 2. Get all pollock landings for this vessel, ordered by date
    const { data: landings, error: landingsError } = await supabase
      .from('tem_pollock_landings')
      .select('*')
      .eq('vessel_id', vesselId)
      .order('landing_date', { ascending: true })

    if (landingsError) {
      return { error: 'Failed to fetch landings data' }
    }

    if (landings.length < 4) {
      return { message: 'Less than 4 trips - no calculation needed yet' }
    }

    // 3. Separate egregious trips (>335,000 lbs) from regular trips
    const regularTrips = landings.filter(trip => trip.pounds <= 335000)
    const egregiousTrips = landings.filter(trip => trip.pounds > 335000)

    if (regularTrips.length < 4) {
      return { message: 'Less than 4 non-egregious trips for averaging' }
    }

    // 4. Calculate rolling 4-trip averages for consecutive groups
    const calculations = []

    for (let i = 0; i <= regularTrips.length - 4; i++) {
      const tripGroup = regularTrips.slice(i, i + 4)
      const totalPounds = tripGroup.reduce((sum, trip) => sum + trip.pounds, 0)
      const averagePounds = totalPounds / 4
      const isCompliant = averagePounds <= 300000
      const isEgregious = averagePounds > 335000

      const calculation = {
        vessel_id: vesselId,
        calculation_date: new Date().toISOString().split('T')[0],
        trip_group_start_date: tripGroup[0].landing_date,
        trip_group_end_date: tripGroup[3].landing_date,
        trip_count: 4,
        total_pounds: totalPounds,
        average_pounds: Math.round(averagePounds * 100) / 100, // Round to 2 decimal places
        is_compliant: isCompliant,
        is_egregious: isEgregious,
        season_year: tripGroup[0].season_year || new Date().getFullYear(),
        landing_ids: tripGroup.map(trip => trip.id)
      }

      calculations.push(calculation)
    }

    // 5. Store calculations in database (upsert to handle recalculations)
    const results = []
    for (const calc of calculations) {
      const { data, error } = await supabase
        .from('tem_four_trip_calculations')
        .upsert(calc, {
          onConflict: 'vessel_id,calculation_date',
          ignoreDuplicates: false
        })
        .select()
        .single()

      if (error) {
        console.error('Error storing calculation:', error)
      } else {
        results.push(data)
      }
    }

    // 6. Return summary
    const latestCalculation = calculations[calculations.length - 1]
    const violationCount = calculations.filter(calc => !calc.is_compliant).length

    return {
      success: true,
      vessel: vessel,
      latest_calculation: latestCalculation,
      total_calculations: calculations.length,
      violation_count: violationCount,
      egregious_trips: egregiousTrips.length,
      compliance_status: latestCalculation.is_compliant ? 'COMPLIANT' : 'VIOLATION'
    }

  } catch (error) {
    console.error('Calculation error:', error)
    return { error: error.message }
  }
}

/**
 * Get current compliance status for a vessel
 */
export async function getVesselComplianceStatus(vesselId) {
  try {
    // Get latest calculation
    const { data: latestCalc, error: calcError } = await supabase
      .from('tem_four_trip_calculations')
      .select('*')
      .eq('vessel_id', vesselId)
      .order('calculation_date', { ascending: false })
      .limit(1)
      .single()

    if (calcError) {
      return { error: 'No calculations found for vessel' }
    }

    // Get violation count for penalty calculation
    const { data: violations, error: violationError } = await supabase
      .from('tem_four_trip_calculations')
      .select('id')
      .eq('vessel_id', vesselId)
      .eq('is_compliant', false)

    const violationCount = violations ? violations.length : 0

    // Calculate penalty based on TEM IPA schedule
    let penaltyAmount = 0
    if (violationCount > 0) {
      if (violationCount === 1) penaltyAmount = 750
      else if (violationCount === 2) penaltyAmount = 1500
      else if (violationCount === 3) penaltyAmount = 2000
      else if (violationCount >= 4) penaltyAmount = 2500
    }

    return {
      success: true,
      latest_average: latestCalc.average_pounds,
      is_compliant: latestCalc.is_compliant,
      violation_count: violationCount,
      penalty_amount: penaltyAmount,
      calculation_date: latestCalc.calculation_date,
      trip_group_start: latestCalc.trip_group_start_date,
      trip_group_end: latestCalc.trip_group_end_date
    }

  } catch (error) {
    return { error: error.message }
  }
}

/**
 * Trigger calculation when new landing is added
 */
export async function processNewLanding(landingData) {
  // Recalculate 4-trip averages for this vessel
  return await calculateFourTripAverage(landingData.vessel_id, landingData.id)
}