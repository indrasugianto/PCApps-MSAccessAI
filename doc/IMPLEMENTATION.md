# Implementation Guide

Technical implementation details for the Access Metadata Explorer.

## Architecture Overview

```
┌─────────────────┐
│  React Frontend │  Port 5173
│   (Vite + TS)   │  - Authentication
└────────┬────────┘  - Project Management
         │           - File Upload
         ▼
┌─────────────────────────────┐
│      Supabase Cloud         │
│  ┌─────────┐  ┌──────────┐ │
│  │ Postgres│  │  Storage │ │  - RLS Policies
│  │  + Auth │  │  Bucket  │ │  - Storage Policies
│  └────┬────┘  └─────┬────┘ │
└───────┼────────────┼───────┘
        │            │
   ┌────▼────────────▼────┐
   │  Windows Worker      │  Polls every 4s
   │  (.NET 8 + COM)      │  - DAO Query Extract
   └─────────────────────┘  - VBIDE VBA Extract
```

## Components

### Frontend (React + Vite + TypeScript)

**Location**: `apps/web/`

**Components**:
- `Auth.tsx` - Sign up/sign in with Supabase Auth
- `ProjectList.tsx` - Project management
- `ProjectView.tsx` - File upload and metadata display
- `FileUpload.tsx` - File upload to Supabase Storage

**Key Features**:
- Direct Supabase client integration (no API layer needed)
- Real-time status polling (3-second interval)
- File filtering by filename
- Responsive UI

**Dependencies**:
- `@supabase/supabase-js` - Supabase client
- `react`, `react-dom` - UI framework
- `vite` - Build tool

### Worker (.NET 8 Console App)

**Location**: `apps/worker/`

**Files**:
- `Program.cs` - Entry point and polling loop
- `MetadataWorker.cs` - Core extraction logic

**Key Features**:
- Automatic job polling (4-second interval)
- File download from Supabase Storage
- DAO-based query extraction
- VBIDE-based VBA module extraction
- SHA256 hashing for deduplication
- Direct Postgres insertion

**Dependencies**:
- `Supabase` - Supabase .NET client
- `Npgsql` - PostgreSQL driver
- `DotNetEnv` - Environment variables

**COM Interop**:
- `DAO.DBEngine.120` - Query extraction
- `Access.Application` - VBA access

### Database Schema

**Location**: `supabase/sql/`

**Tables**:
1. `projects` - User projects
2. `import_jobs` - File upload tracking
3. `queries` - Extracted SQL queries
4. `vba_modules` - Extracted VBA code

**Security**:
- Row-Level Security (RLS) on all tables
- User data isolation via RLS policies
- Storage bucket policies for authenticated uploads
- Service role bypass for worker

## Key Design Decisions

### 1. No API Layer
- Frontend communicates directly with Supabase
- Simplifies architecture
- Leverages Supabase RLS for security
- Can add API later for business logic if needed

### 2. Service Role for Worker
- Worker uses `service_role` key to bypass RLS
- Allows direct insertion into all tables
- Appropriate for trusted server-side process

### 3. Denormalized Filenames
- `access_filename` stored in queries and vba_modules tables
- Enables fast filtering by file
- Simplifies multi-file comparison

### 4. Hash-based Deduplication
- SHA256 hashes for SQL and VBA code
- Enables duplicate detection across files
- Stored but not enforced (allows flexibility)

### 5. COM Automation
- DAO for query extraction (reliable, fast)
- VBIDE for VBA extraction (requires trust setting)
- Proper COM cleanup to prevent memory leaks

## Data Flow

1. User authenticates via Supabase Auth
2. User creates project
3. User uploads .accdb file to Supabase Storage
4. Frontend creates `import_job` record (status: pending)
5. Worker polls and finds pending job
6. Worker downloads file from Storage
7. Worker extracts metadata using DAO/VBIDE
8. Worker inserts data into Postgres
9. Worker updates job status to completed
10. Frontend polls and displays results

## Testing Checklist

- [ ] User can sign up and sign in
- [ ] User can create projects
- [ ] User can upload .accdb files
- [ ] Worker downloads file from storage
- [ ] Worker extracts queries successfully
- [ ] Worker extracts VBA modules successfully
- [ ] Frontend displays extracted queries
- [ ] Frontend displays extracted modules
- [ ] File filtering works correctly
- [ ] Multiple files in same project work
- [ ] Error handling displays properly

## Deployment Checklist

### Frontend
- [ ] Build production bundle: `npm run build`
- [ ] Deploy to Vercel/Netlify/Azure Static Web Apps
- [ ] Set environment variables in hosting platform
- [ ] Test authentication flow

### Worker
- [ ] Publish self-contained: `dotnet publish -c Release -r win-x64 --self-contained`
- [ ] Copy to Windows VM
- [ ] Install Access Runtime on VM
- [ ] Enable VBA trust in Access
- [ ] Create `.env` file with production credentials
- [ ] Install as Windows Service (use NSSM)
- [ ] Configure service to start automatically

### Database
- [x] Apply 001_schema.sql
- [x] Apply 002_policies.sql
- [x] Apply 003_storage_policies.sql
- [ ] Verify RLS is enabled
- [ ] Set up database backups

## Known Limitations

1. **Windows-only Worker**: COM automation requires Windows
2. **Access Installation Required**: Worker needs Access Runtime
3. **VBA Trust Setting**: Manual configuration required
4. **No File Size Limits**: Consider adding validation
5. **No Progress Indication**: Worker processing is opaque to user

## Future Enhancements

- File size validation (reject files over 50MB)
- Progress websockets for real-time updates
- Duplicate file detection
- Query syntax highlighting
- VBA code analysis
- Export features (CSV/JSON)
- Side-by-side file comparison
- Full-text search

## Performance Considerations

- Worker polling interval: 4 seconds (configurable)
- Frontend polling interval: 3 seconds
- Database indexes on frequently queried columns
- Denormalized data for faster queries
- Proper COM object disposal to prevent leaks

## Security Considerations

- RLS policies enforce user data isolation
- Service role key kept secret (server-side only)
- Storage bucket is private (not public)
- Frontend uses limited anon key
- No SQL injection risk (parameterized queries)

## Monitoring

Recommended monitoring:
- Worker process health
- Job processing time
- Database query performance
- Storage bucket usage
- Error rates

## Support

For issues:
1. Check browser console (F12) for frontend errors
2. Check worker console output
3. Review Supabase logs in dashboard
4. Verify all SQL scripts ran successfully
