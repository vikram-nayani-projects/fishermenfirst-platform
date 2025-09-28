export default function DebugEnv() {
  // Get all environment variables that start with NEXT_PUBLIC_ or specific ones we need
  const envVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
  }

  // Helper function to mask sensitive values
  const maskValue = (value, key) => {
    if (!value) return null
    if (key.includes('URL')) return value // URLs are safe to show
    return value.substring(0, 10) + '...' + value.substring(value.length - 5) // Show first 10 and last 5 chars
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🔍 Environment Variables Debug</h1>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Environment Variables Status</h2>

        <div className="space-y-3">
          {Object.entries(envVars).map(([key, value]) => (
            <div key={key} className="border-b pb-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">{key}:</span>
                <span className={`px-2 py-1 rounded text-sm ${
                  value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {value ? '✅ SET' : '❌ MISSING'}
                </span>
              </div>
              {value && (
                <div className="mt-1 text-sm text-gray-600 font-mono">
                  {maskValue(value, key)}
                </div>
              )}
              <div className="mt-1 text-xs text-gray-500">
                Length: {value ? value.length : 0} characters
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded">
          <h3 className="font-semibold text-blue-900 mb-2">Debugging Tips:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Variables starting with NEXT_PUBLIC_ are available in browser</li>
            <li>• Server-only variables (like SERVICE_ROLE_KEY) only work in API routes or server-side</li>
            <li>• Check Vercel dashboard Environment Variables section</li>
            <li>• Make sure variables are set for "All Environments"</li>
            <li>• Redeploy after adding/changing variables</li>
          </ul>
        </div>
      </div>

      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Important Note:</h3>
        <p className="text-sm text-yellow-800">
          If SUPABASE_SERVICE_ROLE_KEY shows as MISSING here but exists in Vercel,
          it means it's not being loaded properly. This could be due to:
        </p>
        <ul className="text-sm text-yellow-800 mt-2 space-y-1 ml-4">
          <li>• Typo in variable name</li>
          <li>• Wrong environment scope (Development vs Production)</li>
          <li>• Need to redeploy after adding the variable</li>
          <li>• Variable name doesn't match exactly</li>
        </ul>
      </div>
    </div>
  )
}