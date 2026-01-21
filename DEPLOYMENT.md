# Frontend Deployment Guide

## Vercel Setup

1. **New Project**: Import `Kira-Frontend` from GitHub.
2. **Framework Preset**: Vite (should be auto-detected).
3. **Build Command**: `vite build` (or `npm run build`)
4. **Output Directory**: `dist`
5. **Environment Variables**:
   - `VITE_API_URL`: `https://your-backend.onrender.com/api` (The full URL to your backend API, including `/api`)

## SPA Routing
- A `vercel.json` file has been added to handle SPA routing (redirects all requests to `index.html`).
