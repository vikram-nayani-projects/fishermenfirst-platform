import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/router'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default function EmergencyTools() {
  const [sqlQuery, setSqlQuery] = useState('')
  const [queryResult, setQueryResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [confirmDangerous, setConfirmDangerous] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/auth/login')
      return
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (!userData || userData.role !== 'admin') {
      router.push('/unauthorized')
      return
    }
  }

  async function executeQuery() {
    if (!sqlQuery.trim()) {
      alert('Please enter a SQL query')
      return
    }

    const isDangerous = /\b(DELETE|DROP|TRUNCATE|ALTER|UPDATE)\b/i.test(sqlQuery)

    if (isDangerous && !confirmDangerous) {
      alert('This appears to be a dangerous query. Please check the confirmation box.')
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('execute_sql', { query: sqlQuery })

      if (error) {
        setQueryResult({ error: error.message })
      } else {
        setQueryResult({ data })
      }
    } catch (error) {
      setQueryResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  async function exportData(tableName) {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')

      if (error) throw error

      // Convert to CSV
      if (data && data.length > 0) {
        const headers = Object.keys(data[0])
        const csvContent = [
          headers.join(','),
          ...data.map(row => headers.map(header =>
            JSON.stringify(row[header] || '')
          ).join(','))
        ].join('\n')

        // Download file
        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${tableName}_backup_${new Date().toISOString().split('T')[0]}.csv`
        link.click()
        window.URL.revokeObjectURL(url)

        alert(`Exported ${data.length} records from ${tableName}`)
      } else {
        alert(`No data found in ${tableName}`)
      }
    } catch (error) {
      alert('Export failed: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const commonQueries = [
    {
      name: "Check TEM Compliance Status",
      query: `SELECT
        v.name as vessel_name,
        COUNT(tpl.*) as total_landings,
        SUM(tpl.pounds) as total_pounds,
        AVG(tpl.pounds) as avg_pounds
      FROM vessels v
      LEFT JOIN tem_pollock_landings tpl ON v.id = tpl.vessel_id
      WHERE v.length_feet >= 60
      GROUP BY v.id, v.name
      ORDER BY total_pounds DESC;`
    },
    {
      name: "Recent Upload Activity",
      query: `SELECT
        DATE(created_at) as date,
        COUNT(*) as records_created
      FROM tem_pollock_landings
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC;`
    },
    {
      name: "User Activity Summary",
      query: `SELECT
        role,
        COUNT(*) as user_count,
        COUNT(CASE WHEN is_active THEN 1 END) as active_users
      FROM users
      GROUP BY role
      ORDER BY user_count DESC;`
    },
    {
      name: "Data Integrity Check",
      query: `SELECT
        'tem_pollock_landings' as table_name,
        COUNT(*) as total_records,
        COUNT(CASE WHEN pounds > 335000 THEN 1 END) as egregious_trips,
        COUNT(CASE WHEN vessel_id IS NULL THEN 1 END) as missing_vessel_id
      FROM tem_pollock_landings
      UNION ALL
      SELECT
        'vessels' as table_name,
        COUNT(*) as total_records,
        COUNT(CASE WHEN length_feet >= 60 THEN 1 END) as large_vessels,
        COUNT(CASE WHEN name IS NULL THEN 1 END) as missing_names
      FROM vessels;`
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/admin')}
                className="text-blue-600 hover:text-blue-800"
              >
                ← Back to Admin
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Emergency Tools</h1>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">

          {/* Warning */}
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Emergency Access Warning</h3>
                <p className="mt-2 text-sm text-red-700">
                  These tools provide direct database access and can permanently modify or delete data.
                  Use extreme caution and always backup data before making changes.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => exportData('tem_pollock_landings')}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Export TEM Landings
              </button>
              <button
                onClick={() => exportData('vessels')}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Export Vessels
              </button>
              <button
                onClick={() => exportData('users')}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Export Users
              </button>
            </div>
          </div>

          {/* Common Queries */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Common Queries</h3>
            <div className="space-y-2">
              {commonQueries.map((query, index) => (
                <button
                  key={index}
                  onClick={() => setSqlQuery(query.query)}
                  className="block w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md"
                >
                  {query.name}
                </button>
              ))}
            </div>
          </div>

          {/* SQL Interface */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Direct SQL Access</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SQL Query
              </label>
              <textarea
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder="Enter your SQL query here..."
              />
            </div>

            <div className="flex items-center space-x-4 mb-4">
              <button
                onClick={executeQuery}
                disabled={loading}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Executing...' : 'Execute Query'}
              </button>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={confirmDangerous}
                  onChange={(e) => setConfirmDangerous(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">
                  I understand this may modify or delete data
                </span>
              </label>
            </div>

            {/* Query Results */}
            {queryResult && (
              <div className="mt-6">
                <h4 className="text-lg font-medium text-gray-900 mb-3">Query Results</h4>

                {queryResult.error ? (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <p className="text-red-800 font-mono text-sm">{queryResult.error}</p>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    {queryResult.data && queryResult.data.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full border border-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              {Object.keys(queryResult.data[0]).map((header) => (
                                <th key={header} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border border-gray-200">
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {queryResult.data.slice(0, 50).map((row, index) => (
                              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                {Object.values(row).map((value, cellIndex) => (
                                  <td key={cellIndex} className="px-4 py-2 text-sm text-gray-900 border border-gray-200 font-mono">
                                    {JSON.stringify(value)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {queryResult.data.length > 50 && (
                          <p className="text-sm text-gray-500 mt-2">
                            Showing first 50 of {queryResult.data.length} results
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-green-800">Query executed successfully (no results returned)</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}