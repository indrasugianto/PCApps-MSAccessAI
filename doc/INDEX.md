# Documentation Index

Complete documentation for the Access Metadata Explorer project.

## Getting Started

### 🚀 [Setup Guide](SETUP_GUIDE.md)
**Start here!** Step-by-step instructions to get the application running.
- Database setup
- Environment configuration
- Running frontend and worker
- Testing end-to-end

### 📖 [Original Specification](Readme.md)
The original project specification and requirements.
- Architecture overview
- Database schema
- Multi-file support
- API endpoints (optional)

## Technical Documentation

### 📋 [Implementation Details](IMPLEMENTATION.md)
Comprehensive implementation documentation.
- What was built
- Architecture decisions
- Component breakdown
- Testing checklist
- Deployment guide
- Known limitations
- Future enhancements

### 🔍 [Technical Review](TECHNICAL_REVIEW.md)
Technical validation and analysis.
- Architecture validation
- Security review
- Database design review
- Critical issues and fixes
- Implementation checklist

### 📝 [Review Summary](REVIEW_SUMMARY.md)
Quick summary of technical review findings.
- What was fixed
- Validation results
- Success factors
- No blockers found

## Component Documentation

### Frontend (React)
Location: `apps/web/README.md`
- Setup instructions
- Features
- Build process

### Worker (.NET)
Location: `apps/worker/README.md`
- Prerequisites
- How it works
- Deployment options
- Troubleshooting

## Database

Location: `supabase/sql/`

**Schemas (apply in order):**
1. `001_schema.sql` - Tables and indexes
2. `002_policies.sql` - Row-level security
3. `003_storage_policies.sql` - Storage bucket policies

**Tables:**
- `projects` - User projects
- `import_jobs` - Upload tracking
- `queries` - Extracted SQL queries
- `vba_modules` - Extracted VBA code

## Architecture

```
┌─────────────────┐
│  React Frontend │  Port 5173
│   (Vite + TS)   │  - Auth, Projects, Upload
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│      Supabase Cloud         │
│  ┌─────────┐  ┌──────────┐ │
│  │ Postgres│  │  Storage │ │
│  │  + Auth │  │  Bucket  │ │
│  └────┬────┘  └─────┬────┘ │
└───────┼────────────┼───────┘
        │            │
   ┌────▼────────────▼────┐
   │  Windows Worker      │  Polls every 4s
   │  (.NET 8 + COM)      │  DAO + VBIDE
   └─────────────────────┘
```

## Key Features

### Authentication
- Email/password sign up and login
- Supabase Auth integration
- Row-level security for data isolation

### Project Management
- Create multiple projects
- Organize files by project
- View all metadata per project

### File Upload
- Upload .accdb and .mdb files
- Store in Supabase Storage (private bucket)
- Automatic job creation for worker

### Metadata Extraction
- DAO-based query extraction
- VBIDE-based VBA module extraction
- SHA256 hashing for deduplication
- Error handling and status reporting

### Viewing & Analysis
- View all queries with SQL syntax
- View all VBA modules with code
- Filter by specific files
- Real-time status updates

## Development Workflow

1. **Frontend Development**
   ```bash
   cd apps/web
   npm run dev
   ```

2. **Worker Development** (Windows)
   ```bash
   cd apps/worker
   dotnet run
   ```

3. **Database Changes**
   - Edit SQL files in `supabase/sql/`
   - Apply via Supabase dashboard SQL editor

## Deployment

### Frontend
```bash
cd apps/web
npm run build
# Deploy dist/ to Vercel, Netlify, etc.
```

### Worker
```bash
cd apps/worker
dotnet publish -c Release -r win-x64 --self-contained
# Install as Windows Service using NSSM
```

## Troubleshooting

Common issues and solutions are documented in:
- [Setup Guide - Troubleshooting Section](SETUP_GUIDE.md#troubleshooting)
- [Worker README - Troubleshooting](../apps/worker/README.md#troubleshooting)

## Quick Links

- **Supabase Dashboard**: https://supabase.com/dashboard/project/qexnxhojzciwdzlwttcd
- **Frontend**: http://localhost:5173 (development)
- **Worker**: Console application (no web interface)

## Credits

**Project**: PCApps-MSAccessAI  
**Architecture**: Full-stack with Supabase backend  
**License**: MIT

