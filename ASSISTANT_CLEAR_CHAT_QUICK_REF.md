# Assistant Clear Chat - Quick Reference

## What Was Implemented

✅ **Clear chat action** - Manual button to clear conversation
✅ **Default: Auto-clear on refresh** - History disabled by default  
✅ **Optional history toggle** - Users can enable persistent history
✅ **Header UI controls** - Two new buttons in assistant header

## Key Files Modified

### 1. `src/context/AssistantContext.jsx`
- Added `enableHistory` state
- Added `toggleHistory` callback
- Exported both from provider

### 2. `src/components/assistant/AssistantDrawer.jsx`
- Updated messages initialization to check `enableHistory`
- Updated localStorage save logic
- Added `handleClearChat` function
- Added two header buttons: History toggle + Clear chat
- Imported lucide icons (Trash2, History)

## Default Behavior

| Action | Behavior |
|--------|----------|
| Open assistant | Messages: empty |
| Chat with AI | Messages displayed |
| Refresh page | Messages **cleared** (default) |
| User manually clears | Messages deleted + confirmation |
| Toggle history ON | Messages now saved |
| Refresh page (history ON) | Messages **restored** |

## UI Controls (Header)

**History Toggle Button** (Calendar icon)
- Bright/highlighted = History enabled
- Dim/grayed = History disabled
- Click to toggle
- Saves preference instantly

**Clear Chat Button** (Trash icon)
- Always visible
- Shows confirmation before clearing
- Works regardless of history setting
- Clears localStorage if history enabled

## Usage Examples

### User Enables History
```
1. Click calendar icon in header
2. Icon becomes bright
3. Chat messages now persist
4. Refresh page = history restored
```

### User Manually Clears Chat
```
1. Click trash icon
2. Confirm: "Clear chat history?"
3. All messages deleted
4. Conversation reset
5. Can start fresh chat
```

### User Disables History
```
1. Click calendar icon (currently bright)
2. Icon becomes dim
3. Next refresh = chat cleared
4. Going forward: no auto-save
```

## Technical Details

**localStorage Keys:**
- `kira_assistant_history_enabled`: Controls persistence
- `kira_assistant_conversation`: Stores messages (only if enabled)

**Default State:**
```javascript
enableHistory = false // History DISABLED by default
```

**On Mount:**
```javascript
if (enableHistory) {
  // Load messages from localStorage
} else {
  // Start with empty array (clear on refresh)
}
```

**On Save:**
```javascript
if (enableHistory) {
  localStorage.setItem(...)  // Save messages
} else {
  // Don't save (RAM only)
}
```

## Acceptance Criteria

✅ Refresh clears assistant chat by default
✅ User can optionally enable history
✅ No crashes in other chat modules
✅ Manual clear action available

## Testing

**Test 1: Default Clear Behavior**
1. Open assistant
2. Send message
3. Refresh page
4. Expected: Chat cleared

**Test 2: Enable History**
1. Click history toggle
2. Send message  
3. Refresh page
4. Expected: Message persisted

**Test 3: Manual Clear**
1. Send messages
2. Click trash icon
3. Confirm
4. Expected: All cleared

**Test 4: No Crashes**
1. Open/close multiple times
2. Toggle history on/off
3. Clear chat
4. Expected: No console errors

## Files to Know

- **AssistantContext**: Manages enableHistory state + toggleHistory function
- **AssistantDrawer**: UI component where users interact
- **localStorage keys**: Stored in browser's local storage, survives reload

## Quick Troubleshooting

| Issue | Fix |
|-------|-----|
| History not saving | Check if toggle is bright (enabled) |
| Chat clears on refresh | This is default - toggle history ON to keep |
| Can't clear chat | Try clicking trash icon, confirm dialog |
| Buttons not showing | Check AssistantDrawer header section |
| localStorage full | Browser memory issue, try clearing cache |

## Code Snippets for Reference

**Using the context:**
```javascript
const { enableHistory, toggleHistory } = useAssistant();
```

**Clear chat:**
```javascript
handleClearChat() // Defined in AssistantDrawer
```

**Toggle history:**
```javascript
toggleHistory() // Toggles and saves to localStorage
```

## Next Steps

If user requests:
- **Search history** → Query messages array
- **Export chat** → JSON.stringify(messages)
- **Archive conversations** → Add timestamps and archive logic
- **Cloud sync** → Add API endpoint for backup
