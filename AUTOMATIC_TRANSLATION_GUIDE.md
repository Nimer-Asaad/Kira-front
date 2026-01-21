# Automatic Translation System - Implementation Guide

## Overview

The automatic translation system provides real-time translation of UI strings without requiring manual translation key creation. When a user switches to Arabic, any hardcoded English text automatically translates using the backend translation service.

**Key Benefits:**
- ✅ No manual translation keys needed
- ✅ Automatic translation on language change
- ✅ Persistent caching (localStorage + MongoDB)
- ✅ Batch processing for performance
- ✅ Smart skip logic (emails, IDs, numbers, dates)
- ✅ Graceful fallback to English on errors
- ✅ No API keys exposed to frontend

---

## Architecture

### Backend Components (Kira-Backend)

**1. Translation Model** (`models/Translation.js`)
- MongoDB schema for persistent translation cache
- Fields: key, originalText, translatedText, targetLanguage, provider, confidence, timestamps
- Indexes on (key + targetLanguage) and createdAt for fast lookups

**2. Translator Utility** (`utils/translator.js`)
- Core translation logic with dual-layer caching
- Memory cache (24-hour TTL) + MongoDB persistence
- OpenAI GPT-3.5-turbo integration
- Smart skip patterns for non-translatable content
- Functions:
  - `translateText(text, targetLang)` - Single text translation
  - `translateBatch(texts, targetLang)` - Batch translation
  - `shouldSkipTranslation(text)` - Pattern detection
  - `clearCaches()` - Admin utility

**3. Translation Controller** (`controllers/translateController.js`)
- HTTP endpoint handlers
- Accepts single or batch requests
- Error handling and validation

**4. Translation Routes** (`routes/translateRoutes.js`)
- Express router with 3 endpoints:
  - `POST /api/translate` - Single or batch translation
  - `GET /api/translate/stats` - Cache statistics
  - `DELETE /api/translate/cache` - Clear cache (admin)

### Frontend Components (Kira-Frontend)

**1. Translation Cache Utility** (`src/utils/translationCache.js`)
- localStorage management for client-side caching
- 30-day expiry for cached translations
- Quota management (auto-clears old entries if storage full)
- Functions:
  - `getCachedTranslation(text)` - Fetch from localStorage
  - `cacheTranslation(text, translated)` - Save to localStorage
  - `clearAllTranslations()` - Clear all cache

**2. useAutoTranslate Hook** (`src/hooks/useAutoTranslate.js`)
- Main hook for automatic translation
- Features:
  - `tr(text)` - Translate single text with Promise
  - `trBatch(texts)` - Translate array of texts
  - Batch debouncing (500ms delay)
  - Smart skipping of non-translatable content
  - Returns original text while loading/on error
  - Only translates when language = "ar"

**3. T Component** (`src/components/T.jsx`)
- React component wrapper for text translation
- Usage: `<T>Dashboard</T>`
- Features:
  - Automatic translation on mount and language change
  - Optional context parameter
  - Custom element support via `as` prop
  - Shows original text during loading
  - Skips non-translatable content

---

## API Endpoints

### POST /api/translate

**Single Translation**
```bash
curl -X POST http://localhost:3001/api/translate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Dashboard",
    "targetLang": "ar"
  }'
```

**Response:**
```json
{
  "original": "Dashboard",
  "translated": "لوحة التحكم",
  "cached": false
}
```

**Batch Translation**
```bash
curl -X POST http://localhost:3001/api/translate \
  -H "Content-Type: application/json" \
  -d '{
    "texts": ["Dashboard", "Settings", "Users"],
    "targetLang": "ar"
  }'
```

**Response:**
```json
{
  "translations": {
    "Dashboard": "لوحة التحكم",
    "Settings": "الإعدادات",
    "Users": "المستخدمون"
  }
}
```

### GET /api/translate/stats

Returns cache statistics:
```json
{
  "cachedTranslations": 1250
}
```

### DELETE /api/translate/cache

Clears all translation caches (admin only):
```json
{
  "message": "Caches cleared successfully"
}
```

---

## Usage Examples

### 1. Using the <T> Component (Recommended)

```jsx
import T from '@/components/T';

function Dashboard() {
  return (
    <div>
      <h1><T>Dashboard</T></h1>
      <p><T>Welcome to your dashboard</T></p>
      <button><T>Save Changes</T></button>
    </div>
  );
}
```

**With custom element:**
```jsx
<h2 as="h2" className="text-xl"><T>User Management</T></h2>
```

### 2. Using the useAutoTranslate Hook

```jsx
import { useAutoTranslate } from '@/hooks/useAutoTranslate';

function UserList() {
  const { tr, isLoading } = useAutoTranslate();
  const [translatedTitle, setTranslatedTitle] = useState('Users');

  useEffect(() => {
    tr('Users').then(setTranslatedTitle);
  }, [tr]);

  return (
    <div>
      <h1>{translatedTitle}</h1>
      {isLoading && <p>Translating...</p>}
    </div>
  );
}
```

**Batch translation:**
```jsx
const { trBatch, isLoading } = useAutoTranslate();

useEffect(() => {
  trBatch(['Dashboard', 'Settings', 'Users']).then((translations) => {
    console.log(translations);
    // {
    //   "Dashboard": "لوحة التحكم",
    //   "Settings": "الإعدادات",
    //   "Users": "المستخدمون"
    // }
  });
}, [trBatch]);
```

### 3. Mixed i18n + Auto-Translation

For critical UI elements, use pre-translated keys. For dynamic or new content, use auto-translation:

```jsx
import { useTranslation } from 'react-i18next';
import T from '@/components/T';

function Settings() {
  const { t } = useTranslation();

  return (
    <div>
      {/* Use i18n for critical navigation */}
      <h1>{t('sidebar.settings')}</h1>

      {/* Use auto-translation for new/dynamic content */}
      <section>
        <h2><T>Advanced Settings</T></h2>
        <p><T>Configure additional options below</T></p>
      </section>
    </div>
  );
}
```

---

## Configuration

### Backend Setup

**1. Add OPENAI_API_KEY to .env**
```bash
OPENAI_API_KEY=sk-your-actual-key-here
```

Get key from: https://platform.openai.com/account/api-keys

**2. Verify MongoDB Connection**
The system uses existing MongoDB for caching. Ensure your DB connection is working.

**3. Optional: Customize Translation Provider**
Edit `utils/translator.js` to use:
- Google Translate API
- DeepL API
- Azure Translator
- Other providers

Currently configured for OpenAI GPT-3.5-turbo.

### Frontend Configuration

**Environment Variables:**
```bash
# .env (Kira-Frontend)
VITE_API_URL=http://localhost:3001
```

This should match your backend URL.

---

## Caching Strategy

### Two-Layer Caching

**Layer 1: In-Memory Cache (Backend)**
- Ultra-fast lookups (~1ms)
- 24-hour TTL
- Cleared on server restart
- Limited by available RAM

**Layer 2: MongoDB Cache (Backend)**
- Persistent across restarts
- Indexed lookups (~50ms)
- 30-day document expiry (TTL index)
- Scales to millions of translations

**Layer 3: localStorage Cache (Frontend)**
- Client-side persistence
- 30-day expiry
- Immediate access
- Reduces server requests

### Cache Flow

```
UI Component (T.jsx)
    ↓
localStorage cache? → YES → Display translation
    ↓ NO
Backend /api/translate request
    ↓
In-memory cache? → YES → Return + Update client cache
    ↓ NO
MongoDB cache? → YES → Return + Update memory cache
    ↓ NO
OpenAI API → Translate → Cache all layers → Return
```

---

## Skip Patterns

The system automatically skips translation for:

- **Emails**: `user@example.com`
- **URLs**: `https://example.com`, `www.google.com`
- **UUIDs**: `550e8400-e29b-41d4-a716-446655440000`
- **MongoDB IDs**: `507f1f77bcf86cd799439011`
- **Phone Numbers**: `+1-555-123-4567`, `(555) 123-4567`
- **Dates**: `12/31/2023`, `2023-12-31`
- **Numbers**: `1000`, `3.14`, `50%`
- **Currency**: `$100`, `€50`, `£25`
- **File Paths**: `/path/to/file.pdf`
- **Existing Arabic**: Already Arabic text won't be re-translated

---

## Performance Optimization

### Batch Processing

Multiple translations are automatically batched:
- Max batch size: 20 texts
- Batch delay: 500ms
- Sends early if batch reaches capacity

```javascript
// These 3 requests are combined into 1 API call:
await tr('Dashboard');    // Queued
await tr('Settings');     // Queued
await tr('Users');        // Triggers batch request
```

### Request Debouncing

Prevents thundering herd of translation requests. Requests are collected and sent in batches.

### localStorage Quota Management

Automatically clears old translations when quota is exceeded:
```javascript
// If localStorage is full, oldest 100 translations are removed
cacheTranslation('new text', 'translated text'); // Auto-cleanup if needed
```

---

## Error Handling

### Graceful Degradation

If translation fails:
1. System logs warning
2. Original English text is returned
3. User continues with English until translation succeeds
4. No error page or broken UI

### Timeout Handling

- Individual translation requests: 5 seconds timeout
- Batch requests: 5 seconds timeout
- Falls back to original text if timeout exceeded

### Network Error Recovery

```javascript
try {
  const translated = await tr('Dashboard');
} catch (error) {
  // Falls back to 'Dashboard' automatically
  console.warn('Translation error:', error);
}
```

---

## Troubleshooting

### Translations Not Showing

**Check 1: Is language set to Arabic?**
```javascript
const { i18n } = useTranslation();
console.log(i18n.language); // Should be 'ar'
```

**Check 2: Is OPENAI_API_KEY configured?**
```bash
# In backend terminal
echo $OPENAI_API_KEY  # Should print your key (Windows: echo %OPENAI_API_KEY%)
```

**Check 3: Is backend running?**
```bash
curl http://localhost:3001/api/translate/stats
# Should return: { "cachedTranslations": N }
```

**Check 4: Browser console for errors**
- Open DevTools → Console
- Look for any red errors
- Check Network tab for 500 errors

### Slow Translations

**Solution 1: Clear frontend cache**
```javascript
// In browser console
localStorage.clear();
// Refresh page
```

**Solution 2: Clear backend cache**
```bash
curl -X DELETE http://localhost:3001/api/translate/cache
```

**Solution 3: Check API key rate limits**
- OpenAI limits: 3,500 RPM for free tier
- Upgrade at: https://platform.openai.com/account/billing/limits

### Text Not Being Translated

**Check if pattern is skipped:**
```javascript
import { shouldSkipTranslation } from '@/utils/translationCache';

shouldSkipTranslation('user@example.com'); // true - emails are skipped
shouldSkipTranslation('Dashboard');        // false - will translate
```

---

## Testing Checklist

- [ ] Set OPENAI_API_KEY in backend .env
- [ ] Restart backend server
- [ ] Test single translation: `curl -X POST http://localhost:3001/api/translate -d '{"text":"Hello"}'`
- [ ] Test batch translation: Multiple texts in one request
- [ ] Test language switching: English → Arabic → English
- [ ] Check localStorage: `localStorage` in DevTools → Application tab
- [ ] Check MongoDB: Translations collection has documents
- [ ] Test offline: Disconnect network after 1 translation, verify cached text displays
- [ ] Test skip logic: Verify emails/IDs/numbers don't translate
- [ ] Test error recovery: Turn off API key, verify graceful fallback
- [ ] Performance: Translate 100+ strings, verify no timeout
- [ ] Loading state: Verify "Translating..." shows briefly before translation appears
- [ ] Refresh page: Verify cached translations persist

---

## Files Overview

| File | Type | Purpose | Lines |
|------|------|---------|-------|
| `Kira-Backend/models/Translation.js` | Model | MongoDB cache schema | 40 |
| `Kira-Backend/utils/translator.js` | Utility | Core translation logic | 260 |
| `Kira-Backend/controllers/translateController.js` | Controller | API handlers | 95 |
| `Kira-Backend/routes/translateRoutes.js` | Routes | Express router | 20 |
| `Kira-Backend/server.js` | Modified | Added translate routes | +1 |
| `Kira-Frontend/src/utils/translationCache.js` | Utility | localStorage cache | 85 |
| `Kira-Frontend/src/hooks/useAutoTranslate.js` | Hook | Auto-translate hook | 240 |
| `Kira-Frontend/src/components/T.jsx` | Component | T wrapper component | 180 |

**Total Lines Added: ~915 lines**

---

## Next Steps

1. **Add OPENAI_API_KEY** to backend .env
2. **Test Backend API**: POST /api/translate with sample text
3. **Update Components**: Replace hardcoded strings with `<T>` wrapper
4. **Monitor Performance**: Track cache hit rates
5. **Gather User Feedback**: Improve skip patterns based on real usage

---

## Support

For issues or questions:
1. Check browser console for errors
2. Check backend logs for API errors
3. Verify OPENAI_API_KEY is set
4. Verify MongoDB connection is working
5. Check network requests in DevTools Network tab

