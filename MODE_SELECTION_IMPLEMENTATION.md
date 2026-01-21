# Mode Selection Landing Page Implementation

## Overview
Added a new landing page that allows users to choose between Company and Personal modes before authentication. The implementation includes full English/Arabic support, dark mode integration, and seamless navigation flow.

## Files Created

### 1. `src/context/ModeContext.jsx`
- **Purpose**: Global state management for app mode (company/personal)
- **Features**:
  - Stores mode in localStorage (`kira_mode`)
  - Provides `mode`, `setMode`, `isCompany`, `isPersonal` helpers
  - Auto-syncs with localStorage

### 2. `src/pages/Landing/ChooseMode.jsx`
- **Purpose**: Landing page for mode selection
- **Features**:
  - Two-column layout matching existing auth design
  - Left: Branding + title + description + preview mock card
  - Right: Two mode selection cards (Company/Personal)
  - Language toggle (EN/AR) in top-right
  - Dark mode toggle in top-right
  - Auto-redirect if mode exists in localStorage
  - Keyboard accessibility (Enter/Space to select)
  - Hover animations with glow effects
  - Full English/Arabic translations

## Files Modified

### 1. `src/App.jsx`
- Added `ModeProvider` wrapper
- Added routes:
  - `/` → `ChooseMode` component
  - `/choose-mode` → `ChooseMode` component
- Removed old root redirect to `/login`

### 2. `src/pages/Auth/login.jsx`
- **Changes**:
  - Reads mode from query params (`?mode=company`) or localStorage
  - Updates heading dynamically based on mode:
    - Company: "Welcome Back — Company Workspace"
    - Personal: "Welcome Back — Personal Workspace"
  - Shows mode badge next to title
  - Updates subtitle text based on mode
  - Adds "Back to mode selection" link
  - Full English/Arabic support
  - Passes mode to signup link

### 3. `src/pages/Auth/SignUp.jsx`
- **Changes**:
  - Reads mode from query params or localStorage
  - Updates heading dynamically:
    - Company: "Create Account — Company Workspace"
    - Personal: "Create Account — Personal Workspace"
  - Shows mode badge next to title
  - Updates subtitle text
  - Adds "Back to mode selection" link
  - Full English/Arabic support
  - Passes mode to login link

## UI/UX Features

### Landing Page (`ChooseMode`)
- **Layout**: Two-column responsive design
  - Left: Dark slate background with branding
  - Right: Blue/purple gradient with mode cards
- **Mode Cards**:
  - Hover effects: scale, glow border, shadow
  - Icon + title + description
  - Keyboard accessible
  - Smooth transitions
- **Controls**:
  - Language toggle (top-right)
  - Dark mode toggle (top-right)
- **Preview Card**: Mock card on left side showing app preview

### Login/Signup Pages
- **Dynamic Headings**: Change based on selected mode
- **Mode Badge**: Small badge showing current mode
- **Back Link**: Link to return to mode selection
- **Consistent Design**: Matches existing auth pages

## Translations

### English
- **Landing Title**: "Choose your workspace"
- **Landing Subtitle**: "Kira works for teams and for personal productivity. Select how you want to use it."
- **Company Card**: 
  - Title: "Company"
  - Description: "HR inbox, team task distribution, roles, reports & dashboards."
- **Personal Card**:
  - Title: "Personal"
  - Description: "My tasks, calendar, daily planning, progress charts & weekly report."

### Arabic
- **Landing Title**: "اختار مساحة العمل"
- **Landing Subtitle**: "Kira مناسب للشركات وللاستخدام الشخصي. اختار كيف بدك تستخدمه."
- **Company Card**:
  - Title: "شركة"
  - Description: "صندوق HR، توزيع مهام للفريق، صلاحيات، تقارير ولوحات تحكم."
- **Personal Card**:
  - Title: "شخصي"
  - Description: "مهامي، التقويم، تنظيم اليوم، مخططات إنجاز وتقرير أسبوعي."

## Navigation Flow

1. **User visits `/`** → Sees `ChooseMode` page
2. **User selects mode** → Navigates to `/login?mode=company` or `/login?mode=personal`
3. **Mode saved** → Stored in localStorage and context
4. **Auto-redirect** → If mode exists, landing page auto-redirects to login
5. **Login/Signup** → Shows mode-specific text and badge
6. **Back link** → Returns to mode selection

## Technical Details

### Mode Storage
- **localStorage key**: `kira_mode`
- **Values**: `"company"` or `"personal"`
- **Context**: Available via `useMode()` hook

### Query Parameters
- Login: `/login?mode=company`
- Signup: `/signup?mode=personal`
- Mode is read from query param first, then localStorage

### Integration Points
- Uses existing `ThemeContext` for language and dark mode
- Uses existing `AuthLayout` for consistent design
- No breaking changes to existing auth flow

## Testing Checklist

- [ ] Visit `/` - should show mode selection page
- [ ] Click Company card - should navigate to `/login?mode=company`
- [ ] Click Personal card - should navigate to `/login?mode=personal`
- [ ] Login page shows correct heading based on mode
- [ ] Signup page shows correct heading based on mode
- [ ] Mode badge appears on login/signup pages
- [ ] "Back to mode selection" link works
- [ ] Language toggle works (EN/AR)
- [ ] Dark mode toggle works
- [ ] Mode persists after page reload
- [ ] Auto-redirect works if mode exists
- [ ] Keyboard navigation works (Enter/Space)
- [ ] Hover effects work on mode cards
- [ ] All text displays correctly in both languages

## Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Responsive design (mobile, tablet, desktop)
- Keyboard accessibility
- Screen reader friendly

## Future Enhancements (Optional)
- Add mode-specific onboarding flows
- Store mode preference per user account
- Add mode switching after login
- Add analytics for mode selection

