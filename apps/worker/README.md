# Access Metadata Extraction Worker

Windows-based .NET 8 worker that extracts metadata from Microsoft Access databases using DAO and VBIDE COM automation.

## Prerequisites

- Windows OS (COM automation requires Windows)
- Microsoft Access or Access Runtime installed
- .NET 8 SDK
- **Enable VBA Trust**: In Access, go to File → Options → Trust Center → Trust Center Settings → Macro Settings → ✓ Trust access to VBA project object model

## Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
STORAGE_BUCKET=access-files
WORKER_POLL_MS=4000
```

## Running

```bash
cd apps/worker
dotnet run
```

## How It Works

1. **Poll for Jobs**: Every 4 seconds, queries Postgres for pending `import_jobs`
2. **Download File**: Downloads .accdb/.mdb file from Supabase Storage
3. **Extract Queries**: Uses DAO COM automation to read QueryDefs
4. **Extract VBA**: Uses VBIDE COM automation to read VBA modules
5. **Save to DB**: Inserts extracted data into `queries` and `vba_modules` tables
6. **Update Status**: Marks job as `completed` or `failed`

## Deployment

### Option 1: Windows Service (Recommended)

Use NSSM (Non-Sucking Service Manager):

```powershell
nssm install AccessMetadataWorker "C:\path\to\worker.exe"
nssm start AccessMetadataWorker
```

### Option 2: Task Scheduler

Create a scheduled task to run the worker on system startup.

### Option 3: Console

Run directly in a PowerShell window (for testing):

```powershell
dotnet run
```

## Troubleshooting

**Error: "Could not find DAO.DBEngine.120"**
- Install Microsoft Access Database Engine (redistributable) or Access Runtime

**Error: "VBE object is null"**
- Ensure "Trust access to VBA project object model" is enabled in Access

**Error: "Database already in use"**
- Access locks files; ensure no other process has the file open
- Worker downloads to temp directory to avoid conflicts

**Error: "Connection timeout"**
- Check DATABASE_URL and SUPABASE_URL are correct
- Verify network connectivity to Supabase

## Notes

- Worker uses `service_role` key to bypass RLS policies
- Temporary files are stored in `%TEMP%` and deleted after processing
- COM objects are properly released to prevent memory leaks
- File hashes (SHA256) are computed for deduplication

