# Gmail Integration Frontend Checklist

**Status:** Backend ✅ Complete | Frontend 🟡 Partial (50%)

## ✅ Already Completed (Frontend)

- [x] `Inbox.jsx` - Main page with Gmail status check
- [x] `EmailList.jsx` - Email list display with badges
- [x] `EmailDetailsModal.jsx` - Modal showing email + AI summary button
- [x] `HrSidebar.jsx` - Added "Inbox" navigation link
- [x] `App.jsx` - Added `/hr/inbox` route
- [x] `apiPaths.js` - Added 5 Gmail API paths

## ⏳ TODO: Update Frontend for New Backend Endpoints

### Task 1: Update apiPaths.js

**File:** `src/utils/apiPaths.js`

Add these new endpoint paths:

```javascript
// Comprehensive Gmail endpoints (new)
GMAIL_AUTH: (token) => `/api/gmail/auth?token=${token}`,
GMAIL_PROFILE: '/api/gmail/profile',
GMAIL_SYNC_PAGE: '/api/gmail/sync-page',
GMAIL_LOCAL_SEARCH: '/api/gmail/local/search',
GMAIL_SYNC_STATE: '/api/gmail/sync/state',
GMAIL_SYNC_RESET: '/api/gmail/sync/reset',
GMAIL_FILTER_CVS: '/api/gmail/filter-cvs',

// Old endpoints (can keep for backward compatibility)
HR_GMAIL_STATUS: '/api/hr/gmail/status',
HR_GMAIL_SYNC: '/api/hr/gmail/sync',
HR_GMAIL_EMAILS: '/api/hr/gmail/emails',
HR_GMAIL_EMAIL_BY_ID: (id) => `/api/hr/gmail/emails/${id}`,
HR_GMAIL_EMAIL_AI_SUMMARY: (id) => `/api/hr/gmail/emails/${id}/ai`,
```

### Task 2: Update Inbox.jsx

**File:** `src/pages/HR/Inbox.jsx`

Replace the sync logic:

**Current:**
```javascript
const handleSync = async () => {
  setSyncing(true);
  setError(null);
  try {
    const response = await axiosInstance.post(API_PATHS.HR_GMAIL_SYNC);
    // ...
  }
};
```

**New (with pagination):**
```javascript
const handleSync = async () => {
  setSyncing(true);
  setError(null);
  try {
    let pageToken = null;
    let allSynced = 0;
    let allSkipped = 0;
    let pageCount = 0;

    while (true) {
      const response = await axiosInstance.post(API_PATHS.GMAIL_SYNC_PAGE, {
        limit: 100,
        pageToken,
        labelIds: label === 'ALL' ? undefined : [label],
        scope: label === 'ALL' ? 'all' : label.toLowerCase(),
      });

      allSynced += response.data.synced;
      allSkipped += response.data.skipped;
      pageCount++;

      console.log(`Synced page ${pageCount}: ${response.data.synced} emails`);

      if (!response.data.nextPageToken) break;
      pageToken = response.data.nextPageToken;
    }

    setError(null);
    // Refresh email list after sync
    setPage(1);
    await fetchEmails();
  } catch (err) {
    if (err.response?.status === 503) {
      setStatusError('Gmail is not configured. Please connect your account.');
    } else {
      setError(err.response?.data?.message || 'Failed to sync emails');
    }
  } finally {
    setSyncing(false);
  }
};
```

Replace the fetch logic:

**Current:**
```javascript
const fetchEmails = async () => {
  setLoading(true);
  try {
    const response = await axiosInstance.get(API_PATHS.HR_GMAIL_EMAILS, {
      params: {
        label,
        q: searchQuery,
        page,
        limit: 20,
      },
    });
    setEmails(response.data.emails);
  }
  // ...
};
```

**New:**
```javascript
const fetchEmails = async () => {
  setLoading(true);
  try {
    const params = {
      limit: 20,
    };

    if (searchQuery) params.keyword = searchQuery;
    if (label !== 'ALL') params.labelIds = label;

    const response = await axiosInstance.get(API_PATHS.GMAIL_LOCAL_SEARCH, {
      params,
    });

    setEmails(response.data.emails);
  } catch (err) {
    if (err.response?.status === 503) {
      setStatusError('Gmail is not configured. Please connect your account.');
    } else {
      setError(err.response?.data?.message || 'Failed to fetch emails');
    }
  } finally {
    setLoading(false);
  }
};
```

### Task 3: Update EmailDetailsModal.jsx

**File:** `src/components/HR/EmailDetailsModal.jsx`

Update the AI summary button to use new endpoint:

**Current:**
```javascript
const handleGenerateSummary = async () => {
  setLoadingSummary(true);
  setSummaryError(null);
  try {
    const response = await axiosInstance.post(
      API_PATHS.HR_GMAIL_EMAIL_AI_SUMMARY(email._id)
    );
    // ...
  }
};
```

**New (no changes needed):**
```javascript
// The endpoint structure is the same
// Keep the current implementation as-is
const handleGenerateSummary = async () => {
  setLoadingSummary(true);
  setSummaryError(null);
  try {
    const response = await axiosInstance.post(
      API_PATHS.HR_GMAIL_EMAIL_AI_SUMMARY(email._id)
    );
    setAiSummary(response.data.aiSummary);
    onUpdate({ ...email, aiSummary: response.data.aiSummary });
  } catch (err) {
    if (err.response?.status === 503) {
      setSummaryError('OpenAI is not configured on the server.');
    } else if (err.response?.status === 400) {
      setSummaryError('Email body is empty; cannot summarize.');
    } else {
      setSummaryError('Failed to generate summary');
    }
  } finally {
    setLoadingSummary(false);
  }
};
```

### Task 4: Add Connect Gmail Button (Optional)

**File:** `src/pages/HR/Inbox.jsx`

Add OAuth button if user hasn't connected:

```javascript
const handleConnectGmail = async () => {
  try {
    const { user } = useAuth();
    // Get JWT token
    const token = localStorage.getItem('token');
    
    // Redirect to OAuth
    window.location.href = `${process.env.REACT_APP_API_BASE || 'http://localhost:8000'}/api/gmail/auth?token=${token}`;
  } catch (err) {
    setError('Failed to start Gmail connection');
  }
};

// In render, if statusError:
{statusError && (
  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
    <p className="text-sm text-yellow-700">
      <strong>Gmail Not Connected:</strong> {statusError}
    </p>
    <button
      onClick={handleConnectGmail}
      className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
    >
      Connect Gmail Now
    </button>
  </div>
)}
```

### Task 5: Add Label Filter Dropdown (Optional)

**File:** `src/pages/HR/Inbox.jsx`

Update the label filter options:

```javascript
const labelOptions = [
  { value: 'ALL', label: 'All Labels' },
  { value: 'INBOX', label: 'Inbox' },
  { value: 'SENT', label: 'Sent' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'UNREAD', label: 'Unread' },
  { value: 'STARRED', label: 'Starred' },
  { value: 'CATEGORY_SOCIAL', label: 'Social' },
  { value: 'CATEGORY_PROMOTIONS', label: 'Promotions' },
];

// In render:
<select
  value={label}
  onChange={(e) => {
    setLabel(e.target.value);
    setPage(1);
    fetchEmails();
  }}
  className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
>
  {labelOptions.map((opt) => (
    <option key={opt.value} value={opt.value}>
      {opt.label}
    </option>
  ))}
</select>
```

### Task 6: Update Search Filter Logic

**File:** `src/pages/HR/Inbox.jsx`

Current search only sends `q`, but new backend supports `keyword`:

```javascript
// Current
const handleSearch = (query) => {
  setSearchQuery(query);
  setPage(1);
  fetchEmails();
};

// This already works fine - keyword param will be used
```

### Task 7: Add Filter UI (Optional)

**File:** `src/components/HR/EmailFilters.jsx` (new component)

```jsx
export default function EmailFilters({ filters, onChange }) {
  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          From Email
        </label>
        <input
          type="email"
          placeholder="sender@example.com"
          value={filters.from || ''}
          onChange={(e) => onChange({ ...filters, from: e.target.value })}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Date Range
        </label>
        <div className="flex gap-2">
          <input
            type="date"
            value={filters.startDate || ''}
            onChange={(e) => onChange({ ...filters, startDate: e.target.value })}
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
          <input
            type="date"
            value={filters.endDate || ''}
            onChange={(e) => onChange({ ...filters, endDate: e.target.value })}
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
        </div>
      </div>

      <label className="flex items-center">
        <input
          type="checkbox"
          checked={filters.hasAttachments || false}
          onChange={(e) => onChange({ ...filters, hasAttachments: e.target.checked })}
          className="rounded"
        />
        <span className="ml-2 text-sm text-gray-700">Has Attachments</span>
      </label>
    </div>
  );
}
```

## 🧪 Testing Checklist

After implementing updates:

- [ ] User can click "Sync Emails" button
- [ ] Sync shows progress (fetching page 1, 2, etc.)
- [ ] After sync, email list shows emails
- [ ] Can search for emails by keyword
- [ ] Can filter by label (Inbox, Sent, etc.)
- [ ] Can click email card to open modal
- [ ] Modal shows full email content
- [ ] Can click "Summarize" button in modal
- [ ] AI summary generates and displays
- [ ] Can close modal and see email list again
- [ ] Pagination works (if implementing)
- [ ] Error messages display properly
- [ ] 503 error shows friendly message

## 📝 Implementation Priority

### Phase 1 (Must Have)
- [ ] Update apiPaths.js with new endpoints
- [ ] Update Inbox.jsx fetchEmails() logic
- [ ] Update Inbox.jsx handleSync() logic

### Phase 2 (Nice to Have)
- [ ] Add Connect Gmail button
- [ ] Add label filter dropdown
- [ ] Add advanced filters component

### Phase 3 (Future)
- [ ] Pagination UI
- [ ] Real-time sync status
- [ ] Email threading
- [ ] Bulk operations (archive, delete)

## 🔗 Related Files

- Backend: `/api/gmail/*` endpoints
- Frontend: `src/pages/HR/Inbox.jsx`
- Frontend: `src/components/HR/EmailList.jsx`
- Frontend: `src/components/HR/EmailDetailsModal.jsx`
- Frontend: `src/utils/apiPaths.js`

## 📚 Documentation

- Backend: `INTEGRATION_SUMMARY.md`
- Frontend: `GMAIL_API_REFERENCE.md` (this folder)

## ✨ Key Differences: Old vs New Backend

| Feature | Old (`/api/hr/gmail/*`) | New (`/api/gmail/*`) |
|---------|---------|---------|
| Sync | Single call, limited | Paginated, unlimited |
| Search | Query email list | Local MongoDB search |
| Filters | None | 6+ filters |
| Smart Sorting | By date | By priority system |
| CV Detection | Manual | Automatic |
| Attachment Data | None | Full metadata |
| Errors | Generic | User-friendly |

---

**Start with Phase 1 to get the new endpoints working!** 🚀
