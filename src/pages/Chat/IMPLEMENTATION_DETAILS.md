# Code Changes Detail - Chat Flicker Fix

## File: src/pages/Chat/UserInfoModal.jsx (NEW)

This is a new component extracted from ChatPage with memoization and skeleton loader.

**Key Features:**
- Uses `React.memo()` with custom comparator
- Only re-renders when user._id changes
- Includes skeleton loader for smooth loading state
- Prevents modal content flicker

**Component Structure:**
```
UserInfoModal (memoized)
├── UserInfoSkeleton (loading state)
└── Modal Content
    ├── Header with close button
    ├── Profile section (avatar, name, role)
    ├── Contact info (email, phone)
    └── Action buttons
```

---

## File: src/pages/Chat/ChatPage.jsx (MODIFIED)

### Change 1: Imports
**Added memoization hooks:**
```javascript
// BEFORE
import { useState, useEffect, useRef } from "react";

// AFTER
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import UserInfoModal from "./UserInfoModal";
```

### Change 2: State Management Refactor
**Lines ~10-23 (Original lines 12-23)**

**BEFORE:**
```javascript
const [conversations, setConversations] = useState([]);
const [availableUsers, setAvailableUsers] = useState([]);
const [selectedUser, setSelectedUser] = useState(null);  // ← Full object
const [messages, setMessages] = useState([]);
const [newMessage, setNewMessage] = useState("");
const [loading, setLoading] = useState(true);
const [sending, setSending] = useState(false);
const [searchQuery, setSearchQuery] = useState("");
const [showMobileConversation, setShowMobileConversation] = useState(false);
const [showUserInfo, setShowUserInfo] = useState(false);
const messagesEndRef = useRef(null);
```

**AFTER:**
```javascript
const [conversations, setConversations] = useState([]);
const [availableUsers, setAvailableUsers] = useState([]);
const [selectedUserId, setSelectedUserId] = useState(null);  // ← ID only
const [selectedUserData, setSelectedUserData] = useState(null);  // ← Data only
const [messages, setMessages] = useState([]);
const [newMessage, setNewMessage] = useState("");
const [loading, setLoading] = useState(true);
const [sending, setSending] = useState(false);
const [searchQuery, setSearchQuery] = useState("");
const [showMobileConversation, setShowMobileConversation] = useState(false);
const [showUserInfo, setShowUserInfo] = useState(false);
const [userInfoDebounce, setUserInfoDebounce] = useState(null);  // ← Debounce timer
const messagesEndRef = useRef(null);

// Memoize selectedUser to prevent unnecessary re-renders
const selectedUser = useMemo(() => selectedUserData, 
  [selectedUserData?._id, selectedUserData?.userModel]);
```

### Change 3: Polling Effect Addition
**Lines ~46-56 (NEW)**

**Added effect for polling:**
```javascript
// Poll for new messages when conversation is selected
useEffect(() => {
  if (selectedUserId) {  // Uses ID, not full object
    fetchConversation();
    const interval = setInterval(fetchConversation, 2000);
    return () => clearInterval(interval);
  }
}, [selectedUserId]);  // Only depends on ID change
```

### Change 4: Debounce Modal Open
**Lines ~59-76 (NEW)**

**Added debouncing function:**
```javascript
// Add debouncing for opening user info modal
const openUserInfoModal = useCallback(() => {
  // Clear any existing timeout
  if (userInfoDebounce) {
    clearTimeout(userInfoDebounce);
  }
  
  // Set new timeout with 150ms debounce
  const timeout = setTimeout(() => {
    setShowUserInfo(true);
  }, 150);
  
  setUserInfoDebounce(timeout);
}, [userInfoDebounce]);

// Cleanup debounce on unmount
useEffect(() => {
  return () => {
    if (userInfoDebounce) {
      clearTimeout(userInfoDebounce);
    }
  };
}, [userInfoDebounce]);
```

### Change 5: Updated handleSelectUser
**Lines ~104-117 (REFACTORED)**

**BEFORE:**
```javascript
const handleSelectUser = (selectedUserData) => {
  const normalized = {
    ...selectedUserData,
    userModel:
      selectedUserData.userModel ||
      (selectedUserData.role === "admin" ? "Admin" : "User"),
  };
  setSelectedUser(normalized);  // ← Direct update
  setMessages([]);
  setShowMobileConversation(true);
  // Mark messages as read
  markConversationAsRead(normalized._id);
};
```

**AFTER:**
```javascript
const handleSelectUser = useCallback((selectedUserDataParam) => {
  const normalized = {
    ...selectedUserDataParam,
    userModel:
      selectedUserDataParam.userModel ||
      (selectedUserDataParam.role === "admin" ? "Admin" : "User"),
  };
  setSelectedUserId(normalized._id);  // ← Separate ID update
  setSelectedUserData(normalized);    // ← Separate data update
  setMessages([]);
  setShowMobileConversation(true);
  setShowUserInfo(false);  // ← Close modal on new user
  
  // Mark messages as read
  markConversationAsRead(normalized._id);
}, []);
```

### Change 6: Updated handleBackToList
**Lines ~119-123 (REFACTORED)**

**BEFORE:**
```javascript
const handleBackToList = () => {
  setShowMobileConversation(false);
  setSelectedUser(null);  // ← Single update
};
```

**AFTER:**
```javascript
const handleBackToList = useCallback(() => {
  setShowMobileConversation(false);
  setSelectedUserId(null);    // ← Separate updates
  setSelectedUserData(null);  // ← Prevents stale data
}, []);
```

### Change 7: Removed Inline UserInfoModal
**Lines ~220-310 (DELETED)**

**Removed the entire inline component definition:**
- ~90 lines of modal JSX removed
- Now imported from UserInfoModal.jsx
- Improves code organization and testability

### Change 8: Updated Button References
**Three button click handlers updated:**

**1. Avatar button (Line ~387):**
```javascript
// BEFORE
onClick={() => setShowUserInfo(true)}

// AFTER
onClick={openUserInfoModal}
```

**2. Name/role area (Line ~404):**
```javascript
// BEFORE
onClick={() => setShowUserInfo(true)}

// AFTER
onClick={openUserInfoModal}
```

**3. Info button (Line ~415):**
```javascript
// BEFORE
onClick={() => setShowUserInfo(true)}

// AFTER
onClick={openUserInfoModal}
```

---

## Performance Implications

### Before Implementation
```
User clicks avatar
  → onClick={() => setShowUserInfo(true)}
    → State update
      → Parent re-render
        → Entire modal re-renders
          → Inline component recreated
            → Children re-render
              → Visual flicker
```

### After Implementation
```
User clicks avatar
  → onClick={openUserInfoModal}
    → Debounce timer (150ms)
      → setShowUserInfo(true)
        → Modal component (memoized)
          → Only re-renders if selectedUser._id changes
            → Skeleton loader prevents flash
              → Smooth UX
```

---

## Dependencies Graph

### Before
```
ChatPage
├── state: selectedUser (full object)
├── polling: useEffect([selectedUser])
├── modal: inline component
└── flicker: ✗ (object recreated on each render)
```

### After
```
ChatPage (optimized)
├── state: selectedUserId (primitive)
├── state: selectedUserData (object)
├── memoized: selectedUser (useMemo)
├── callback: openUserInfoModal (useCallback + debounce)
├── polling: useEffect([selectedUserId])
├── modal: UserInfoModal (memoized component)
└── result: ✓ (no flicker, optimized renders)
```

---

## Testing Scenarios

### Scenario 1: Open Modal
1. Click user avatar/name/info button
2. **Expected:** Modal opens smoothly with skeleton loader
3. **Verify:** No visual flicker, content appears after skeleton

### Scenario 2: Switch Users
1. Open modal for User A
2. Close modal
3. Select User B
4. Open modal again
5. **Expected:** Modal shows User B's data, no flicker
6. **Verify:** Data changes cleanly without flash

### Scenario 3: Rapid Open/Close
1. Click info button multiple times rapidly
2. **Expected:** Modal opens once after 150ms debounce
3. **Verify:** Debounce prevents flickering from rapid state changes

### Scenario 4: Memory Cleanup
1. Open and close modal several times
2. Switch conversations
3. Unmount component
4. **Expected:** No memory leaks, timeouts properly cleaned
5. **Verify:** Console shows no warnings, memory stable

---

## Backward Compatibility

✅ All changes are internal optimizations
✅ External API unchanged (same props/events)
✅ No breaking changes to other components
✅ Existing chat functionality preserved
