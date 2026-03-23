# Claude Code Transcript — Session 03C

**Date:** 2026-03-22
**Project:** StudyStats (React + Vite + Firebase Auth + Firestore)
**Phase:** Phase 3 Debugging & Hardening
**Tools:** Claude Code (VS Code Extension), Vitest, React Testing Library

---

## Task 1: Fix Firebase `auth/invalid-api-key` Error on Netlify

**User:**
Read PROJECT-STATUS.md, ARCHITECTURE.md, and README.md to understand the current state of this project before making any suggestions or changes.
My Study Planner: React + Vite + Firebase Auth + Firestore, deployed to Netlify.
This error occurred after Firestore auth setup and deployment to Netlify. It works locally but not on Netlify. How do I fix this issue?

```
index-Bg1JA-5b.js:11 Uncaught FirebaseError: Firebase: Error (auth/invalid-api-key).
    at jh (index-Bg1JA-5b.js:11:51995)
    at dt (index-Bg1JA-5b.js:11:52044)
    at rr.instanceFactory (index-Bg1JA-5b.js:11:125696)
    at LE.getOrInitializeService (index-Bg1JA-5b.js:11:35812)
    at LE.initialize (index-Bg1JA-5b.js:11:35199)
    at Ab (index-Bg1JA-5b.js:11:90042)
    at nA (index-Bg1JA-5b.js:11:126681)
    at index-Bg1JA-5b.js:20:9191
```

**Claude:**
Read `PROJECT-STATUS.md`, `ARCHITECTURE.md`, `README.md`, `src/firebase.js`, and checked for `.env.local` and `netlify.toml`.

Found that `src/firebase.js` reads config from `import.meta.env.VITE_*` variables:

```js
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}
```

Diagnosed the issue: the app works locally because Vite reads from `.env.local`, but that file is gitignored and not available on Netlify. The `VITE_FIREBASE_*` env vars are `undefined` at build time, so Firebase gets an invalid API key.

**Fix:** Add environment variables in Netlify's dashboard:
1. Go to Netlify > your site (`study-stats`) > Site configuration > Environment variables
2. Add each `VITE_FIREBASE_*` variable with values from `.env.local`:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
3. Go to Deploys > Trigger deploy > Clear cache and deploy site

The redeploy is required because Vite inlines `import.meta.env.*` values at build time — they're baked into the JS bundle.

No code changes needed — the issue was entirely a Netlify configuration gap.

---

**User:** Do I enable secret value when importing env variable to Netlify?

**Claude:**
No. These are not secrets — Firebase web API keys are designed to be public (they're embedded in your client-side JS bundle and visible to anyone inspecting your site).

Just paste them as regular environment variables. The "secret" option in Netlify makes values unavailable at build time, which would break your setup since Vite needs to inline them during the build.

---

## Task 2: Fix Custom 404 Page Not Showing on Netlify

**User:** The custom 404 page on Netlify doesn't show up. Find the issue and suggest fixes.

**Claude:**
Checked for `public/_redirects` — file did not exist.

Diagnosed: Netlify handles routing at the server level. When someone hits a URL like `/random-page`, Netlify looks for that file on disk, doesn't find it, and shows its own default 404 instead of serving the app. React Router never gets a chance to render the `NotFound` component.

**Fix:** Create a `public/_redirects` file with:
```
/*    /index.html   200
```

This tells Netlify: "For any URL, serve `index.html` with a 200 status, and let the client-side router handle it."

---

**User:** Yes, apply fix.

**Claude:**
Created `public/_redirects`:
```
/*    /index.html   200
```

---

**User:** Review the code you just wrote. Check for:
- Bugs or logic errors
- Edge cases we're not handling
- Anything that could break

**Claude:**
The `_redirects` file is correct — it's a single rule, and it's the standard SPA redirect for Netlify.

One thing to consider: the `200` status code means Netlify returns `index.html` with a 200 OK for every URL, even truly missing ones. This is fine for users (they see your custom 404 page via React Router), but search engines will index those 404 pages as valid content since they see a 200 response.

This is a minor SEO concern and unlikely to matter for a student project app. No bugs, no changes needed.

---

## Task 3: Code Review — Navigation, Landing Page, and Authentication

**User:** Review the code you just wrote for navigation, landing page, and authentication. Check for:
- Bugs or logic errors
- Edge cases we're not handling
- Anything that could break

**Claude:**
Read and reviewed: `Navbar.jsx`, `Landing.jsx`, `Login.jsx`, `Signup.jsx`, `AuthContext.jsx`, `PrivateRoute.jsx`.

### Findings:

**1. Bug — Dead code in Login.jsx (lines 45-46, 95-98):**
Firebase v9+ merged `auth/user-not-found` and `auth/wrong-password` into a single `auth/invalid-credential` error for security reasons. The `auth/user-not-found` case in `getErrorMessage` and the signup link conditional would never trigger. The `auth/wrong-password` case was also dead for the same reason.

**2. Edge case — No error handling on logout (Navbar.jsx:15-21):**
`handleLogout` had no try/catch. If `signOut()` fails (network drop, Firebase outage), you get an unhandled promise rejection and the user sees nothing.

**3. Edge case — Feature cards send logged-out users to login with no return path (Landing.jsx:32-47):**
When a logged-out user clicks a feature card, `PrivateRoute` redirects them to `/login`, but doesn't preserve where they were trying to go. After login, they land on `/` instead of the page they clicked. Minor UX issue.

Items 2 and 3 are minor and won't break anything. Item 1 is the most notable — that signup prompt feature simply doesn't work with current Firebase.

---

## Task 4: Fix Login Bug and Logout Edge Case

**User:** Yes, fix the login bug and the edge cases for logout.

**Claude:**
Applied fixes to two files:

**Login.jsx — removed dead error codes, updated signup link trigger:**
```jsx
// Before:
case 'auth/invalid-credential':
  return 'Incorrect email or password.'
case 'auth/user-not-found':
  return 'No account found with this email.'
case 'auth/wrong-password':
  return 'Incorrect password.'

// After:
case 'auth/invalid-credential':
  return 'Incorrect email or password. If you don\u2019t have an account, sign up instead.'
```

```jsx
// Before:
{errorCode === 'auth/user-not-found' && (

// After:
{errorCode === 'auth/invalid-credential' && (
```

**Navbar.jsx — added try/catch on logout:**
```jsx
// Before:
async function handleLogout() {
  setMenuOpen(false)
  await logout()
  if (!protectedPaths.includes(location.pathname)) {
    navigate('/')
  }
}

// After:
async function handleLogout() {
  setMenuOpen(false)
  try {
    await logout()
    if (!protectedPaths.includes(location.pathname)) {
      navigate('/')
    }
  } catch {
    alert('Logout failed. Please check your connection and try again.')
  }
}
```

---

## Task 5: Generate Navbar Tests

**User:**
Generate render tests for Navbar.jsx using React Testing Library.
Test 1 — logged-out state:
- Login link is visible
- Sign Up link is visible
- Dashboard, Sessions, Assignments, Pomodoro links are NOT visible
- Logout button is NOT visible
Test 2 — logged-in state:
- Dashboard, Sessions, Assignments, Pomodoro links are visible
- Logout button is visible
- Logged-in user profile icon is displayed
- Login and Sign Up links are NOT visible
Mock AuthContext with jest.mock to control currentUser value.
Use userEvent for any click interactions.

Add more tests if necessary to test navigation.

**Claude:**
Created `src/components/Navbar.test.jsx` with 16 tests across 5 describe blocks:

```jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Navbar from './Navbar'

const mockLogout = vi.fn()
const mockNavigate = vi.fn()

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

import { useAuth } from '../context/AuthContext'

function renderNavbar(route = '/') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Navbar />
    </MemoryRouter>
  )
}
```

**Logged-out state (5 tests):**
- Log In link visible
- Sign Up link visible
- Dashboard, Sessions, Assignments, Pomodoro links NOT visible
- Logout button NOT visible
- Hamburger menu button NOT visible

**Logged-in state (4 tests):**
- Dashboard, Sessions, Assignments, Pomodoro links visible
- Logout button visible
- Profile icon displays user email via `aria-label`
- Log In and Sign Up links NOT visible

**Logo (2 tests):**
- StudyStats logo renders when logged out
- StudyStats logo renders when logged in

**Hamburger menu (1 test):**
- Toggles `aria-expanded` and accessible name between open/close on click

**Logout (4 tests):**
- Calls `logout()` when Log Out button is clicked
- Navigates to `/` after logout on a non-protected path
- Does not navigate after logout on a protected path (PrivateRoute handles redirect)
- Shows an alert when logout fails (tests the try/catch fix)

All 16 tests passed.

---

## Task 6: Fix Return-Path Redirect Edge Case

**User:** Can you fix this edge case? Edge case — Feature cards send logged-out users to login with no return path (Landing.jsx:32-47)

**Claude:**
Applied fixes to three files:

**PrivateRoute.jsx — pass intended destination via route state:**
```jsx
// Before:
import { Navigate } from 'react-router-dom'

return currentUser ? children : <Navigate to="/login" />

// After:
import { Navigate, useLocation } from 'react-router-dom'

const location = useLocation()

return currentUser ? children : <Navigate to="/login" state={{ from: location.pathname }} />
```

**Login.jsx — redirect to intended destination after login:**
```jsx
// Before:
const navigate = useNavigate()
// ...
await login(email, password)
navigate('/')

// After:
const navigate = useNavigate()
const location = useLocation()
const redirectTo = location.state?.from || '/'
// ...
await login(email, password)
navigate(redirectTo)
```

**Login.test.jsx — updated stale test to match earlier bug fix:**
```jsx
// Before:
mockLogin.mockRejectedValue({ code: 'auth/user-not-found' })
// ...
expect(screen.getByText('No account found with this email.')).toBeInTheDocument()

// After:
mockLogin.mockRejectedValue({ code: 'auth/invalid-credential' })
// ...
expect(screen.getByText(/incorrect email or password/i)).toBeInTheDocument()
```

All 21 tests passed (16 Navbar + 5 Login).

---

## Task 7: Update Documentation

**User:**
Update PROJECT-STATUS.md and ARCHITECTURE.md to reflect what we built this session.
ARCHITECTURE.md --- update only if new files or dependencies were added:
Next Steps to write:
Start Phase 4: Firestore Data Layer
Go to Firebase Console > Firestore > Create database (test mode)

**Claude:**
Updated both files:

**PROJECT-STATUS.md:**
- Deployment: added Netlify env vars and SPA redirect
- Auth: updated to reflect `invalid-credential` fix, return-path redirect, logout error handling
- Testing: 8 → 24 tests (added Navbar test suite)
- 404: noted Netlify SPA redirect configured
- Navbar: noted logout error handling with try/catch
- Next Steps: replaced "Complete Phase 3 debugging" with "Start Phase 4: Firestore Data Layer" and "Go to Firebase Console > Firestore > Create database (test mode)"

**ARCHITECTURE.md:**
- Added `src/components/Navbar.test.jsx` to Key Files
- Added `public/_redirects` to Key Files
- Updated PrivateRoute description (return-path state)
- Updated Login description (invalid-credential, return-path redirect)
- Updated Login.test.jsx description

---

## Summary of Changes This Session

### Files Created
| File | Purpose |
|------|---------|
| `public/_redirects` | Netlify SPA redirect rule for client-side routing |
| `src/components/Navbar.test.jsx` | 16 render and behavior tests for Navbar |

### Files Modified
| File | Changes |
|------|---------|
| `src/pages/Login.jsx` | Fixed dead `auth/user-not-found` code, added return-path redirect after login |
| `src/pages/Login.test.jsx` | Updated test to match `auth/invalid-credential` error code |
| `src/components/Navbar.jsx` | Added try/catch error handling on logout |
| `src/components/PrivateRoute.jsx` | Added return-path state to login redirect |
| `PROJECT-STATUS.md` | Updated to reflect Phase 3 fixes, 24 tests, next steps |
| `ARCHITECTURE.md` | Added new files, updated descriptions for modified components |

### Test Results
- **24 tests passing** (16 Navbar + 5 Login + 3 PrivateRoute)
- All tests run with Vitest + React Testing Library
