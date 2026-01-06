export interface Session {
  id: string
  user_id: string
  browser: string | null
  ip: string | null
  created_at: Date
  expires_at: Date
}
