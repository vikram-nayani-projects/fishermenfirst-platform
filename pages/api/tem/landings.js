import { createClient } from '@supabase/supabase-js'
import { processNewLanding } from '../../../lib/tem-calculations'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGet(req, res)
    case 'POST':
      return handlePost(req, res)
    default:
      res.setHeader('Allow', ['GET', 'POST'])
      return res.status(405).json({ error: `Method ${method} Not Allowed` })
  }
}

async function handleGet(req, res) {
  try {
    const { vessel_id } = req.query

    let query = supabase
      .from('tem_pollock_landings')
      .select(`
        *,
        vessels(name, registration_number)
      `)
      .order('landing_date', { ascending: false })

    if (vessel_id) {
      query = query.eq('vessel_id', vessel_id)
    }

    const { data, error } = await query

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    return res.status(200).json({ data })

  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

async function handlePost(req, res) {
  try {
    const {
      vessel_id,
      landing_date,
      pounds,
      species_code = 'POLL',
      landing_port,
      delivery_id,
      season_year
    } = req.body

    // Validate required fields
    if (!vessel_id || !landing_date || !pounds) {
      return res.status(400).json({
        error: 'Missing required fields: vessel_id, landing_date, pounds'
      })
    }

    // Validate pounds is reasonable (from TEM IPA)
    if (pounds <= 0 || pounds > 500000) {
      return res.status(400).json({
        error: 'Invalid pounds amount (must be 0-500,000)'
      })
    }

    // Insert new landing
    const { data: landing, error: insertError } = await supabase
      .from('tem_pollock_landings')
      .insert({
        vessel_id,
        landing_date,
        pounds,
        species_code,
        landing_port,
        delivery_id,
        season_year: season_year || new Date().getFullYear()
      })
      .select()
      .single()

    if (insertError) {
      return res.status(400).json({ error: insertError.message })
    }

    // Trigger 4-trip average calculation
    const calculationResult = await processNewLanding(landing)

    return res.status(201).json({
      landing,
      calculation_result: calculationResult
    })

  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}