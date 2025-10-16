# Access Metadata Explorer

A full-stack app to upload MS Access databases (.mdb/.accdb), extract saved query SQL (DAO) and VBA modules (VBIDE), and store them in Supabase Postgres for browsing in a React UI.

**Supabase Project:** `PCApps-MSAccessAI`  
**Project URL:** https://qexnxhojzciwdzlwttcd.supabase.co  
**Database Password:** `KXBM?BaAopz?9BHt`  
**Anon Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (see .env below)

## Architecture

- **Web (React + Vite + TS)**: Upload files to Supabase Storage, manage projects, view queries/modules via Supabase JS SDK
- **Supabase (Postgres + Storage + Auth)**: Database, file storage, and user authentication
- **Worker (.NET 8, Windows)**: Polls for jobs, extracts metadata using DAO and VBIDE COM automation

> **Note**: The API component is optional. Frontend can communicate directly with Supabase using the JS SDK. Add a .NET API later if you need custom business logic, rate limiting, or additional validation.

> **Important**: Office automation requires a dedicated Windows worker with Microsoft Access (or Access Runtime) installed. Enable *Trust access to the VBA project object model* in Access settings.

## Quick Start

### 1) Setup Supabase
- Get credentials from https://supabase.com/dashboard/projects
- **Enable Authentication**: Go to Authentication → Providers → Enable **Email** (or Google/GitHub)
- **Create Storage bucket**: Named `access-files` (set to private)
- **Apply schemas**:
  - Run `./supabase/sql/001_schema.sql` (tables)
  - Run `./supabase/sql/002_policies.sql` (RLS)
  - Run `./supabase/sql/003_storage_policies.sql` (storage access)

### 2) Configure Environment

**Root `.env`** (for API and Worker):
```env
# Database
DATABASE_URL=postgresql://postgres:KXBM?BaAopz?9BHt@db.qexnxhojzciwdzlwttcd.supabase.co:5432/postgres

# Supabase
SUPABASE_URL=https://qexnxhojzciwdzlwttcd.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFleG54aG9qemNpd2R6bHd0dGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MDY1NTEsImV4cCI6MjA3NjE4MjU1MX0.Gx3GZzC0bIc8WIBYQvt_da6wC2T0gDGzVVemhhNqDXw
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
STORAGE_BUCKET=access-files

# API
API_PORT=5041
API_CORS_ORIGIN=http://localhost:5173

# Worker
WORKER_POLL_MS=4000
```

**Frontend `.env`** (create `apps/web/.env`):
```env
VITE_SUPABASE_URL=https://qexnxhojzciwdzlwttcd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFleG54aG9qemNpd2R6bHd0dGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MDY1NTEsImV4cCI6MjA3NjE4MjU1MX0.Gx3GZzC0bIc8WIBYQvt_da6wC2T0gDGzVVemhhNqDXw
```

> **Security:** Never commit `.env` files with real credentials.

### 3) Run Applications

**Frontend:**
```bash
cd apps/web && npm install && npm run dev  # http://localhost:5173
```

**API:**
```bash
cd apps/api && dotnet run  # Port 5041
```

**Worker (Windows):**
```bash
cd apps/worker && dotnet run
```

### 4) Frontend Upload Flow

Users interact with the system through the React frontend:

```typescript
// 1. User signs up/logs in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

// 2. User creates a project
const { data: project } = await supabase
  .from('projects')
  .insert({ 
    name: 'My Access Migration',
    user_id: user.id 
  })
  .select()
  .single();

// 3. User uploads .accdb file
const file = fileInput.files[0]; // From <input type="file">
const { data: uploadData } = await supabase.storage
  .from('access-files')
  .upload(`${project.id}/${file.name}`, file);

// 4. Create import job for worker to process
const { data: job } = await supabase
  .from('import_jobs')
  .insert({
    project_id: project.id,
    access_filename: file.name,
    storage_path: `${project.id}/${file.name}`,
    status: 'pending'
  });

// 5. Worker picks up job, extracts metadata, updates status to 'completed'
// 6. Frontend polls job status and displays extracted queries/modules
```

## Prerequisites

- **Frontend:** Node.js 18+, `@supabase/supabase-js` package
- **API:** .NET 8 SDK
- **Worker:** Windows + Microsoft Access/Access Runtime + `Supabase` NuGet package
  - Enable: *File → Options → Trust Center → Macro Settings → ✓ Trust access to VBA project object model*
  - Install: `dotnet add package Supabase`

## Database Schema

Four core tables (see `./supabase/sql/001_schema.sql`):

### `projects`
- Project metadata and user association

### `import_jobs`
Tracks each uploaded Access file:
- `access_filename` - Original filename (e.g., `SalesDB.accdb`)
- `storage_path` - Location in Supabase Storage
- `status` - pending, processing, completed, failed
- `file_hash` - SHA256 for deduplication
- `query_count`, `module_count` - Extracted metadata counts

### `queries`
Extracted SQL queries:
- `import_job_id` - Links to specific import job
- `access_filename` - Denormalized for fast filtering
- `query_name` - Original name in Access
- `sql_text` - The extracted SQL
- `sql_hash` - For detecting duplicates across files

### `vba_modules`
Exported VBA code:
- `import_job_id` - Links to specific import job
- `access_filename` - Denormalized for fast filtering
- `module_name` - Module name in Access
- `module_type` - Standard or Class
- `code` - The VBA code
- `code_hash` - For detecting duplicates across files

## Multi-File Support

**Design:** Each uploaded file creates an `import_job`. All extracted queries and modules store the `access_filename` for easy filtering and comparison.

**Data Flow:**
```
Upload → Supabase Storage → import_job created
Worker → Extracts metadata → Stores filename in each record
Frontend → Filter by filename or view all
```

### Useful Queries

**List all files in a project:**
```sql
SELECT access_filename, status, query_count, module_count, created_at
FROM import_jobs
WHERE project_id = 'your-project-id'
ORDER BY created_at DESC;
```

**Get queries from specific file:**
```sql
SELECT query_name, sql_text, query_type
FROM queries
WHERE access_filename = 'SalesDB.accdb' AND project_id = 'your-project-id';
```

**Compare queries across files:**
```sql
SELECT q1.query_name, q1.access_filename, q2.access_filename,
       q1.sql_text = q2.sql_text AS identical
FROM queries q1
JOIN queries q2 ON q1.query_name = q2.query_name 
  AND q1.project_id = q2.project_id
  AND q1.access_filename != q2.access_filename
WHERE q1.project_id = 'your-project-id';
```

**Find duplicate VBA code:**
```sql
SELECT access_filename, module_name, code_hash
FROM vba_modules
WHERE project_id = 'your-project-id'
  AND code_hash IN (
    SELECT code_hash FROM vba_modules 
    WHERE project_id = 'your-project-id'
    GROUP BY code_hash HAVING COUNT(*) > 1
  )
ORDER BY code_hash, access_filename;
```

### Frontend Display Patterns

**File Browser:**
```
Project: Sales Analysis
├── SalesDB.accdb (2025-01-15) - 23 queries, 5 modules
├── Archive.accdb (2025-01-10) - 18 queries, 3 modules
└── Test.accdb (2025-01-14) - 4 queries, 2 modules
```

**Unified List:**
| File | Query Name | Type |
|------|------------|------|
| SalesDB.accdb | qryCustomers | Standard |
| SalesDB.accdb | qryOrderTotals | Crosstab |
| Archive.accdb | qryArchivedSales | Standard |

### Worker Implementation Example

```csharp
var job = await GetPendingImportJob();
var filename = job.AccessFilename;  // "SalesDB.accdb"

foreach (var query in ExtractQueries(job.StoragePath)) {
    await db.Queries.AddAsync(new Query { 
        ImportJobId = job.Id,
        AccessFilename = filename,  // Store filename!
        QueryName = query.Name,
        SqlText = query.Sql
    });
}
```

## API Endpoints

**Projects:**
- `POST /projects` - Create project
- `GET /projects` - List projects

**Import Jobs:**
- `POST /import-jobs` - Queue extraction job
- `GET /import-jobs/{id}` - Get job status
- `DELETE /import-jobs/{id}` - Delete job and all data

**Queries & Modules:**
- `GET /queries/{projectId}` - List queries
- `GET /modules/{projectId}` - List VBA modules
- `GET /projects/{id}/files` - List all files
- `GET /projects/{id}/files/{filename}/queries` - Queries from specific file
- `GET /projects/{id}/files/{filename}/modules` - Modules from specific file

## Deployment

**Frontend:** Build with `npm run build` → Deploy to Vercel/Netlify/Azure Static Web Apps

**API:** Publish with `dotnet publish -c Release` → Deploy to Azure App Service/AWS/Heroku

**Worker:** Publish with `dotnet publish -c Release -r win-x64 --self-contained` → Run on Windows VM as Windows Service (use NSSM or Task Scheduler)

## Troubleshooting

**VBA trust error:** Enable *Trust access to VBA project object model* in Access settings

**Worker not picking jobs:** Check `WORKER_POLL_MS` and verify `DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

**CORS errors:** Verify `API_CORS_ORIGIN` matches frontend URL

**Storage space:** Monitor Supabase Storage usage for large files

## Project Structure

```
/access-metadata-explorer
  /apps
    /api              # .NET 8 Minimal API
    /worker           # .NET 8 Windows Console (DAO + VBIDE)
    /web              # React + Vite + TS
  /packages
    /shared           # Shared TypeScript types
  /supabase
    /sql              # 001_schema.sql, 002_policies.sql
  .gitignore
  README.md
  .env.example
```

## Technical Validation

✅ **This plan will work.** The architecture is sound and all components are technically feasible. 

See [TECHNICAL_REVIEW.md](TECHNICAL_REVIEW.md) for a detailed technical analysis including:
- Architecture validation
- Database schema review
- Security considerations
- Implementation checklist
- Identified issues and fixes

**Key Requirements for Success:**
1. ✅ Supabase Auth enabled
2. ✅ Storage bucket with policies configured
3. ✅ Frontend uses Supabase JS SDK
4. ✅ Worker uses Supabase .NET SDK
5. ✅ Windows machine with Access Runtime for worker
6. ✅ All three SQL schema files applied

## License

MIT
