import { inviteUser } from '../../../lib/user-management'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, role, vessel_id } = req.body

  if (!email || !role) {
    return res.status(400).json({ error: 'email and role required' })
  }

  try {
    const result = await inviteUser(email, role, vessel_id)
    return res.status(200).json(result)
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}