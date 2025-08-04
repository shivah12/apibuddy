import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      request_history: {
        Row: {
          id: string
          user_id: string
          method: string
          url: string
          headers: any
          body: string | null
          response: any
          status_code: number
          response_time: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          method: string
          url: string
          headers?: any
          body?: string | null
          response?: any
          status_code: number
          response_time: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          method?: string
          url?: string
          headers?: any
          body?: string | null
          response?: any
          status_code?: number
          response_time?: number
          created_at?: string
        }
      }
    }
  }
}
