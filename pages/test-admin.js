// Simple test page to verify admin components work
export default function TestAdmin() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-6">Admin Test Page</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-green-600 font-semibold">✅ Admin pages are building correctly!</p>
        <p className="mt-4">Environment variables:</p>
        <ul className="mt-2 text-sm">
          <li>Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</li>
          <li>Anon Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</li>
        </ul>
        <div className="mt-6">
          <a href="/admin" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Try Admin Again
          </a>
        </div>
      </div>
    </div>
  )
}