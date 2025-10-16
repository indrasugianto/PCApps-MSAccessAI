# Supabase Setup Verification Checklist

Complete this checklist to ensure your Supabase instance is properly configured.

## 🔗 Quick Links

- **Supabase Dashboard**: https://supabase.com/dashboard/project/qexnxhojzciwdzlwttcd
- **SQL Editor**: https://supabase.com/dashboard/project/qexnxhojzciwdzlwttcd/sql/new
- **Table Editor**: https://supabase.com/dashboard/project/qexnxhojzciwdzlwttcd/editor
- **Storage**: https://supabase.com/dashboard/project/qexnxhojzciwdzlwttcd/storage/buckets
- **Authentication**: https://supabase.com/dashboard/project/qexnxhojzciwdzlwttcd/auth/users

---

## ✅ Step 1: Database Schema

### 1.1 Run SQL Files

Go to [SQL Editor](https://supabase.com/dashboard/project/qexnxhojzciwdzlwttcd/sql/new) and run these files **in order**:

- [ ] **File 1**: `supabase/sql/001_schema.sql`
  - Creates: `projects`, `import_jobs`, `queries`, `vba_modules` tables
  - Creates: Indexes and foreign keys
  - Creates: `update_updated_at_column()` function
  - Creates: Triggers for auto-updating timestamps

- [ ] **File 2**: `supabase/sql/002_policies.sql`
  - Enables Row Level Security (RLS) on all tables
  - Creates policies for user data isolation
  - Allows service role (worker) to bypass RLS

- [ ] **File 3**: `supabase/sql/003_storage_policies.sql`
  - Creates `access-files` storage bucket
  - Sets up upload/download policies
  - Allows service role access

### 1.2 Verify Tables Exist

Go to [Table Editor](https://supabase.com/dashboard/project/qexnxhojzciwdzlwttcd/editor)

You should see these tables:

- [ ] `projects`
- [ ] `import_jobs`
- [ ] `queries`
- [ ] `vba_modules`

### 1.3 Verify RLS is Enabled

For each table, click the table → "RLS Policies" button:

- [ ] `projects` has RLS enabled with 4 policies
- [ ] `import_jobs` has RLS enabled with 3 policies
- [ ] `queries` has RLS enabled with 2 policies
- [ ] `vba_modules` has RLS enabled with 2 policies

---

## ✅ Step 2: Storage Setup

### 2.1 Check Storage Bucket

Go to [Storage](https://supabase.com/dashboard/project/qexnxhojzciwdzlwttcd/storage/buckets)

- [ ] Bucket `access-files` exists
- [ ] Bucket is **private** (not public)
- [ ] Storage policies are set up (4 policies on `storage.objects`)

### 2.2 Verify Storage Policies

Click on `access-files` bucket → "Policies":

- [ ] "Authenticated users can upload files"
- [ ] "Authenticated users can read files"
- [ ] "Service role can access all files"
- [ ] "Authenticated users can delete files"

---

## ✅ Step 3: Authentication

### 3.1 Enable Email Provider

Go to [Authentication → Providers](https://supabase.com/dashboard/project/qexnxhojzciwdzlwttcd/auth/providers)

- [ ] **Email** provider is **enabled**
- [ ] (Optional) Disable email confirmation for testing
- [ ] (Optional) Enable Google/GitHub OAuth if desired

### 3.2 Test User Creation (Optional)

Go to [Authentication → Users](https://supabase.com/dashboard/project/qexnxhojzciwdzlwttcd/auth/users)

- [ ] Click "Add user" → Create a test user
- [ ] Verify user appears in the list

---

## ✅ Step 4: API Keys

### 4.1 Get Your Keys

Go to [Settings → API](https://supabase.com/dashboard/project/qexnxhojzciwdzlwttcd/settings/api)

Copy these values:

- [ ] **Project URL**: `https://qexnxhojzciwdzlwttcd.supabase.co`
- [ ] **anon/public key**: (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
- [ ] **service_role key**: (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`) ⚠️ **Keep secret!**

### 4.2 Database Connection String

Go to [Settings → Database](https://supabase.com/dashboard/project/qexnxhojzciwdzlwttcd/settings/database)

- [ ] Copy **Connection string** → **URI** (for worker .env)

---

## ✅ Step 5: Environment Variables

### 5.1 Frontend Environment File

Create `apps/web/.env`:

```env
VITE_SUPABASE_URL=https://qexnxhojzciwdzlwttcd.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

- [ ] File created
- [ ] URL is correct
- [ ] Anon key is correct (paste from Step 4.1)

### 5.2 Worker Environment File

Create `.env` in project root:

```env
DATABASE_URL=postgresql://postgres:KXBM?BaAopz?9BHt@db.qexnxhojzciwdzlwttcd.supabase.co:5432/postgres
SUPABASE_URL=https://qexnxhojzciwdzlwttcd.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
STORAGE_BUCKET=access-files
WORKER_POLL_MS=4000
```

- [ ] File created
- [ ] DATABASE_URL is correct (from Step 4.2)
- [ ] SUPABASE_URL is correct
- [ ] SUPABASE_SERVICE_ROLE_KEY is correct (from Step 4.1) ⚠️
- [ ] STORAGE_BUCKET is `access-files`

---

## ✅ Step 6: Automated Verification

### 6.1 Run Verification Script

```bash
# Install dependencies first
cd apps/web
npm install

# Run verification
cd ../..
node verify-supabase-setup.js
```

- [ ] Script runs without errors
- [ ] All checks show ✅ PASS

### 6.2 Manual Connection Test

Try connecting via the frontend:

```bash
cd apps/web
npm run dev
```

Visit http://localhost:5173

- [ ] Page loads without console errors
- [ ] No "Missing Supabase environment variables" error
- [ ] Login page displays correctly

---

## 🎯 Final Verification

### All Systems Check

- [ ] ✅ Database tables exist
- [ ] ✅ RLS policies are active
- [ ] ✅ Storage bucket configured
- [ ] ✅ Authentication enabled
- [ ] ✅ Frontend .env file created
- [ ] ✅ Worker .env file created
- [ ] ✅ Service role key obtained
- [ ] ✅ Automated verification passed

### Ready to Test?

If all items above are checked, you're ready to:

1. **Start Frontend**: `cd apps/web && npm run dev`
2. **Start Worker**: `cd apps/worker && dotnet run`
3. **Test Flow**: Sign up → Create project → Upload Access file

---

## 🐛 Troubleshooting

### "Table does not exist" error
→ Run `001_schema.sql` in SQL Editor

### "Storage bucket not found"
→ Run `003_storage_policies.sql` or create bucket manually

### "Missing environment variables"
→ Check `.env` files exist and have correct values

### "Authentication failed"
→ Verify Email provider is enabled in Auth settings

### Can't connect to database
→ Check if Supabase project is active (not paused)

---

## 📞 Need Help?

1. Check browser console (F12) for errors
2. Check Supabase logs: [Logs](https://supabase.com/dashboard/project/qexnxhojzciwdzlwttcd/logs/explorer)
3. Review SQL files for any errors when running
4. Ensure you're using the correct project ID: `qexnxhojzciwdzlwttcd`

---

**Last Updated**: October 16, 2025

