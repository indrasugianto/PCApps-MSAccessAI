# 🚀 Supabase Setup Instructions

Your verification showed that you need to run the SQL files to set up the database.

## ✅ Current Status

- ✅ **Connection**: Working (credentials are valid)
- ✅ **Authentication**: Configured
- ❌ **Tables**: Not created yet
- ❌ **Storage**: Bucket not created yet

---

## 📝 Step-by-Step Setup

### Step 1: Open Supabase SQL Editor

Click here: [Open SQL Editor](https://supabase.com/dashboard/project/qexnxhojzciwdzlwttcd/sql/new)

---

### Step 2: Run SQL Files (In Order)

Copy and paste each SQL file content into the SQL Editor and click **RUN**.

#### 📄 File 1: Create Tables (`001_schema.sql`)

**What it does**: Creates the 4 main tables (projects, import_jobs, queries, vba_modules)

**SQL to run**:
```sql
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
  access_filename VARCHAR(255) NOT NULL,
  storage_path VARCHAR(1024) NOT NULL,
  storage_bucket VARCHAR(255) NOT NULL DEFAULT 'access-files',
  
  -- Job status
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  error_message TEXT,
  
  -- File information
  file_size_bytes BIGINT,
  file_hash VARCHAR(64),
  
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

-- Extracted Queries table
CREATE TABLE IF NOT EXISTS queries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  import_job_id UUID NOT NULL REFERENCES import_jobs(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  query_name VARCHAR(255) NOT NULL,
  access_filename VARCHAR(255) NOT NULL,
  
  sql_text TEXT NOT NULL,
  sql_hash VARCHAR(64),
  query_type VARCHAR(100),
  
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_queries_import_job_id ON queries(import_job_id);
CREATE INDEX idx_queries_project_id ON queries(project_id);
CREATE INDEX idx_queries_access_filename ON queries(access_filename);
CREATE INDEX idx_queries_query_name ON queries(query_name);
CREATE INDEX idx_queries_created_at ON queries(created_at DESC);

-- VBA Modules table
CREATE TABLE IF NOT EXISTS vba_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  import_job_id UUID NOT NULL REFERENCES import_jobs(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  module_name VARCHAR(255) NOT NULL,
  access_filename VARCHAR(255) NOT NULL,
  module_type VARCHAR(50) NOT NULL,
  
  code TEXT NOT NULL,
  code_hash VARCHAR(64),
  line_count INTEGER,
  
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
```

✅ **Verify**: Go to Table Editor - you should see 4 tables

---

#### 📄 File 2: Security Policies (`002_policies.sql`)

**What it does**: Enables Row Level Security to protect user data

**SQL to run**:
```sql
-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE vba_modules ENABLE ROW LEVEL SECURITY;

-- Projects policies
CREATE POLICY "Users can view their own projects" 
  ON projects FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create projects" 
  ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" 
  ON projects FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" 
  ON projects FOR DELETE USING (auth.uid() = user_id);

-- Import Jobs policies
CREATE POLICY "Users can view import jobs in their projects" 
  ON import_jobs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = import_jobs.project_id 
    AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can create import jobs in their projects" 
  ON import_jobs FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_id 
    AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can update import jobs in their projects" 
  ON import_jobs FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = import_jobs.project_id 
    AND projects.user_id = auth.uid()
  ));

-- Queries policies
CREATE POLICY "Users can view queries in their projects" 
  ON queries FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = queries.project_id 
    AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert queries in their projects" 
  ON queries FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_id 
    AND projects.user_id = auth.uid()
  ));

-- VBA Modules policies
CREATE POLICY "Users can view VBA modules in their projects" 
  ON vba_modules FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = vba_modules.project_id 
    AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert VBA modules in their projects" 
  ON vba_modules FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_id 
    AND projects.user_id = auth.uid()
  ));
```

✅ **Verify**: Each table should show "RLS enabled" in Table Editor

---

#### 📄 File 3: Storage Bucket (`003_storage_policies.sql`)

**What it does**: Creates the storage bucket for Access files

**SQL to run**:
```sql
-- Create storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('access-files', 'access-files', false)
ON CONFLICT (id) DO NOTHING;

-- Upload policy
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'access-files' 
  AND auth.role() = 'authenticated'
);

-- Read policies
CREATE POLICY "Authenticated users can read files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'access-files' 
  AND (auth.role() = 'authenticated' OR auth.role() = 'service_role')
);

CREATE POLICY "Service role can access all files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'access-files' 
  AND auth.role() = 'service_role'
);

-- Delete policy
CREATE POLICY "Authenticated users can delete files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'access-files' 
  AND auth.role() = 'authenticated'
);
```

✅ **Verify**: Go to Storage - you should see `access-files` bucket

---

### Step 3: Enable Email Authentication

1. Go to [Authentication → Providers](https://supabase.com/dashboard/project/qexnxhojzciwdzlwttcd/auth/providers)
2. Find **Email** provider
3. Toggle it **ON** (enabled)
4. (Optional) Disable email confirmation for easier testing

---

### Step 4: Run Verification Again

```bash
npm run verify
```

You should now see all ✅ PASS!

---

## 🎯 What's Next?

After all checks pass:

1. **Get Service Role Key** (for worker):
   - Go to [Settings → API](https://supabase.com/dashboard/project/qexnxhojzciwdzlwttcd/settings/api)
   - Copy the **service_role** key

2. **Create Worker `.env`** (in project root):
   ```env
   DATABASE_URL=postgresql://postgres:KXBM?BaAopz?9BHt@db.qexnxhojzciwdzlwttcd.supabase.co:5432/postgres
   SUPABASE_URL=https://qexnxhojzciwdzlwttcd.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   STORAGE_BUCKET=access-files
   WORKER_POLL_MS=4000
   ```

3. **Start Testing**:
   ```bash
   # Terminal 1 - Frontend
   cd apps/web
   npm run dev
   
   # Terminal 2 - Worker (Windows)
   cd apps/worker
   dotnet run
   ```

4. **Test the App**:
   - Go to http://localhost:5173
   - Sign up with an email
   - Create a project
   - Upload an Access file
   - Watch the magic happen! 🎉

---

## 🆘 Troubleshooting

- **SQL Error**: Make sure you're logged into the correct Supabase project
- **Tables already exist**: That's okay! The SQL uses `IF NOT EXISTS`
- **Policies fail**: Drop existing policies first or ignore duplicate errors
- **Storage bucket exists**: The `ON CONFLICT DO NOTHING` will handle it

---

**Need Help?** Check `SUPABASE_VERIFICATION_CHECKLIST.md` for detailed troubleshooting.

