# Gmail Integration - Frontend Quick Reference

**For:** React Frontend Developers  
**Backend Base URL:** `http://localhost:8000`  
**Last Updated:** December 19, 2025

## 📍 API Endpoints Reference

### OAuth Flow

```javascript
// 1. Start OAuth (redirect user)
window.location.href = `${API_BASE}/api/gmail/auth?token=${jwtToken}`;

// 2. Callback received at: /hr/inbox?gmail=connected
// Extract query param and show success message
```

### Main Endpoints

#### 1. Get Gmail Profile

```javascript
// GET /api/gmail/profile
const response = await axiosInstance.get('/api/gmail/profile');
// Returns: { email, name, picture, messagesTotal }
```

#### 2. Sync Emails (Paginated)

```javascript
// POST /api/gmail/sync-page
const response = await axiosInstance.post('/api/gmail/sync-page', {
  limit: 100,                    // Max: 100
  pageToken: null,               // null for first page, use nextPageToken for next
  labelIds: ['INBOX'],           // Can use: SENT, DRAFT, UNREAD, STARRED, etc.
  q: 'from:someone@gmail.com',   // Gmail search query (optional)
  scope: 'inbox'                 // Scope for tracking sync state
});

// Returns:
// {
//   message: "Page synced",
//   synced: 42,                  // Emails added to DB
//   skipped: 5,                  // Duplicates
//   total: 50,                   // Total in this page
//   nextPageToken: "xyz123"      // Repeat with this if not null
// }
```

**Frontend Loop:**
```javascript
let pageToken = null;
let allSynced = 0;
let allSkipped = 0;

while (true) {
  const result = await syncPage(pageToken);
  allSynced += result.synced;
  allSkipped += result.skipped;
  
  if (!result.nextPageToken) break;  // No more pages
  pageToken = result.nextPageToken;
}

console.log(`Synced: ${allSynced}, Skipped: ${allSkipped}`);
```

#### 3. Search Local Emails

```javascript
// GET /api/gmail/local/search?keyword=CV&limit=20
const response = await axiosInstance.get('/api/gmail/local/search', {
  params: {
    keyword: 'Python developer',        // Search in subject/body/snippet
    from: 'sender@gmail.com',          // Filter by sender (regex)
    hasAttachments: 'true',            // Has attachments
    startDate: '2025-01-01',           // Date range start
    endDate: '2025-12-31',             // Date range end
    tag: 'CV',                         // Custom tag ('CV', 'Invoice', etc.)
    labelIds: 'INBOX,STARRED',         // Gmail labels (comma-separated)
    limit: 20                          // Results limit (max 100)
  }
});

// Returns:
// {
//   emails: [
//     {
//       _id: "...",
//       subject: "CV - John Doe",
//       fromEmail: "john@example.com",
//       fromName: "John Doe",
//       snippet: "Experienced Python developer...",
//       date: "2025-12-19T10:30:00Z",
//       isUnread: true,
//       isStarred: false,
//       hasAttachments: true,
//       gmailPriority: 75,
//       gmailCategory: "Primary",
//       gmailImportance: "high",
//       tags: ["CV"],
//       isCV: true,
//       aiSummary: null  // null if not yet summarized
//     },
//     ...
//   ],
//   count: 150  // Total matching emails (not all returned)
// }
```

**Smart Sorting Applied:**
1. Priority score (highest first)
2. Importance level (high > normal > low)
3. Date (most recent first)

#### 4. Get Sync State

```javascript
// GET /api/gmail/sync/state?scope=inbox
const response = await axiosInstance.get('/api/gmail/sync/state', {
  params: { scope: 'inbox' }
});

// Returns:
// {
//   userId: "...",
//   scope: "inbox",
//   lastPageToken: "xyz123",
//   totalSynced: 1234,
//   totalSkipped: 56,
//   pagesProcessed: 13,
//   messagesTotal: null
// }
```

#### 5. Reset Sync State

```javascript
// POST /api/gmail/sync/reset
const response = await axiosInstance.post('/api/gmail/sync/reset', {
  labelIds: ['INBOX'],
  scope: 'inbox'
});

// Returns: { message: "Sync state reset", deletedOldEmails: 123, ... }
```

#### 6. Filter CVs

```javascript
// POST /api/gmail/filter-cvs
const response = await axiosInstance.post('/api/gmail/filter-cvs', {
  requirements: 'Python, JavaScript, React, MongoDB',
  keywords: ['CV', 'Resume', 'Application'],
  limit: 50
});

// Returns:
// [
//   {
//     id: "gmail_id",
//     from: "candidate@example.com",
//     subject: "CV - Jane Smith",
//     snippet: "...",
//     candidateName: "Jane Smith",
//     score: 85,        // Percentage match
//     decision: "Shortlist",
//     gmailLink: "https://mail.google.com/..."
//   },
//   ...
// ]
```

## 🛠️ Integration Examples

### Example 1: Sync Button with Progress

```jsx
const [syncing, setSyncing] = useState(false);
const [syncProgress, setSyncProgress] = useState(null);

const handleSync = async () => {
  setSyncing(true);
  setSyncProgress('Starting sync...');
  
  try {
    let pageToken = null;
    let totalSynced = 0;
    let totalSkipped = 0;

    while (true) {
      setSyncProgress(`Fetching page ${Math.floor(totalSynced / 100) + 1}...`);
      
      const result = await axiosInstance.post('/api/gmail/sync-page', {
        limit: 100,
        pageToken,
        labelIds: ['INBOX'],
        scope: 'inbox'
      });

      totalSynced += result.synced;
      totalSkipped += result.skipped;

      if (!result.nextPageToken) break;
      pageToken = result.nextPageToken;
    }

    setSyncProgress(`✅ Done! Synced: ${totalSynced}, Skipped: ${totalSkipped}`);
    // Refresh email list
    await fetchEmails();
  } catch (err) {
    setSyncProgress(`❌ Error: ${err.response?.data?.message || err.message}`);
  } finally {
    setSyncing(false);
  }
};

return (
  <div>
    <button onClick={handleSync} disabled={syncing}>
      {syncing ? 'Syncing...' : 'Sync Emails'}
    </button>
    {syncProgress && <p className="text-sm text-gray-600">{syncProgress}</p>}
  </div>
);
```

### Example 2: Search with Filters

```jsx
const [filters, setFilters] = useState({
  keyword: '',
  from: '',
  hasAttachments: false,
  limit: 20
});

const handleSearch = async () => {
  const params = {};
  if (filters.keyword) params.keyword = filters.keyword;
  if (filters.from) params.from = filters.from;
  if (filters.hasAttachments) params.hasAttachments = 'true';
  params.limit = filters.limit;

  const response = await axiosInstance.get('/api/gmail/local/search', { params });
  setEmails(response.data.emails);
};

return (
  <div className="space-y-4">
    <input
      type="text"
      placeholder="Search emails..."
      value={filters.keyword}
      onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
    />
    <input
      type="email"
      placeholder="From sender..."
      value={filters.from}
      onChange={(e) => setFilters({ ...filters, from: e.target.value })}
    />
    <label>
      <input
        type="checkbox"
        checked={filters.hasAttachments}
        onChange={(e) => setFilters({ ...filters, hasAttachments: e.target.checked })}
      />
      Has Attachments
    </label>
    <button onClick={handleSearch}>Search</button>
  </div>
);
```

### Example 3: Email List with Smart Sorting

```jsx
const EmailList = ({ emails }) => {
  // Emails already sorted by priority from backend
  return (
    <div className="space-y-2">
      {emails.map((email) => (
        <div
          key={email._id}
          className="p-4 border border-gray-200 rounded-lg hover:shadow-md cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className={`font-medium ${email.isUnread ? 'text-gray-900' : 'text-gray-600'}`}>
                {email.subject}
              </h3>
              <p className="text-sm text-gray-600">{email.fromName || email.fromEmail}</p>
              <p className="text-xs text-gray-500 mt-1">{email.snippet}</p>
            </div>
            <div className="flex items-center gap-2 ml-4">
              {email.gmailImportance === 'high' && (
                <span className="text-red-600 font-bold text-lg">⚡</span>
              )}
              {email.isStarred && <span className="text-yellow-500">⭐</span>}
              {email.hasAttachments && <span className="text-gray-600">📎</span>}
            </div>
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <div>Priority: {email.gmailPriority}</div>
            <div>{new Date(email.date).toLocaleDateString()}</div>
          </div>
        </div>
      ))}
    </div>
  );
};
```

## 🔍 Email Object Structure

```javascript
{
  _id: "61a7f3c4e1234567890abcde",
  userId: "61a7f3c4e1234567890xxxxx",
  gmailId: "1892c1a5e9c9d2d1",
  gmailMessageId: "1892c1a5e9c9d2d1",
  threadId: "1892c1a5e9c9d2d1",
  
  // Sender & Recipients
  fromEmail: "john@example.com",
  fromName: "John Doe",
  to: ["hr@kira.com"],
  cc: ["manager@kira.com"],
  bcc: [],
  
  // Content
  subject: "Application - Senior Developer",
  snippet: "Hi, I'm interested in the Senior Developer...",
  bodyText: "Full email body in plain text...",
  bodyHtml: "<html>Full email body in HTML...</html>",
  
  // Metadata
  date: "2025-12-19T10:30:00Z",
  internalDate: 1703066400000,
  labels: ["INBOX", "IMPORTANT"],
  
  // Gmail Smart Sort
  gmailPriority: 85,
  gmailCategory: "Primary",
  gmailImportance: "high",
  isStarred: true,
  isImportant: true,
  isUnread: false,
  
  // Attachments
  hasAttachments: true,
  attachments: [
    {
      filename: "John_Doe_CV.pdf",
      mimeType: "application/pdf",
      size: 245123,
      attachmentId: "ANGjdJ8kQ9...",
      extractedText: "Optional extracted text from PDF..."
    }
  ],
  
  // CV Data
  isCV: true,
  tags: ["CV", "Senior"],
  cvData: null, // Or { candidateName, skills, score, etc. }
  
  // AI Summary (if generated)
  aiSummary: {
    summary: "Experienced developer with 5+ years...",
    key_points: ["Python expert", "React proficiency", "Team lead"],
    action_items: ["Schedule interview", "Check references"],
    urgency: "high",
    suggested_stage: "interview",
    generatedAt: "2025-12-19T11:00:00Z"
  },
  
  // Timestamps
  createdAt: "2025-12-19T10:35:00Z",
  updatedAt: "2025-12-19T11:00:00Z"
}
```

## 🚨 Error Handling

### 401 - Gmail Tokens Expired

```javascript
if (error.response?.status === 401) {
  // Show reconnect button
  showModal('Gmail connection expired. Please reconnect.');
  // User clicks button → redirect to /api/gmail/auth
}
```

### 400 - Missing Required Fields

```javascript
if (error.response?.status === 400) {
  const message = error.response.data.message;
  // Show validation error
}
```

### 500 - Server Error

```javascript
if (error.response?.status === 500) {
  const message = error.response.data.message;
  // Show friendly error: "Failed to sync emails"
}
```

## 📋 Gmail Labels Reference

Common label IDs:
- `INBOX` - Inbox emails
- `SENT` - Sent emails
- `DRAFT` - Drafts
- `UNREAD` - Unread emails
- `STARRED` - Starred emails
- `IMPORTANT` - Gmail Important emails
- `CATEGORY_SOCIAL` - Social category
- `CATEGORY_PROMOTIONS` - Promotions category
- `CATEGORY_UPDATES` - Updates category
- `CATEGORY_FORUMS` - Forums category

## 🎯 Common Use Cases

### Use Case 1: Sync on Page Load

```javascript
useEffect(() => {
  const syncIfNeeded = async () => {
    const state = await axiosInstance.get('/api/gmail/sync/state?scope=inbox');
    if (state.data.totalSynced === 0) {
      // First sync
      await syncAllEmails();
    }
  };
  syncIfNeeded();
}, []);
```

### Use Case 2: Find CV Emails

```javascript
const findCVEmails = async () => {
  const response = await axiosInstance.get('/api/gmail/local/search?tag=CV&limit=50');
  return response.data.emails.filter(e => e.isCV);
};
```

### Use Case 3: High Priority Emails

```javascript
const getHighPriorityEmails = async () => {
  const response = await axiosInstance.get('/api/gmail/local/search?limit=100');
  return response.data.emails
    .filter(e => e.gmailImportance === 'high' || e.gmailPriority > 80);
};
```

## ⚙️ Configuration

Update `src/utils/apiPaths.js` if needed:

```javascript
export default {
  // ... existing paths
  
  // Gmail endpoints
  GMAIL_AUTH: '/api/gmail/auth',
  GMAIL_OAUTH_CALLBACK: '/api/gmail/oauth2/callback',
  GMAIL_PROFILE: '/api/gmail/profile',
  GMAIL_SYNC_PAGE: '/api/gmail/sync-page',
  GMAIL_LOCAL_SEARCH: '/api/gmail/local/search',
  GMAIL_SYNC_STATE: '/api/gmail/sync/state',
  GMAIL_SYNC_RESET: '/api/gmail/sync/reset',
  GMAIL_FILTER_CVS: '/api/gmail/filter-cvs'
};
```

---

**Need Help?** Check `GMAIL_INTEGRATION.md` in the backend folder for complete technical documentation.
