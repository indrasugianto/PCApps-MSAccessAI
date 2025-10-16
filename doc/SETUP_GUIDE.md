# Setup Guide - Access Metadata Explorer

Step-by-step guide to set up and run the Access Metadata Explorer.

## Step 1: Apply Database Schemas to Supabase

1. Go to https://supabase.com/dashboard/project/qexnxhojzciwdzlwttcd/sql/new

2. Run each SQL file in order:

   **File 1: `supabase/sql/001_schema.sql`**
   - Creates tables: `projects`, `import_jobs`, `queries`, `vba_modules`
   - Sets up UUIDs, indexes, and constraints
   
   **File 2: `supabase/sql/002_policies.sql`**
   - Enables Row Level Security (RLS)
   - Creates policies for user data isolation
   
   **File 3: `supabase/sql/003_storage_policies.sql`**
   - Creates storage bucket `access-files`
   - Sets up upload/download policies

3. Verify tables exist:
   - Go to Table Editor
   - You should see: `projects`, `import_jobs`, `queries`, `vba_modules`

## Step 2: Enable Authentication

1. Go to Authentication → Providers
2. Enable **Email** provider
3. (Optional) Enable Google or GitHub OAuth

## Step 3: Get Service Role Key

1. Go to Settings → API
2. Copy your **service_role** key (needed for worker)
3. **Keep this secret!** Never commit to version control

## Step 4: Configure Environment Variables

### Frontend (.env file)

Create `apps/web/.env`:

```env
VITE_SUPABASE_URL=https://qexnxhojzciwdzlwttcd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFleG54aG9qemNpd2R6bHd0dGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MDY1NTEsImV4cCI6MjA3NjE4MjU1MX0.Gx3GZzC0bIc8WIBYQvt_da6wC2T0gDGzVVemhhNqDXw
```

### Worker (.env file)

Create `.env` in root directory:

```env
DATABASE_URL=postgresql://postgres:KXBM?BaAopz?9BHt@db.qexnxhojzciwdzlwttcd.supabase.co:5432/postgres
SUPABASE_URL=https://qexnxhojzciwdzlwttcd.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_FROM_STEP_3
STORAGE_BUCKET=access-files
WORKER_POLL_MS=4000
```

## Step 5: Run the Frontend

```bash
cd apps/web
npm install
npm run dev
```

Open http://localhost:5173

You should see the login page!

## Step 6: Run the Worker (Windows Only)

### Prerequisites:
- Windows OS
- Microsoft Access or Access Runtime installed
- Trust VBA access enabled

### Enable VBA Trust:
1. Open Microsoft Access
2. Go to File → Options
3. Trust Center → Trust Center Settings
4. Macro Settings
5. ✓ **Trust access to the VBA project object model**

### Run Worker:

```bash
cd apps/worker
dotnet run
```

You should see:
```
Access Metadata Extraction Worker
==================================
Supabase URL: https://qexnxhojzciwdzlwttcd.supabase.co
Poll Interval: 4000ms
```

## Step 7: Test End-to-End

1. **Sign Up**
   - Go to http://localhost:5173
   - Click "Don't have an account? Sign Up"
   - Enter email and password
   - Check your email for confirmation link

2. **Create Project**
   - Click "+ New Project"
   - Enter name: "Test Project"
   - Click "Create Project"

3. **Upload Access File**
   - Click on your project
   - Click "Choose File"
   - Select an .accdb or .mdb file
   - Click "Upload File"

4. **Watch Worker Process**
   - Worker console should show: "Found 1 pending job(s)"
   - Watch extraction progress
   - See: "✓ Completed job ..."

5. **View Results**
   - Frontend should update automatically
   - Click "Queries" tab to see extracted SQL
   - Click "VBA Modules" tab to see extracted code

## Troubleshooting

### Frontend Issues

**"Missing Supabase environment variables"**
- Ensure `apps/web/.env` exists with correct values
- Restart dev server: Ctrl+C, then `npm run dev`

**"Authentication failed"**
- Check that Email provider is enabled in Supabase
- Clear browser cookies/cache
- Try incognito mode

### Worker Issues

**"ERROR: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"**
- Ensure root `.env` file exists
- Check environment variables are set correctly

**"Could not find DAO.DBEngine.120"**
- Install Microsoft Access Database Engine
- Or install Access Runtime (free)

**"VBE object is null"**
- Enable "Trust access to VBA project object model" in Access
- Restart worker after enabling

**"Connection timeout"**
- Check internet connection
- Verify DATABASE_URL is correct
- Check firewall isn't blocking connections

### Storage Issues

**"Failed to upload file"**
- Verify storage bucket `access-files` exists
- Check storage policies are applied (003_storage_policies.sql)
- Ensure user is authenticated

## Next Steps

- Deploy frontend to Vercel/Netlify
- Run worker as Windows Service on production VM
- Set up monitoring and logging
- Add file size limits and validation
- Implement duplicate detection

## Support

If you encounter issues:
1. Check browser console (F12) for errors
2. Check worker console output
3. Verify all SQL scripts ran successfully
4. Check Supabase logs in dashboard
5. Review `TECHNICAL_REVIEW.md` for architecture details

