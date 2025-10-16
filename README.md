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
```bash
# 1. Frontend
cd apps/web
npm install
npm run dev  # http://localhost:5173

# 2. Worker (Windows)
cd apps/worker
dotnet run
```

### Configuration
Create environment files:
- `apps/web/.env` - Frontend configuration
- `.env` - Worker configuration

See [Setup Guide](doc/SETUP_GUIDE.md) for detailed instructions.

## Features

✅ User authentication  
✅ Multi-project management  
✅ Upload .accdb/.mdb files  
✅ Automatic metadata extraction  
✅ View SQL queries  
✅ View VBA modules  
✅ Filter by file  
✅ Real-time updates  

## Documentation

📚 **[Setup Guide](doc/SETUP_GUIDE.md)** - Step-by-step setup instructions  
📋 **[Implementation Details](doc/IMPLEMENTATION.md)** - Architecture and technical decisions  
🔍 **[Technical Review](doc/TECHNICAL_REVIEW.md)** - Technical validation and analysis  
📖 **[Original Specification](doc/Readme.md)** - Original project requirements  
📝 **[Review Summary](doc/REVIEW_SUMMARY.md)** - Implementation validation  

## Project Structure

```
/PCApps-MSAccessAI
  /apps
    /web              # React frontend
    /worker           # .NET worker
  /doc                # Documentation
  /supabase/sql       # Database schemas
```

## Support

- Frontend README: [apps/web/README.md](apps/web/README.md)
- Worker README: [apps/worker/README.md](apps/worker/README.md)

## License

MIT
