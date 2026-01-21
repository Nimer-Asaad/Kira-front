# Network Error Fix

## Issue
Users were seeing "Network Error" when trying to sign up in personal mode.

## Root Causes Identified

1. **Port Mismatch**: 
   - Backend runs on port 5000 (default)
   - Frontend `apiPaths.js` was defaulting to port 8000
   - Frontend `axiosInstance.js` was defaulting to port 5000
   - **Fixed**: Both now default to port 5000

2. **Poor Error Handling**:
   - Network errors weren't being detected properly
   - Generic error messages didn't help users debug
   - **Fixed**: Added specific network error detection and helpful messages

## Changes Made

### 1. `src/utils/axiosInstance.js`
- ✅ Fixed default port to match backend (5000)
- ✅ Added 30-second timeout
- ✅ Better error handling in interceptors

### 2. `src/utils/apiPaths.js`
- ✅ Fixed default port to 5000 (was 8000)

### 3. `src/pages/Auth/SignUp.jsx`
- ✅ Updated to use `API_PATHS.SIGNUP` instead of hardcoded path
- ✅ Added network error detection:
  - Detects timeout errors
  - Detects network connection errors
  - Shows helpful troubleshooting steps
- ✅ Error message now supports multi-line text
- ✅ Better error messages for debugging

## Error Messages Now Show

**Network Error:**
```
Network Error: Unable to connect to server.

Please check:
• Backend server is running (port 5000)
• CORS is configured correctly
• No firewall blocking the connection
```

**Timeout Error:**
```
Request timeout: Server is taking too long to respond. Please try again.
```

**Backend Error:**
Shows the actual error message from the backend API.

## Testing

1. **Backend Not Running:**
   - Should show network error with troubleshooting steps

2. **Backend Running on Wrong Port:**
   - Should show network error
   - Check `VITE_API_URL` environment variable

3. **CORS Issue:**
   - Should show network error
   - Check backend CORS configuration

4. **Valid Signup:**
   - Should work normally
   - Should navigate to `/personal/dashboard` for personal mode

## Environment Variables

Make sure `.env` file has:
```
VITE_API_URL=http://localhost:8000/api
```

Or set it when running:
```bash
VITE_API_URL=http://localhost:8000/api npm run dev
```

## Ports Configuration

- **Backend**: Port **8000** (as defined in `server.js`)
- **Frontend**: Port **5173** (as defined in `vite.config.js`)

If you change the backend port, update:
1. `VITE_API_URL` in frontend `.env`
2. Or update defaults in `axiosInstance.js` and `apiPaths.js`

