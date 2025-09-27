import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function VesselDashboard({ vesselId }) {
  const [vessel, setVessel] = useState(null)
  const [landings, setLandings] = useState([])
  const [compliance, setCompliance] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (vesselId) {
      loadDashboardData()
    }
  }, [vesselId])

  async function loadDashboardData() {
    setLoading(true)

    try {
      // Load vessel info
      const { data: vesselData } = await supabase
        .from('vessels')
        .select('*')
        .eq('id', vesselId)
        .single()

      // Load recent landings
      const { data: landingsData } = await supabase
        .from('tem_pollock_landings')
        .select('*')
        .eq('vessel_id', vesselId)
        .order('landing_date', { ascending: false })
        .limit(10)

      // Load latest compliance calculation
      const { data: complianceData } = await supabase
        .from('tem_four_trip_calculations')
        .select('*')
        .eq('vessel_id', vesselId)
        .order('calculation_date', { ascending: false })
        .limit(1)
        .single()

      setVessel(vesselData)
      setLandings(landingsData || [])
      setCompliance(complianceData)
    } catch (error) {
      console.error('Dashboard load error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-6">Loading dashboard...</div>
  }

  if (!vessel) {
    return <div className="p-6">Vessel not found</div>
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Vessel Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{vessel.name}</h1>
        <p className="text-gray-600">
          {vessel.registration_number} • {vessel.length_feet}ft {vessel.vessel_type}
        </p>
      </div>

      {/* Compliance Status */}
      {compliance && (
        <div className={`rounded-lg shadow-md p-6 mb-6 ${
          compliance.is_compliant
            ? 'bg-green-50 border-l-4 border-green-500'
            : 'bg-red-50 border-l-4 border-red-500'
        }`}>
          <h2 className="text-xl font-semibold mb-4">
            TEM Compliance Status
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Current 4-Trip Average</p>
              <p className="text-2xl font-bold">
                {compliance.average_pounds.toLocaleString()} lbs
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className={`text-2xl font-bold ${
                compliance.is_compliant ? 'text-green-600' : 'text-red-600'
              }`}>
                {compliance.is_compliant ? 'COMPLIANT' : 'VIOLATION'}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Limit</p>
              <p className="text-2xl font-bold text-gray-900">300,000 lbs</p>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Trip Period: {compliance.trip_group_start_date} to {compliance.trip_group_end_date}
          </div>
        </div>
      )}

      {/* Recent Landings */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Landings</h2>

        {landings.length === 0 ? (
          <p className="text-gray-500">No landings recorded</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Pounds</th>
                  <th className="text-left p-2">Port</th>
                  <th className="text-left p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {landings.map((landing, index) => (
                  <tr key={landing.id} className="border-b">
                    <td className="p-2">{landing.landing_date}</td>
                    <td className="p-2">{landing.pounds.toLocaleString()}</td>
                    <td className="p-2">{landing.landing_port || '-'}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        landing.pounds > 335000
                          ? 'bg-red-100 text-red-800'
                          : landing.pounds > 300000
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {landing.pounds > 335000 ? 'Egregious' :
                         landing.pounds > 300000 ? 'High' : 'Normal'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}