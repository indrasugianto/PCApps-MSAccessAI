# Worker - Access Metadata Extraction

.NET 8 Windows worker that extracts metadata from MS Access databases using COM automation.

## Prerequisites

- Windows OS (COM automation requires Windows)
- Microsoft Access or [Access Runtime](https://www.microsoft.com/en-us/download/details.aspx?id=54920) (free)
- .NET 8 SDK
- **Enable VBA Trust**: Access → File → Options → Trust Center → Trust Center Settings → Macro Settings → ✓ Trust access to VBA project object model

## Setup

Create `.env` file in project root:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
STORAGE_BUCKET=access-files
WORKER_POLL_MS=4000
```

## Run

```bash
cd apps/worker
dotnet run
```

## How It Works

1. Polls Postgres every 4 seconds for pending `import_jobs`
2. Downloads .accdb/.mdb file from Supabase Storage
3. Extracts queries using DAO COM automation
4. Extracts VBA modules using VBIDE COM automation
5. Inserts data into `queries` and `vba_modules` tables
6. Updates job status to `completed` or `failed`

## Deployment

### Option 1: Windows Service (Recommended)

Use [NSSM](https://nssm.cc/):

```powershell
dotnet publish -c Release -r win-x64 --self-contained
nssm install AccessMetadataWorker "C:\path\to\worker.exe"
nssm start AccessMetadataWorker
```

### Option 2: Task Scheduler

Create scheduled task to run on system startup.

## Troubleshooting

**"Could not find DAO.DBEngine.120"**
- Install Microsoft Access Database Engine or Access Runtime

**"VBE object is null"**
- Enable "Trust access to VBA project object model" in Access
- Restart worker

**"Connection timeout"**
- Check DATABASE_URL and SUPABASE_URL
- Verify network connectivity

## Tech Stack

- .NET 8
- Supabase .NET SDK
- Npgsql (PostgreSQL)
- DAO.DBEngine (COM)
- Microsoft.Office.Interop.Access (COM)
