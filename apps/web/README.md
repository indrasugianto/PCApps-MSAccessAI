# Access Metadata Explorer - Frontend

React + Vite + TypeScript frontend for the Access Metadata Explorer.

## Setup

1. Create a `.env` file with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://qexnxhojzciwdzlwttcd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFleG54aG9qemNpd2R6bHd0dGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MDY1NTEsImV4cCI6MjA3NjE4MjU1MX0.Gx3GZzC0bIc8WIBYQvt_da6wC2T0gDGzVVemhhNqDXw
```

2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

The app will be available at http://localhost:5173

## Features

- User authentication (sign up/sign in)
- Project management (create, view projects)
- Upload Access database files (.accdb, .mdb)
- View extracted SQL queries
- View extracted VBA modules
- Filter by specific files
- Real-time status updates

## Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory, ready to deploy to Vercel, Netlify, or any static hosting service.
