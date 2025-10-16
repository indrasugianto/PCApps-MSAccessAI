import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database Types
export interface Project {
  id: string;
  name: string;
  description?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface ImportJob {
  id: string;
  project_id: string;
  access_filename: string;
  storage_path: string;
  storage_bucket: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  file_hash?: string;
  query_count: number;
  module_count: number;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Query {
  id: string;
  import_job_id: string;
  project_id: string;
  access_filename: string;
  query_name: string;
  query_type?: string;
  sql_text: string;
  sql_hash: string;
  created_at: string;
}

export interface VbaModule {
  id: string;
  import_job_id: string;
  project_id: string;
  access_filename: string;
  module_name: string;
  module_type: string;
  code: string;
  code_hash: string;
  created_at: string;
}

