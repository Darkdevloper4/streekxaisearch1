# Streekx AI Search Engine - 502 Bad Gateway Debugging Guide

## What This Means
A 502 Bad Gateway error happens when the server that should process your request is unreachable or returning an error. In Streekx, this can happen at several points.

## Step-by-Step Debugging

### 1. Open Browser Console (F12 or Right-Click → Inspect)
Look at the **Console** tab for blue `[v0]` debug messages. These will tell you:
- What stage the search is at
- How many results were found
- Which APIs succeeded or failed

### 2. Check Which API Is Failing

The debug flow is:
```
[v0] DuckDuckGo search returned X results
  ↓
[v0] Wikipedia search returned Y results
  ↓
[v0] Total sources for synthesis: Z
  ↓
[v0] AI Generation Error: ... (if it fails here)
```

## Common Issues & Solutions

### Issue 1: "DuckDuckGo Search Timeout"
**Symptom:** Console shows `DuckDuckGo proxy timeout/failed, using fallback`

**Why:** The AllOrigins CORS proxy (`api.allorigins.win`) is slow or down

**Solutions:**
1. **Wait a moment and retry** - Sometimes the proxy just needs a moment
2. **Check your internet speed** - Use a speed test at speedtest.net
3. **Switch networks** - Try mobile hotspot if you're on WiFi, or vice versa
4. **Try a different device** - Rules out device-specific issues

### Issue 2: "Wikipedia API Failed"
**Symptom:** Console shows `Wikipedia search error: ...`

**Why:** Wikipedia's API might be temporarily unavailable or you have no internet

**Solutions:**
1. Check if `https://en.wikipedia.org` loads in a new tab
2. Wait a few seconds and retry your search
3. The system will fallback to using web results if Wikipedia fails

### Issue 3: "AI Generation Error" (502 from LLM)
**Symptom:** Console shows `AI Generation Error: 502` or `502 Bad Gateway`

**Why:** Either Groq or Google Gemini API is down or unreachable

**Solutions:**
1. **Check your API Key:**
   - Settings → View API Key
   - Groq keys start with `gsk_`
   - Gemini keys are longer alphanumeric strings
   - Make sure it's not empty or truncated

2. **Test the API directly:**
   - Groq: Visit https://console.groq.com/dashboard
   - Gemini: Visit https://aistudio.google.com

3. **Check service status:**
   - Groq status: Check their Discord or GitHub
   - Gemini status: Check Google Cloud status page

4. **Try a simpler query** - Long complex queries might fail

### Issue 4: "Empty response from proxy"
**Symptom:** Console shows `Empty response from proxy`

**Why:** The CORS proxy received a response but it was empty/malformed

**Solutions:**
1. Wait 5 seconds and try again
2. Try a different search query
3. The fallback results will still work

## What Should You See in Console?

A successful search should show:
```
[v0] DuckDuckGo search returned 3 results
[v0] Wikipedia search returned 2 results
[v0] Total sources for synthesis: 5
```

Then the AI will generate a response and stream it to the UI.

## Network Tab Analysis (Advanced)

1. Press F12 → Network tab
2. Perform a search
3. Look for these requests:
   - **api.allorigins.win** → CORS proxy for DuckDuckGo (should be 200 OK)
   - **en.wikipedia.org/w/api.php** → Wikipedia (should be 200 OK)
   - **generativelanguage.googleapis.com** OR **api.groq.com** → LLM API (should be 200 OK)

Any request showing **502** or **503** is the problematic one.

## Quick Fixes to Try (In Order)

1. **Hard refresh:** Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. **Wait 10 seconds** and retry
3. **Change your search query** - Try something simpler
4. **Clear browser cache** - Settings → Clear browsing data
5. **Restart your router** - Unplug for 10 seconds, plug back
6. **Try on a different device** - Phone, tablet, different computer
7. **Check API keys** - Settings → Verify Groq/Gemini keys are correct

## Still Having Issues?

Check the values in your Settings:
- Go to Settings icon (⚙️)
- Verify:
  - ✓ API Key is filled in
  - ✓ AI Language is set correctly
  - ✓ Search Mode works (try each: Standard, Pro, Research, Labs)

## Report the Exact Error

If none of this works, please share:
1. The exact error message from console
2. The full request URL from Network tab
3. Your search query that failed
4. What AI model you're using (Groq vs Gemini)
5. Your browser and OS
