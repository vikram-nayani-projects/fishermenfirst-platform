// Direct admin access for testing - bypasses auth completely
import { useRouter } from 'next/router'

export default function AdminDirect() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard (Direct Access)</h1>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
            <p className="text-yellow-800">
              <strong>Direct Admin Access:</strong> This bypasses authentication for testing purposes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* User Management Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">User Management</h3>
                    <p className="text-sm text-gray-500">Manage users, roles, and permissions</p>
                  </div>
                </div>
                <div className="mt-6">
                  <button
                    onClick={() => alert('User management would require auth bypass modifications')}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Manage Users
                  </button>
                </div>
              </div>
            </div>

            {/* TEM Test */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H9a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">TEM Calculations</h3>
                    <p className="text-sm text-gray-500">Test the core calculation engine</p>
                  </div>
                </div>
                <div className="mt-6">
                  <button
                    onClick={testCalculations}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                  >
                    Test Calculations
                  </button>
                </div>
              </div>
            </div>

            {/* Environment Status */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Environment Status</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Supabase URL:</span>
                    <span className={process.env.NEXT_PUBLIC_SUPABASE_URL ? 'text-green-600' : 'text-red-600'}>
                      {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Anon Key:</span>
                    <span className={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'text-green-600' : 'text-red-600'}>
                      {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Test Data Check */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Test Data</h3>
                <button
                  onClick={checkTestData}
                  className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
                >
                  Check Test Data
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

async function testCalculations() {
  try {
    const response = await fetch('/api/tem/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vesselId: '8aa52a16-580d-4f0e-9c5e-3e301d5ccbb6'
      })
    })

    const result = await response.json()

    if (result.success) {
      alert('✅ TEM Calculations Working!\n\n' +
            `Vessel: ${result.vessel.name}\n` +
            `4-trip average: ${result.latest_calculation.average_pounds.toLocaleString()} lbs\n` +
            `Compliance: ${result.compliance_status}`)
    } else {
      alert('❌ Calculation Error: ' + JSON.stringify(result, null, 2))
    }
  } catch (error) {
    alert('❌ Network Error: ' + error.message)
  }
}

async function checkTestData() {
  try {
    const response = await fetch('/api/tem/landings')
    const result = await response.json()

    if (result.success) {
      alert(`✅ Test Data Found!\n\n${result.landings.length} landings in database`)
    } else {
      alert('❌ Data Check Error: ' + JSON.stringify(result, null, 2))
    }
  } catch (error) {
    alert('❌ Network Error: ' + error.message)
  }
}