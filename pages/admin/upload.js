import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/router'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default function DataUpload() {
  const [loading, setLoading] = useState(false)
  const [uploadType, setUploadType] = useState('tem_landings')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState([])
  const [validationErrors, setValidationErrors] = useState([])
  const [uploadHistory, setUploadHistory] = useState([])
  const router = useRouter()

  useEffect(() => {
    checkAuth()
    loadUploadHistory()
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

  async function loadUploadHistory() {
    // This would load from a future upload_history table
    // For now, just placeholder
    setUploadHistory([])
  }

  function handleFileChange(e) {
    const selectedFile = e.target.files[0]
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile)
      parseCSV(selectedFile)
    } else {
      alert('Please select a CSV file')
    }
  }

  function parseCSV(file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target.result
      const lines = text.split('\n')
      const headers = lines[0].split(',').map(h => h.trim())

      const data = lines.slice(1, 11) // Preview first 10 rows
        .filter(line => line.trim())
        .map(line => {
          const values = line.split(',').map(v => v.trim())
          const row = {}
          headers.forEach((header, index) => {
            row[header] = values[index] || ''
          })
          return row
        })

      setPreview(data)
      validateData(data, headers)
    }
    reader.readAsText(file)
  }

  function validateData(data, headers) {
    const errors = []

    // Validation rules based on upload type
    const requiredFields = {
      tem_landings: ['vessel_id', 'landing_date', 'pounds', 'processor_id', 'season', 'season_year'],
      rockfish_quota: ['vessel_id', 'species', 'quota_pounds', 'season_year'],
      rockfish_transfers: ['from_vessel_id', 'to_vessel_id', 'species', 'pounds', 'transfer_date'],
      salmon_bycatch: ['vessel_id', 'species', 'count', 'date', 'season_year']
    }

    const required = requiredFields[uploadType] || []

    // Check required headers
    const missingHeaders = required.filter(field => !headers.includes(field))
    if (missingHeaders.length > 0) {
      errors.push(`Missing required columns: ${missingHeaders.join(', ')}`)
    }

    // Validate data rows
    data.forEach((row, index) => {
      required.forEach(field => {
        if (!row[field] || row[field].trim() === '') {
          errors.push(`Row ${index + 2}: Missing ${field}`)
        }
      })

      // Type-specific validations
      if (uploadType === 'tem_landings') {
        if (row.pounds && isNaN(parseFloat(row.pounds))) {
          errors.push(`Row ${index + 2}: Invalid pounds value`)
        }
        if (row.landing_date && !isValidDate(row.landing_date)) {
          errors.push(`Row ${index + 2}: Invalid landing_date format (use YYYY-MM-DD)`)
        }
      }
    })

    setValidationErrors(errors)
  }

  function isValidDate(dateString) {
    const date = new Date(dateString)
    return date instanceof Date && !isNaN(date)
  }

  async function handleUpload() {
    if (!file || validationErrors.length > 0) {
      alert('Please fix validation errors before uploading')
      return
    }

    setLoading(true)

    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const text = e.target.result
        const lines = text.split('\n')
        const headers = lines[0].split(',').map(h => h.trim())

        const data = lines.slice(1)
          .filter(line => line.trim())
          .map(line => {
            const values = line.split(',').map(v => v.trim())
            const row = {}
            headers.forEach((header, index) => {
              row[header] = values[index] || ''
            })
            return row
          })

        // Process upload based on type
        await processUpload(data)
      }
      reader.readAsText(file)

    } catch (error) {
      console.error('Upload error:', error)
      alert('Upload failed: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  async function processUpload(data) {
    let tableName = ''
    let processedData = []

    switch (uploadType) {
      case 'tem_landings':
        tableName = 'tem_pollock_landings'
        processedData = data.map(row => ({
          vessel_id: row.vessel_id,
          landing_date: row.landing_date,
          delivery_date: row.delivery_date || row.landing_date,
          pounds: parseFloat(row.pounds),
          processor_id: row.processor_id,
          season: row.season,
          season_year: parseInt(row.season_year)
        }))
        break

      case 'rockfish_quota':
        tableName = 'rp_quota_allocations'
        processedData = data.map(row => ({
          vessel_id: row.vessel_id,
          species: row.species,
          quota_pounds: parseFloat(row.quota_pounds),
          season_year: parseInt(row.season_year)
        }))
        break

      case 'rockfish_transfers':
        tableName = 'rp_quota_transfers'
        processedData = data.map(row => ({
          from_vessel_id: row.from_vessel_id,
          to_vessel_id: row.to_vessel_id,
          species: row.species,
          pounds: parseFloat(row.pounds),
          transfer_date: row.transfer_date
        }))
        break

      case 'salmon_bycatch':
        tableName = 'rp_salmon_bycatch'
        processedData = data.map(row => ({
          vessel_id: row.vessel_id,
          species: row.species,
          count: parseInt(row.count),
          date: row.date,
          season_year: parseInt(row.season_year)
        }))
        break
    }

    // Insert data in batches
    const batchSize = 100
    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < processedData.length; i += batchSize) {
      const batch = processedData.slice(i, i + batchSize)

      const { data: result, error } = await supabase
        .from(tableName)
        .insert(batch)

      if (error) {
        console.error('Batch error:', error)
        errorCount += batch.length
      } else {
        successCount += batch.length
      }
    }

    alert(`Upload complete! ${successCount} records uploaded successfully, ${errorCount} errors`)

    // Clear form
    setFile(null)
    setPreview([])
    setValidationErrors([])
    document.getElementById('fileInput').value = ''
  }

  function downloadTemplate() {
    const templates = {
      tem_landings: 'vessel_id,landing_date,delivery_date,pounds,processor_id,season,season_year\n8aa52a16-580d-4f0e-9c5e-3e301d5ccbb6,2025-01-01,2025-01-01,280000,6d6d66fa-03ab-4d08-b950-c9efea4946a8,A,2025',
      rockfish_quota: 'vessel_id,species,quota_pounds,season_year\n8aa52a16-580d-4f0e-9c5e-3e301d5ccbb6,Northern Rockfish,50000,2025',
      rockfish_transfers: 'from_vessel_id,to_vessel_id,species,pounds,transfer_date\n8aa52a16-580d-4f0e-9c5e-3e301d5ccbb6,another-vessel-id,Northern Rockfish,10000,2025-01-15',
      salmon_bycatch: 'vessel_id,species,count,date,season_year\n8aa52a16-580d-4f0e-9c5e-3e301d5ccbb6,Chinook Salmon,5,2025-01-01,2025'
    }

    const content = templates[uploadType]
    const blob = new Blob([content], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${uploadType}_template.csv`
    link.click()
    window.URL.revokeObjectURL(url)
  }

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
              <h1 className="text-xl font-semibold text-gray-900">Data Upload</h1>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">

          {/* Upload Form */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Upload CSV Data</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Type
                </label>
                <select
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="tem_landings">TEM Pollock Landings</option>
                  <option value="rockfish_quota">Rockfish Quota Allocations</option>
                  <option value="rockfish_transfers">Rockfish Quota Transfers</option>
                  <option value="salmon_bycatch">Salmon Bycatch Data</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CSV File
                </label>
                <input
                  id="fileInput"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex space-x-4 mb-4">
              <button
                onClick={downloadTemplate}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                Download Template
              </button>

              {file && (
                <button
                  onClick={handleUpload}
                  disabled={loading || validationErrors.length > 0}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Uploading...' : 'Upload Data'}
                </button>
              )}
            </div>

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                <h4 className="text-red-800 font-medium mb-2">Validation Errors:</h4>
                <ul className="text-red-700 text-sm space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Data Preview */}
            {preview.length > 0 && (
              <div className="mt-6">
                <h4 className="text-lg font-medium text-gray-900 mb-3">
                  Data Preview (first 10 rows)
                </h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {Object.keys(preview[0]).map((header) => (
                          <th key={header} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border border-gray-200">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          {Object.values(row).map((value, cellIndex) => (
                            <td key={cellIndex} className="px-4 py-2 text-sm text-gray-900 border border-gray-200">
                              {value}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}