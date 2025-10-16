# 🚀 Start Testing - Quick Guide

## ✅ Supabase Setup: COMPLETE!

All database tables, storage, and security policies are configured and working.

---

## 📝 To Start Testing (2 Simple Steps)

### Step 1: Get Service Role Key (30 seconds)

1. Open: https://supabase.com/dashboard/project/qexnxhojzciwdzlwttcd/settings/api
2. Find **"service_role"** key
3. Click reveal/copy

### Step 2: Create `.env` File (30 seconds)

Create a file called `.env` in this folder (`C:\GitHub\PCApps-MSAccessAI\`):

```env
DATABASE_URL=postgresql://postgres:KXBM?BaAopz?9BHt@db.qexnxhojzciwdzlwttcd.supabase.co:5432/postgres
SUPABASE_URL=https://qexnxhojzciwdzlwttcd.supabase.co
SUPABASE_SERVICE_ROLE_KEY=PASTE_YOUR_KEY_HERE
STORAGE_BUCKET=access-files
WORKER_POLL_MS=4000
```

Replace `PASTE_YOUR_KEY_HERE` with the key from Step 1.

---

## 🎮 Run the Application

### Terminal 1 - Frontend:
```bash
cd apps/web
npm run dev
```
Then open: http://localhost:5173

### Terminal 2 - Worker (Windows):
```bash
cd apps/worker
dotnet run
```

---

## 🧪 Test It

1. **Sign up** at http://localhost:5173
2. **Create a project**
3. **Upload an Access file** (.accdb or .mdb)
4. **Watch the magic** - worker extracts queries and VBA!

---

## 📚 More Info

- Full worker setup: `WORKER_SETUP.md`
- Verification details: `TESTING_READY.md`
- Complete guide: `doc/SETUP_GUIDE.md`

---

**You're ready to test! Just need the SERVICE_ROLE_KEY!** 🎉

