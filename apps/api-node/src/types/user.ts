export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  avatar: string | null;
  created_at?: string;
  updated_at?: string | null;
  deleted_at?: string | null;
}
