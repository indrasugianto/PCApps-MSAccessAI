# Worker Setup Instructions

## ✅ Supabase Setup Complete!

Your database and storage are ready. Now set up the worker.

---

## 📝 Step 1: Get Your Service Role Key

1. Go to: https://supabase.com/dashboard/project/qexnxhojzciwdzlwttcd/settings/api
2. Scroll down to **"Project API keys"**
3. Find **"service_role"** key (not the anon key!)
4. Click **"Reveal"** or the eye icon 👁️
5. Copy the key (it's a long JWT token starting with `eyJ...`)

⚠️ **IMPORTANT**: Keep this key secret! Never commit it to git.

---

## 📝 Step 2: Create Worker .env File

Create a file called `.env` in the **project root** directory:

**Location**: `C:\GitHub\PCApps-MSAccessAI\.env`

**Contents**:
```env
DATABASE_URL=postgresql://postgres:KXBM?BaAopz?9BHt@db.qexnxhojzciwdzlwttcd.supabase.co:5432/postgres
SUPABASE_URL=https://qexnxhojzciwdzlwttcd.supabase.co
SUPABASE_SERVICE_ROLE_KEY=PASTE_YOUR_SERVICE_ROLE_KEY_HERE
STORAGE_BUCKET=access-files
WORKER_POLL_MS=4000
```

**Replace** `PASTE_YOUR_SERVICE_ROLE_KEY_HERE` with the actual service role key from Step 1.

---

## 📝 Step 3: Worker Prerequisites (Windows Only)

The worker needs:

### Required:
- ✅ Windows OS
- ✅ .NET 8 SDK ([Download](https://dotnet.microsoft.com/download/dotnet/8.0))
- ✅ Microsoft Access or Access Runtime
  - **Access Runtime** (free): [Download](https://www.microsoft.com/en-us/download/details.aspx?id=54920)

### Enable VBA Trust:
1. Open Microsoft Access
2. File → Options
3. Trust Center → Trust Center Settings...
4. Macro Settings
5. ✅ Check **"Trust access to the VBA project object model"**
6. Click OK

---

## 🚀 Step 4: Start Testing

### Terminal 1 - Start Frontend:
```bash
cd apps/web
npm run dev
```

Open: http://localhost:5173

### Terminal 2 - Start Worker (Windows):
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

---

## 🧪 Step 5: Test End-to-End

1. **Sign Up**:
   - Go to http://localhost:5173
   - Click "Don't have an account? Sign Up"
   - Enter email and password
   - (If email confirmation is enabled, check your email)

2. **Create Project**:
   - Click "+ New Project"
   - Enter name: "Test Project"
   - Click "Create Project"

3. **Upload Access File**:
   - Click on your project
   - Click "Choose File"
   - Select a `.accdb` or `.mdb` file
   - Click "Upload File"

4. **Watch Processing**:
   - Worker console should show: "Found 1 pending job(s)"
   - Watch the extraction progress
   - See: "✓ Completed job ..."

5. **View Results**:
   - Frontend should auto-refresh
   - Click "Queries" tab → See extracted SQL
   - Click "VBA Modules" tab → See extracted VBA code

---

## ✅ Current Setup Status

- ✅ **Database**: All tables created
- ✅ **Storage**: Bucket created and secured
- ✅ **Authentication**: Email provider enabled
- ✅ **Frontend**: Environment configured
- ⏳ **Worker**: Needs .env file with SERVICE_ROLE_KEY

---

## 🐛 Troubleshooting

### Worker Issues:

**"ERROR: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"**
- Ensure `.env` file exists in project root
- Check the file has the correct key

**"Could not find DAO.DBEngine.120"**
- Install Microsoft Access Runtime (free)
- Link: https://www.microsoft.com/en-us/download/details.aspx?id=54920

**"VBE object is null"**
- Enable "Trust access to VBA project object model" in Access
- See Step 3 above

**Worker can't download files**
- Check SERVICE_ROLE_KEY is correct
- Verify storage bucket policies were applied

---

## 📞 Need Help?

1. Check browser console (F12) for errors
2. Check worker console output
3. Review Supabase logs in dashboard
4. Ensure all SQL files were run successfully

---

**You're almost there! Just need to add the SERVICE_ROLE_KEY and you can start testing!** 🎉

