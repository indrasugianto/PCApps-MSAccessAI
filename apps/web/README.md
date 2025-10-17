# Frontend - Access Metadata Explorer

React + Vite + TypeScript frontend application.

## Setup

1. Create `.env` file:

```env
VITE_SUPABASE_URL=https://qexnxhojzciwdzlwttcd.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

2. Install dependencies:

```bash
npm install
```

3. Run development server:

```bash
npm run dev
```

Open http://localhost:5173

## Features

- User authentication (sign up/sign in)
- Project management
- Upload Access database files (.accdb, .mdb)
- View extracted SQL queries
- View extracted VBA modules
- Filter by specific files
- Real-time status updates

## Build

```bash
npm run build
```

The built files will be in the `dist/` directory, ready to deploy to Vercel, Netlify, or Azure Static Web Apps.

## Tech Stack

- React 18
- TypeScript
- Vite
- Supabase JS SDK
- Tailwind CSS (if configured)
