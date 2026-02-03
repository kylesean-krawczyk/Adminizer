import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Document = {
  id: string
  name: string
  category: string
  upload_date: string
  expiry_date: string | null
  size: number
  status: string
  file_path: string
  tags: string[]
  description: string | null
  organization_id: string | null
  created_at: string
  updated_at: string
  is_donor_data_processed: boolean
  content_extracted?: string | null
  document_type?: string
  indexed_keywords?: string[]
  author?: string | null
  department?: string | null
}