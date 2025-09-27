/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Enable server actions (fixed for Next.js 15)
    serverActions: {
      allowedOrigins: ['localhost:3000', '*.vercel.app'],
    },
  },
  // Supabase configuration
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
}

module.exports = nextConfig