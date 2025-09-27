import { calculateFourTripAverage, getVesselComplianceStatus } from '../../../lib/tem-calculations'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { vessel_id } = req.body

  if (!vessel_id) {
    return res.status(400).json({ error: 'vessel_id required' })
  }

  try {
    const result = await calculateFourTripAverage(vessel_id)
    const status = await getVesselComplianceStatus(vessel_id)

    return res.status(200).json({
      calculation: result,
      compliance_status: status
    })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}