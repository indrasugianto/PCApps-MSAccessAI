# Access Metadata Explorer

A full-stack application to upload MS Access databases (.mdb/.accdb), extract SQL queries and VBA modules, and analyze them through a modern web interface.

## Overview

- **Frontend**: React + Vite + TypeScript
- **Backend**: Supabase (Postgres + Storage + Auth)
- **Worker**: .NET 8 Windows service (DAO + VBIDE COM automation)

## Quick Start

### Prerequisites
- **Frontend**: Node.js 18+
- **Worker**: Windows OS, .NET 8 SDK, Microsoft Access/Access Runtime

### Setup

1. **Configure Supabase** (see [Setup Guide](doc/SETUP_GUIDE.md))
   - Run SQL schemas in `supabase/sql/` (001, 002, 003)
   - Enable email authentication
   - Get service role key

2. **Configure Environment Files**
   
   `apps/web/.env`:
   ```env
   VITE_SUPABASE_URL=https://qexnxhojzciwdzlwttcd.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```
   
   `.env` (root, for worker):
   ```env
   DATABASE_URL=postgresql://postgres:KXBM?BaAopz?9BHt@db.qexnxhojzciwdzlwttcd.supabase.co:5432/postgres
   SUPABASE_URL=https://qexnxhojzciwdzlwttcd.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   STORAGE_BUCKET=access-files
   WORKER_POLL_MS=4000
   ```

3. **Run Applications**
   ```bash
   # Frontend
   cd apps/web
   npm install
   npm run dev  # http://localhost:5173
   
   # Worker (Windows)
   cd apps/worker
   dotnet run
   ```

## Features

- User authentication
- Multi-project management
- Upload .accdb/.mdb files
- Automatic metadata extraction
- View SQL queries and VBA modules
- Filter by file
- Real-time updates

## Documentation

- **[Setup Guide](doc/SETUP_GUIDE.md)** - Detailed setup instructions
- **[Implementation](doc/IMPLEMENTATION.md)** - Architecture and technical details
- **[Technical Review](doc/TECHNICAL_REVIEW.md)** - Technical validation
- **[Original Spec](doc/Readme.md)** - Original project requirements

## Project Structure

```
/PCApps-MSAccessAI
  /apps
    /web              # React frontend
    /worker           # .NET worker
  /doc                # Documentation
  /supabase/sql       # Database schemas
```

## License

MIT
