-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  user_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_projects_user_id ON projects(user_id);

-- Import Jobs table - tracks each Access file processed
CREATE TABLE IF NOT EXISTS import_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- MS Access file information
  access_filename VARCHAR(255) NOT NULL,  -- Original filename (e.g., "MyDatabase.accdb")
  storage_path VARCHAR(1024) NOT NULL,    -- Full path in Supabase Storage
  storage_bucket VARCHAR(255) NOT NULL DEFAULT 'access-files',
  
  -- Job status
  status VARCHAR(50) NOT NULL DEFAULT 'pending',  -- pending, processing, completed, failed
  error_message TEXT,
  
  -- File information
  file_size_bytes BIGINT,
  file_hash VARCHAR(64),  -- SHA256 for deduplication
  
  -- Metadata
  query_count INTEGER DEFAULT 0,
  module_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_import_jobs_project_id ON import_jobs(project_id);
CREATE INDEX idx_import_jobs_status ON import_jobs(status);
CREATE INDEX idx_import_jobs_created_at ON import_jobs(created_at DESC);
CREATE UNIQUE INDEX idx_import_jobs_file_hash ON import_jobs(file_hash) WHERE file_hash IS NOT NULL;

-- Extracted Queries table - linked to import job for file traceability
CREATE TABLE IF NOT EXISTS queries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  import_job_id UUID NOT NULL REFERENCES import_jobs(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Query metadata
  query_name VARCHAR(255) NOT NULL,        -- Original name in Access
  access_filename VARCHAR(255) NOT NULL,   -- Denormalized from import_job for easy filtering
  
  -- SQL content
  sql_text TEXT NOT NULL,
  sql_hash VARCHAR(64),  -- For deduplication detection
  
  -- Query type (saved query, crosstab, aggregate, etc.)
  query_type VARCHAR(100),
  
  -- Status
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_queries_import_job_id ON queries(import_job_id);
CREATE INDEX idx_queries_project_id ON queries(project_id);
CREATE INDEX idx_queries_access_filename ON queries(access_filename);
CREATE INDEX idx_queries_query_name ON queries(query_name);
CREATE INDEX idx_queries_created_at ON queries(created_at DESC);

-- VBA Modules table - linked to import job for file traceability
CREATE TABLE IF NOT EXISTS vba_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  import_job_id UUID NOT NULL REFERENCES import_jobs(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Module metadata
  module_name VARCHAR(255) NOT NULL,       -- Module name in Access
  access_filename VARCHAR(255) NOT NULL,   -- Denormalized from import_job for easy filtering
  module_type VARCHAR(50) NOT NULL,        -- 'Standard' or 'Class'
  
  -- VBA code
  code TEXT NOT NULL,
  code_hash VARCHAR(64),
  
  -- Line count for reference
  line_count INTEGER,
  
  -- Status
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_vba_modules_import_job_id ON vba_modules(import_job_id);
CREATE INDEX idx_vba_modules_project_id ON vba_modules(project_id);
CREATE INDEX idx_vba_modules_access_filename ON vba_modules(access_filename);
CREATE INDEX idx_vba_modules_module_name ON vba_modules(module_name);
CREATE INDEX idx_vba_modules_created_at ON vba_modules(created_at DESC);

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER import_jobs_updated_at BEFORE UPDATE ON import_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER queries_updated_at BEFORE UPDATE ON queries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER vba_modules_updated_at BEFORE UPDATE ON vba_modules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
