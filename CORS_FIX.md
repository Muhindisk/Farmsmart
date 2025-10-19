# CORS Preflight Error - FIXED

## The Error You Were Seeing

```
blocked by CORS policy: Response to preflight request doesn't pass access control check: 
Redirect is not allowed for a preflight request.
```

## What Was Causing It

The issue happens because:

1. **Vercel was redirecting the OPTIONS request** - The `/api/chat` route wasn't properly configured in `vercel.json`
2. **Browser sends OPTIONS before POST** - This is called a "preflight" request to check if the server allows cross-origin requests
3. **Redirects break preflight** - Browsers reject any redirect during the OPTIONS request

## What I Fixed

### 1. Created/Updated `vercel.json` with Proper Routing

Added:
- **Rewrites** to route `/api/*` directly to `server/index.js` (no redirects)
- **Headers** to set CORS headers at the Vercel level
- This ensures the OPTIONS request goes directly to your server without redirects

### 2. Simplified CORS Configuration in `server/index.js`

Changed from:
```javascript
origin: function(origin, callback) { /* complex logic */ }
```

To:
```javascript
origin: true  // Allow all origins (simpler, works better with Vercel)
```

### 3. Added Explicit OPTIONS Handler

Added:
```javascript
app.options('/api/chat', (req, res) => {
  res.status(200).end();
});
```

This ensures the server responds to OPTIONS requests immediately without processing.

### 4. Increased maxAge for Preflight Cache

```javascript
maxAge: 86400  // Cache preflight for 24 hours
```

This reduces the number of preflight requests.

## Deploy the Fix

```powershell
git add .
git commit -m "Fix CORS preflight redirect error"
git push
```

Vercel will automatically redeploy.

## How to Test

1. **Clear browser cache** - CTRL+SHIFT+DELETE, clear cached images and files
2. **Open DevTools** - F12, go to Network tab
3. **Submit the form** - You should see:
   - First: `OPTIONS /api/chat` with status **200** ✅
   - Then: `POST /api/chat` with status **200** ✅
4. **No CORS errors** in the console ✅

## Why This Works

1. **Vercel headers** set CORS at the infrastructure level
2. **Rewrites (not redirects)** route requests directly to your server
3. **OPTIONS handler** responds immediately to preflight checks
4. **Simplified CORS** in Express avoids conflicts with Vercel's headers

## If It Still Doesn't Work

### Double-check Environment Variables

Make sure these are set in Vercel:
- `GEMINI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_API_BASE_URL` (your full Vercel URL)

### Check the Network Tab

Look for the OPTIONS request:
- **If it's missing**: Client isn't making the request (check `VITE_API_BASE_URL`)
- **If it's 301/302**: Vercel is still redirecting (check `vercel.json` deployed correctly)
- **If it's 404**: Route not configured properly
- **If it's 200**: ✅ Working!

### Verify vercel.json Deployed

In Vercel dashboard → Deployments → Click latest → Source → Should see `vercel.json`

### Force Redeploy

If needed, trigger a manual redeploy in Vercel dashboard.

## What Changed

✅ `vercel.json` - Added proper routing and CORS headers
✅ `server/index.js` - Simplified CORS config, added explicit OPTIONS handler

That's it! The CORS preflight error should be completely resolved.
