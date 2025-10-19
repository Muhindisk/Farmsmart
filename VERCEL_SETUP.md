# Deploying FarmSmart to Vercel (Simple Setup)

## Issues That Were Preventing Deployment

1. ❌ **No vercel.json** - Vercel didn't know how to build your app
2. ❌ **Server not exporting for serverless** - Express server needs to export the app for Vercel
3. ❌ **Missing environment variables** - Need to be configured in Vercel dashboard
4. ❌ **No build configuration** - Vercel didn't know which folder contains what

## What I Fixed

### 1. Created `vercel.json`
This tells Vercel:
- Build the client from `client/` folder
- Output static files from `client/dist`
- Route `/api/*` requests to `server/index.js`

### 2. Updated `server/index.js`
- Added `export default app` for Vercel serverless compatibility
- Kept local development working with `app.listen()`

## Deployment Steps

### Step 1: Configure Environment Variables in Vercel

Go to your Vercel project dashboard → Settings → Environment Variables

Add these for **Production, Preview, and Development**:

```
GEMINI_API_KEY=your_gemini_api_key_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
VITE_API_BASE_URL=https://your-project-name.vercel.app
```

**Important Notes:**
- `VITE_API_BASE_URL` should be your actual Vercel URL (e.g., `https://farmsmart.vercel.app`)
- Don't include a trailing slash in `VITE_API_BASE_URL`
- Client variables MUST start with `VITE_` prefix

### Step 2: Update CORS in server/index.js

After you know your Vercel domain, update the allowed origins (around line 12-16):

```javascript
const allowedOrigins = [
  'https://YOUR-ACTUAL-VERCEL-DOMAIN.vercel.app',  // ← Replace this!
  'http://localhost:5173',
  'http://localhost:3000'
];
```

### Step 3: Deploy

Just push your code to GitHub:

```powershell
git add .
git commit -m "Configure for Vercel deployment"
git push
```

Vercel will automatically detect the changes and redeploy.

## How It Works

```
User Request
     │
     ├─→ /api/chat ──→ server/index.js (Serverless Function)
     │                      │
     │                      ├─→ Gemini API
     │                      └─→ Supabase DB
     │
     └─→ / or /assets/* ──→ Static files (client/dist/)
```

## Testing After Deployment

1. ✅ Visit `https://your-app.vercel.app` - Should show the form
2. ✅ Visit `https://your-app.vercel.app/api` - Should show `{"message":"FarmSmart API is running","status":"ok"}`
3. ✅ Fill out form and submit - Should get AI response
4. ✅ Check browser console - Should have NO CORS errors

## Common Issues & Solutions

### Issue: "Cannot GET /api/chat"
**Solution:** Make sure environment variables are set in Vercel dashboard, then redeploy.

### Issue: CORS errors
**Solution:** Update `allowedOrigins` in `server/index.js` with your actual Vercel domain.

### Issue: API returns 500 errors
**Solution:** 
- Check Vercel function logs in dashboard
- Verify all environment variables are set correctly
- Make sure `GEMINI_API_KEY` is valid

### Issue: Client can't reach API
**Solution:** 
- Verify `VITE_API_BASE_URL` environment variable is set
- Should be your full Vercel URL without trailing slash
- Redeploy after setting environment variables

## Local Development Still Works!

```powershell
# Terminal 1 - Server
cd server
npm install
node index.js

# Terminal 2 - Client
cd client
npm install
npm run dev
```

Make sure you have `.env` files in both folders for local development.

## Alternative: Deploy Client and Server Separately

If you prefer, you can:
1. **Deploy client to Vercel** - Just the `client/` folder as a static site
2. **Deploy server to Railway/Render/Fly.io** - As a traditional Node.js app

Let me know if you want instructions for this approach!
