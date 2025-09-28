export default function EnvCheck() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Environment Variables Check</h1>
      <div className="space-y-2">
        <div>
          <strong>NEXT_PUBLIC_SUPABASE_URL:</strong>
          <span className="ml-2 text-sm">
            {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ SET' : '❌ MISSING'}
          </span>
          {process.env.NEXT_PUBLIC_SUPABASE_URL && (
            <div className="text-xs text-gray-600 mt-1">
              {process.env.NEXT_PUBLIC_SUPABASE_URL}
            </div>
          )}
        </div>

        <div>
          <strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong>
          <span className="ml-2 text-sm">
            {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ SET' : '❌ MISSING'}
          </span>
          {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && (
            <div className="text-xs text-gray-600 mt-1">
              {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...
            </div>
          )}
        </div>

        <div>
          <strong>SUPABASE_SERVICE_ROLE_KEY:</strong>
          <span className="ml-2 text-sm">
            {process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ SET' : '❌ MISSING'}
          </span>
        </div>

        <div>
          <strong>RESEND_API_KEY:</strong>
          <span className="ml-2 text-sm">
            {process.env.RESEND_API_KEY ? '✅ SET' : '❌ MISSING'}
          </span>
        </div>
      </div>
    </div>
  )
}