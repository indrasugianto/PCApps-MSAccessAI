-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE vba_modules ENABLE ROW LEVEL SECURITY;

-- ============ PROJECTS POLICIES ============
-- Authenticated users can only see their own projects
CREATE POLICY "Users can view their own projects" 
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create projects" 
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" 
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" 
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- ============ IMPORT JOBS POLICIES ============
-- Users can view import jobs in their projects
CREATE POLICY "Users can view import jobs in their projects" 
  ON import_jobs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = import_jobs.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create import jobs in their projects" 
  ON import_jobs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update import jobs in their projects" 
  ON import_jobs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = import_jobs.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- ============ QUERIES POLICIES ============
-- Users can view queries from their projects
CREATE POLICY "Users can view queries in their projects" 
  ON queries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = queries.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert queries in their projects" 
  ON queries FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- ============ VBA MODULES POLICIES ============
-- Users can view VBA modules from their projects
CREATE POLICY "Users can view VBA modules in their projects" 
  ON vba_modules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = vba_modules.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert VBA modules in their projects" 
  ON vba_modules FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- ============ SERVICE ROLE BYPASS ============
-- Service role (worker) can do anything (runs with full privileges)
-- By default, service role keys bypass RLS, so no explicit policy needed
-- But you can add explicit policies if needed for audit trails
