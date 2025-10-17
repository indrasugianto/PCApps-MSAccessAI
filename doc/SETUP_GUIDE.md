# Setup Guide

Complete guide to set up and run the Access Metadata Explorer.

## Prerequisites

- **Frontend**: Node.js 18+
- **Backend**: Supabase account (free tier works)
- **Worker**: Windows OS, .NET 8 SDK, Microsoft Access or Access Runtime

## Step 1: Supabase Configuration

### 1.1 Apply Database Schemas

Go to [SQL Editor](https://supabase.com/dashboard/project/qexnxhojzciwdzlwttcd/sql/new) and run in order:

1. `supabase/sql/001_schema.sql` - Creates tables
2. `supabase/sql/002_policies.sql` - Enables RLS
3. `supabase/sql/003_storage_policies.sql` - Creates storage bucket

### 1.2 Enable Authentication

1. Go to Authentication → Providers
2. Enable **Email** provider
3. (Optional) Disable email confirmation for easier testing

### 1.3 Get API Keys

Go to Settings → API and copy:
- **Project URL**: `https://qexnxhojzciwdzlwttcd.supabase.co`
- **Anon key**: For frontend (public key)
- **Service role key**: For worker (keep secret!)

## Step 2: Environment Configuration

### Frontend Environment

Create `apps/web/.env`:

```env
VITE_SUPABASE_URL=https://qexnxhojzciwdzlwttcd.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### Worker Environment

Create `.env` in project root:

```env
DATABASE_URL=postgresql://postgres:KXBM?BaAopz?9BHt@db.qexnxhojzciwdzlwttcd.supabase.co:5432/postgres
SUPABASE_URL=https://qexnxhojzciwdzlwttcd.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
STORAGE_BUCKET=access-files
WORKER_POLL_MS=4000
```

## Step 3: Run Frontend

```bash
cd apps/web
npm install
npm run dev
```

Open http://localhost:5173

## Step 4: Run Worker (Windows)

### Enable VBA Trust

1. Open Microsoft Access
2. File → Options → Trust Center → Trust Center Settings
3. Macro Settings → ✓ **Trust access to the VBA project object model**
4. Click OK

### Run Worker

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

## Step 5: Test End-to-End

1. **Sign Up** at http://localhost:5173
2. **Create a Project** (+ New Project button)
3. **Upload an Access file** (.accdb or .mdb)
4. **Watch worker console** - should process within 4 seconds
5. **View results** in Queries and VBA Modules tabs

## Troubleshooting

### Frontend Issues

**"Missing Supabase environment variables"**
- Ensure `apps/web/.env` exists with correct values
- Restart dev server after creating .env

**"Failed to upload file"**
- Check storage bucket `access-files` exists
- Verify storage policies are applied (003_storage_policies.sql)

### Worker Issues

**"Could not find DAO.DBEngine.120"**
- Install [Microsoft Access Runtime](https://www.microsoft.com/en-us/download/details.aspx?id=54920) (free)

**"VBE object is null"**
- Enable "Trust access to VBA project object model" in Access
- Restart worker after enabling

**"Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"**
- Ensure `.env` file exists in project root
- Verify service role key is correct

### Database Issues

**"Table does not exist"**
- Run all SQL files in order (001, 002, 003)

**"Permission denied"**
- Verify RLS policies are applied (002_policies.sql)
- Check user is authenticated

## Verification

Run through this checklist:

- [ ] Database tables created (projects, import_jobs, queries, vba_modules)
- [ ] Storage bucket `access-files` created
- [ ] RLS policies enabled
- [ ] Email authentication enabled
- [ ] Frontend .env file created
- [ ] Worker .env file created
- [ ] Frontend runs at http://localhost:5173
- [ ] Worker runs without errors
- [ ] Can sign up and create project
- [ ] Can upload Access file
- [ ] Worker processes file
- [ ] Results appear in frontend

## Deployment

### Frontend

```bash
cd apps/web
npm run build
# Deploy dist/ folder to Vercel, Netlify, or Azure Static Web Apps
```

### Worker

```bash
cd apps/worker
dotnet publish -c Release -r win-x64 --self-contained
# Copy to Windows VM and install as Windows Service using NSSM
```

## Next Steps

- Review [Implementation Guide](IMPLEMENTATION.md) for architecture details
- Check [Technical Review](TECHNICAL_REVIEW.md) for security considerations
- See [Original Spec](Readme.md) for complete feature list
