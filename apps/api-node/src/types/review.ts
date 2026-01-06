export interface Review {
  review_text?: string
  score?: number
  game_id: string
  user_id: string
  created_at?: Date
  updated_at?: Date
}
