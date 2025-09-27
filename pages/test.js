export default function Test() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Test Page</h1>
      <p>If you can see this, the latest code is deployed!</p>
      <p>Deployment commit: 9a1ff0b</p>
      <div className="mt-4">
        <a href="/login" className="text-blue-600 hover:underline">
          Try Login Page
        </a>
      </div>
      <div className="mt-2">
        <a href="/admin" className="text-blue-600 hover:underline">
          Try Admin Page
        </a>
      </div>
    </div>
  )
}