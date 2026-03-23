# StudyStats — Claude Code Transcript (Session 5 — Phase 4)

**Date:** 2026-03-23
**Project:** StudyStats (Vite + React Study Planner)
**Phase:** 4 — Firestore Data Layer
**Tool:** Claude Code (VSCode Extension) — Claude Opus 4.6

---

## Session Summary

Built the complete Firestore data layer, including CRUD service functions, custom React hooks, security rules, and 49 new unit tests. Also diagnosed and fixed a pre-existing OOM crash in the PrivateRoute tests caused by React Router v7's Navigate component in jsdom. All 73 tests now pass in ~3.5 seconds.

---

## Session 5 — Mar 23, 2026

## Task 1: Planning Phase 4

### User

Read PROJECT-STATUS.md, ARCHITECTURE.md, and README.md to understand the current state of this project before making any suggestions or changes. Today's task: Build the Firestore data layer (Phase 4). We are planning right now, no coding yet.

### Assistant

> Tool calls: **Read** `PROJECT-STATUS.md`, **Read** `ARCHITECTURE.md`, **Read** `README.md`, **Read** `src/firebase.js`

I've read all four files. Here's the current state:

- **Phase 3 complete** — Navbar shell, stub routes, PrivateRoute, CSS polish, 24 tests passing
- **Firebase Auth** — working (login, signup, logout, AuthContext, PrivateRoute)
- **Firestore** — not yet set up; `src/firebase.js` initializes the app and exports `auth` but has no Firestore imports
- **Next step per PROJECT-STATUS.md** — "Start Phase 4: Firestore Data Layer" and "Go to Firebase Console > Firestore > Create database (test mode)"

Here's the plan for Phase 4:

| Step | Task | Details |
|------|------|---------|
| **0** | **Manual — Create Firestore database** | Go to Firebase Console > Firestore Database > Create database. Choose "Start in test mode" for now. |
| **1** | **Data model** | 3 subcollections under `users/{uid}`: `sessions`, `assignments`, `pomodoro` |
| **2** | **Firestore service module** | `src/services/firestore.js` — CRUD functions for each collection |
| **3** | **Custom React hooks** | `src/hooks/useFirestore.js` — hooks wrapping the service layer with loading/error state |
| **4** | **Security rules** | `firestore.rules` — deny-all default + per-user ownership override |
| **5** | **Smoke test** | Wire a hook into Sessions stub temporarily to verify reads/writes work |
| **6** | **Update docs** | PROJECT-STATUS.md and ARCHITECTURE.md |

Step 0 is the only manual step — you'll need to create the Firestore database in Firebase Console before the app can read/write data. Steps 1–5 are all code.

---

## Task 2: Data Model Walkthrough

### User

Walk me through Step 1. So I put users in field?

### Assistant

`users` is not a field — it's the **collection** structure in Firestore. Here's how the hierarchy works:

```
users/              ← top-level collection (created automatically)
  └── {uid}/        ← document ID = the logged-in user's Firebase Auth UID
        └── sessions/       ← subcollection
              ├── {auto-id}  → { subject, duration, notes, date, createdAt }
              ├── {auto-id}  → { subject, duration, notes, date, createdAt }
              └── ...
        └── assignments/    ← subcollection
              ├── {auto-id}  → { title, subject, dueDate, completed, createdAt }
              └── ...
        └── pomodoro/       ← subcollection
              ├── {auto-id}  → { workMinutes, breakMinutes, completedAt }
              └── ...
```

Everything in Firestore is structured as **collections → documents → fields**:

| Concept | Example | What it is |
|---------|---------|------------|
| **Collection** | `users` | A container that holds documents — like a folder |
| **Document** | `users/abc123` | A single record identified by an ID — like a file |
| **Field** | `subject: "Math"` | A key-value pair inside a document — like a cell in a spreadsheet |
| **Subcollection** | `users/abc123/sessions` | A collection nested inside a document |

Collections, documents, and fields are all **created automatically** by the app code when data is first written — you don't need to define a schema or create them manually. The only manual step is creating the **database itself** in Firebase Console.

The `users/{uid}` root scopes all data per user, which means:
- Each user can only see their own data
- Security rules can enforce ownership by checking `request.auth.uid == userId`
- No risk of data leaking between users

---

## Task 3: Implementation — Steps 2, 3, and 4

### User

Continue with Step 2 Firestore service module, Step 3 Custom React hooks, and Step 4 Firestore security rules. Keep in mind the Data model from Step 1.

### Assistant

> Tool calls: **Bash** `mkdir src/services`, **Write** `src/services/firestore.js`, **Write** `src/hooks/useFirestore.js`, **Write** `firestore.rules`, **Edit** `PROJECT-STATUS.md`, **Edit** `ARCHITECTURE.md`, **Bash** `npx vite build`

Created three files:

**`src/services/firestore.js`** — CRUD functions for all three collections:

Two helper functions keep paths DRY:

```js
function userCollection(uid, name) {
  return collection(db, 'users', uid, name)
}

function userDoc(uid, collectionName, docId) {
  return doc(db, 'users', uid, collectionName, docId)
}
```

| Function | Collection | What it does |
|----------|-----------|-------------|
| `addSession(uid, { subject, duration, notes, date })` | `sessions` | Writes a new session doc. Defaults `notes` to `''` if not provided. Adds `createdAt: serverTimestamp()`. |
| `getSessions(uid)` | `sessions` | Reads all sessions, ordered by `date` descending (newest first). Maps each doc to `{ id, ...data }`. |
| `updateSession(uid, sessionId, updates)` | `sessions` | Partial update on a single session document. |
| `deleteSession(uid, sessionId)` | `sessions` | Deletes a single session document. |
| `addAssignment(uid, { title, subject, dueDate })` | `assignments` | Writes a new assignment. Defaults `completed` to `false`. Adds `createdAt: serverTimestamp()`. |
| `getAssignments(uid)` | `assignments` | Reads all assignments, ordered by `dueDate` ascending (soonest first). |
| `updateAssignment(uid, assignmentId, updates)` | `assignments` | Partial update on a single assignment document. |
| `deleteAssignment(uid, assignmentId)` | `assignments` | Deletes a single assignment document. |
| `logPomodoroSession(uid, { workMinutes, breakMinutes })` | `pomodoro` | Writes a completed pomodoro log. Adds `completedAt: serverTimestamp()`. |
| `getPomodoroLogs(uid)` | `pomodoro` | Reads all pomodoro logs, ordered by `completedAt` descending. |

All 10 functions use the `users/{uid}/{collection}` path structure from the data model.

---

**`src/hooks/useFirestore.js`** — Three custom React hooks wrapping the service layer:

Each hook follows the same pattern:
1. `useState` for data, loading, and error
2. `useCallback` for a `reload` function that fetches data
3. `useEffect` that calls `reload` whenever `uid` changes
4. Mutation functions (`add`, `update`, `remove`) that call the service then `reload` to refetch

```js
export function useSessions(uid) {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const reload = useCallback(async () => {
    if (!uid) return
    setLoading(true)
    try {
      setSessions(await getSessions(uid))
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [uid])

  useEffect(() => { reload() }, [reload])

  // add, update, remove functions...
  return { sessions, loading, error, add, update, remove, refresh: reload }
}
```

| Hook | Returns | Service functions used |
|------|---------|----------------------|
| `useSessions(uid)` | `{ sessions, loading, error, add, update, remove, refresh }` | `getSessions`, `addSession`, `updateSession`, `deleteSession` |
| `useAssignments(uid)` | `{ assignments, loading, error, add, update, remove, refresh }` | `getAssignments`, `addAssignment`, `updateAssignment`, `deleteAssignment` |
| `usePomodoro(uid)` | `{ logs, loading, error, logSession, refresh }` | `getPomodoroLogs`, `logPomodoroSession` |

The hooks use **re-fetch after mutation** rather than optimistic updates — this is simpler and guarantees the UI always matches the server state.

---

**`firestore.rules`** — Security rules:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Deny all access by default
    match /{document=**} {
      allow read, write: if false;
    }

    // Per-user data: only the authenticated owner can read/write
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

The rules work in two layers:
- **Default deny:** `allow read, write: if false` blocks all access to any document in the database
- **Per-user override:** The `users/{userId}/{document=**}` rule allows read/write only when `request.auth.uid == userId` — meaning a user can only access documents under their own `users/{uid}/` path

Updated PROJECT-STATUS.md and ARCHITECTURE.md. Build verified passing.

---

## Task 4: Firebase Console Setup

### User

The database is created in Default cloud firestore, no collections yet. Firestore rules are also added.

### Assistant

That's all you need. The collections (`sessions`, `assignments`, `pomodoro`) will be created automatically the first time the app writes data — Firestore creates collections and documents on-the-fly. The database and rules are in place, so the data layer is ready to use.

---

## Task 5: Smoke Test

### User

Did we complete Step 5 — Smoke test?

### Assistant

> Tool calls: **Read** `src/pages/Sessions.jsx`, **Edit** `src/pages/Sessions.jsx`

Good catch — we hadn't done the smoke test yet. I added a temporary test UI to Sessions.jsx with an input field, Add button, and delete functionality wired to the `useSessions` hook:

```jsx
import { useSessions } from '../hooks/useFirestore'
import { useAuth } from '../context/AuthContext'

function Sessions() {
  const { currentUser } = useAuth()
  const { sessions, loading, error, add, remove } = useSessions(currentUser?.uid)
  const [subject, setSubject] = useState('')

  // Input field + Add button to write a session
  // List of sessions with Delete buttons
  // Shows loading spinner and error messages
}
```

This wires up the full pipeline: component → `useSessions` hook → `addSession`/`getSessions` service → Firestore. If you can add a session and see it appear in the list, the entire data layer is working end-to-end.

---

### User

The smoke test works. Ensure Step 2 — Firestore service module is complete. Also ensure Step 3 — Custom React hooks is complete

### Assistant

> Tool calls: **Read** `src/services/firestore.js`, **Read** `src/hooks/useFirestore.js`

That confirms reads and writes work through the full pipeline: `useSessions` hook → `addSession`/`getSessions` service → Firestore → back to the UI. The data layer is functioning correctly.

Verified Steps 2 and 3:

| Checkpoint | Status |
|-----------|--------|
| **10 service functions** | All present — 4 sessions, 4 assignments, 2 pomodoro |
| **Subcollection paths** | All use `users/{uid}/{collection}` via helpers |
| **Ordering** | Sessions by `date` desc, assignments by `dueDate` asc, pomodoro by `completedAt` desc |
| **Timestamps** | All write functions use `serverTimestamp()` |
| **3 hooks** | All present with matching return shapes |
| **Hook state** | Each has `loading`, `error`, data array, mutation functions, `refresh` |

Both steps are complete.

---

## Task 6: Code Review

### User

Review the code you wrote for Phase 4. Check for:
- Bugs or logic errors
- Edge cases we're not handling
- Anything that could break

### Assistant

> Tool calls: **Read** `src/services/firestore.js`, **Read** `src/hooks/useFirestore.js`, **Read** `firestore.rules`

Found three issues:

**1. Bug — Mutation errors not captured (all 3 hooks):**

The `add`, `update`, and `remove` functions in the hooks had no try/catch. If a Firestore write fails (network drop, permission denied, quota exceeded), the error would bubble up as an unhandled promise rejection instead of being captured in the hook's `error` state. This affects all 8 mutation functions across three hooks.

```js
// Current code — no error handling:
const add = async (data) => {
  await addSession(uid, data)
  await reload()
}

// If addSession throws, the error is unhandled
```

**2. Edge case — Loading stuck on true when uid is null:**

If `uid` is falsy (user not logged in yet, or AuthContext still loading), the `reload` callback returns early without setting `loading` to false:

```js
// Current code:
const reload = useCallback(async () => {
  if (!uid) return          // ← returns without setLoading(false)
  setLoading(true)
  // ...
}, [uid])
```

Since `loading` starts as `true`, any component using the hook with a null `uid` would show an infinite spinner.

**3. Minor — `fetch` shadows `window.fetch`:**

The reload callback was named `fetch`, which shadows the global `window.fetch` API. No functional impact since none of the hook code uses `window.fetch`, but it's a naming concern that could confuse developers or linters.

---

### User

Fix Issue 1 mutation error bugs, Issue 2 loading edge case, and Issue 3 fetch variable name.

### Assistant

> Tool calls: **Edit** `src/hooks/useFirestore.js` (3 edits — one per hook), **Bash** `npx vite build`

Fixed all three hooks:

**Issue 1 — Wrapped all 8 mutation functions in try/catch:**

```js
// Before:
const add = async (data) => {
  await addSession(uid, data)
  await reload()
}

// After:
const add = async (data) => {
  try {
    await addSession(uid, data)
    await reload()
  } catch (err) {
    setError(err.message)
  }
}
```

Applied to: `add`, `update`, `remove` in `useSessions`; `add`, `update`, `remove` in `useAssignments`; `logSession` in `usePomodoro` — 8 functions total, all now capture errors in state.

**Issue 2 — Added `setLoading(false)` in early return when uid is null:**

```js
// Before:
const reload = useCallback(async () => {
  if (!uid) return
  // ...

// After:
const reload = useCallback(async () => {
  if (!uid) {
    setLoading(false)
    return
  }
  // ...
```

Applied to all three hooks. Now components will correctly show empty state instead of an infinite spinner when `uid` is null.

**Issue 3 — Renamed `fetch` → `reload` across all three hooks:**

```js
// Before:
const fetch = useCallback(async () => { ... }, [uid])
useEffect(() => { fetch() }, [fetch])

// After:
const reload = useCallback(async () => { ... }, [uid])
useEffect(() => { reload() }, [reload])
```

No more shadowing of `window.fetch`. The `reload` name also better describes what the function does — it re-fetches data from Firestore.

Build verified passing.

---

## Task 7: Verification Review

### User

Ensure Step 2 and Step 3 are complete. Check subcollection paths, return shapes, dependency arrays, uid handling, state initialization.

### Assistant

> Tool calls: **Read** `src/services/firestore.js`, **Read** `src/hooks/useFirestore.js`

Verified all checkpoints:

| Checkpoint | Status | Details |
|-----------|--------|---------|
| **Subcollection paths** | All correct | All 10 service functions use `users/{uid}/sessions`, `users/{uid}/assignments`, or `users/{uid}/pomodoro` via the `userCollection()` and `userDoc()` helpers |
| **Return shapes** | All correct | `useSessions` → `{ sessions, loading, error, add, update, remove, refresh }`, `useAssignments` → `{ assignments, loading, error, add, update, remove, refresh }`, `usePomodoro` → `{ logs, loading, error, logSession, refresh }` |
| **Dependency arrays** | Correct chain | `reload` depends on `[uid]`, `useEffect` depends on `[reload]` — when `uid` changes, `reload` is recreated, which triggers `useEffect` to re-fetch |
| **Null uid handling** | Handled | All three hooks check `if (!uid)` and return early with `setLoading(false)` — no Firestore calls made, no infinite spinner |
| **State initialization** | Correct | Data arrays start as `[]`, `loading` starts as `true`, `error` starts as `null` |

Steps 2 and 3 are complete. No issues found.

---

### User

Yes, revert Sessions.jsx back.

### Assistant

> Tool calls: **Edit** `src/pages/Sessions.jsx`

Reverted Sessions.jsx to its original stub — removed the smoke test UI, `useSessions` hook, and `useAuth` import. It's back to the simple placeholder page. Phase 4 is fully complete.

---

## Task 8: Unit Tests

### User

Generate unit tests for the functions in src/services/firestore.js and src/hooks/useFirestore.js. Do they verify the correct Firestore paths are being called? Are edge cases covered like empty results, missing documents?

### Assistant

> Tool calls: **Write** `src/services/firestore.test.js`, **Write** `src/hooks/useFirestore.test.jsx`, **Bash** `npx vitest run src/services/firestore.test.js`, **Bash** `npx vitest run src/hooks/useFirestore.test.jsx`

Created two test files with 49 tests total.

**`src/services/firestore.test.js`** — 24 tests across 10 describe blocks:

The test setup mocks the entire Firestore SDK and the `../firebase` module:

```js
const mockAddDoc = vi.fn()
const mockGetDocs = vi.fn()
const mockUpdateDoc = vi.fn()
const mockDeleteDoc = vi.fn()
const mockCollection = vi.fn()
const mockDoc = vi.fn()
const mockQuery = vi.fn()
const mockOrderBy = vi.fn()
const mockServerTimestamp = vi.fn(() => 'SERVER_TIMESTAMP')

vi.mock('firebase/firestore', () => ({
  collection: (...args) => mockCollection(...args),
  addDoc: (...args) => mockAddDoc(...args),
  // ... all SDK functions mocked
}))

vi.mock('../firebase', () => ({ db: 'MOCK_DB' }))
```

| Describe block | Tests | What they verify |
|----------------|-------|-----------------|
| **subcollection paths** | 7 | `getSessions` calls `collection('MOCK_DB', 'users', uid, 'sessions')`, `getAssignments` calls with `'assignments'`, `getPomodoroLogs` calls with `'pomodoro'`, `updateSession`/`deleteSession` use `doc('MOCK_DB', 'users', uid, 'sessions', id)`, same for assignments |
| **addSession** | 2 | Writes correct fields with `serverTimestamp()`; defaults `notes` to `''` when not provided |
| **getSessions** | 3 | Orders by `date` desc; maps docs to `{ id, ...data }` objects; returns `[]` when no documents exist |
| **updateSession** | 1 | Calls `updateDoc` with correct ref and updates |
| **deleteSession** | 1 | Calls `deleteDoc` with correct ref |
| **addAssignment** | 1 | Writes correct fields with `completed: false` default |
| **getAssignments** | 3 | Orders by `dueDate` asc; maps docs; returns `[]` for empty |
| **updateAssignment** | 1 | Calls `updateDoc` with correct ref |
| **deleteAssignment** | 1 | Calls `deleteDoc` with correct ref |
| **logPomodoroSession** | 1 | Writes `workMinutes`, `breakMinutes`, `completedAt: serverTimestamp()` |
| **getPomodoroLogs** | 3 | Orders by `completedAt` desc; maps docs; returns `[]` for empty |

**`src/hooks/useFirestore.test.jsx`** — 25 tests across 3 describe blocks:

The test setup mocks the entire service layer:

```js
const mockGetSessions = vi.fn()
const mockAddSession = vi.fn()
// ... all 10 service functions mocked

vi.mock('../services/firestore', () => ({
  getSessions: (...args) => mockGetSessions(...args),
  addSession: (...args) => mockAddSession(...args),
  // ...
}))
```

Tests use `renderHook` from `@testing-library/react` and `waitFor`/`act` for async state updates:

| Hook | Tests | What they verify |
|------|-------|-----------------|
| **useSessions** | 11 | Returns correct shape (`sessions`, `loading`, `error`, `add`, `update`, `remove`, `refresh`); fetches on mount with correct uid; sets loading false and returns `[]` when uid is `null`; same for `undefined`; handles empty results; sets `error` when fetch fails; `add` calls `addSession` then refetches; `update` calls `updateSession` then refetches; `remove` calls `deleteSession` then refetches; sets `error` when mutation fails; refetches when uid changes |
| **useAssignments** | 7 | Returns correct shape; fetches on mount; handles null uid; handles empty results; sets error on fetch failure; `add` calls `addAssignment` then refetches; sets error on mutation failure |
| **usePomodoro** | 7 | Returns correct shape; fetches on mount; handles null uid; handles empty results; sets error on fetch failure; `logSession` calls `logPomodoroSession` then refetches; sets error on logSession failure |

All 49 new tests pass. Service tests: 24 pass in <1s. Hook tests: 25 pass in ~1.3s.

---

## Task 9: OOM Crash Investigation

### User

(Running all 73 tests together caused a heap OOM crash on the PrivateRoute test file)

### Assistant

When running all test files together with `npm test`, the process crashed with a JavaScript heap out of memory error. The crash occurred specifically on the PrivateRoute test file. Here's the investigation:

**Attempt 1 — Increased heap to 4GB:**

```bash
NODE_OPTIONS=--max-old-space-size=4096 npx vitest run
```

Still crashed — just took longer. This ruled out a simple memory limit issue.

**Attempt 2 — Switched to threads pool:**

```js
// vite.config.js
test: { pool: 'threads' }
```

Same OOM. Not a process isolation issue.

**Attempt 3 — Added per-file Firebase mocks:**

Added `vi.mock('firebase/app')` etc. to individual test files. No effect on the crash.

**Attempt 4 — Added global Firebase mock in setup.js:**

```js
// src/test/setup.js
vi.mock('firebase/app', () => ({ initializeApp: vi.fn(() => ({})) }))
vi.mock('firebase/auth', () => ({ getAuth: vi.fn(() => ({})) }))
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn(), addDoc: vi.fn(), getDocs: vi.fn(),
  updateDoc: vi.fn(), deleteDoc: vi.fn(), doc: vi.fn(),
  query: vi.fn(), orderBy: vi.fn(), serverTimestamp: vi.fn(),
}))
```

This prevented every test worker from loading the heavy Firebase SDK modules. Other tests sped up dramatically (144s → 3s), but PrivateRoute still crashed.

**Attempt 5 — Isolated by removing test cases:**

Commented out the third PrivateRoute test (the redirect test that renders `<Navigate to="/login" />`). The remaining 2 tests passed in 1.3s.

**Root cause identified:** React Router v7's `Navigate` component triggers infinite processing when rendered in Vitest 4's jsdom environment. The `Navigate` component tries to perform a navigation, which in jsdom causes an infinite loop — there's no real browser to navigate, so it keeps retrying.

**Fix applied:**

> Tool calls: **Edit** `src/test/setup.js`, **Edit** `src/components/PrivateRoute.test.jsx`, **Bash** `npm test`

Mocked `Navigate` in PrivateRoute.test.jsx to render a simple `<div>` instead of performing real navigation:

```jsx
// Before — uses real Navigate, causes infinite processing in jsdom:
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual }
})

// After — Navigate renders a testable div:
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    Navigate: ({ to }) => <div data-testid="navigate" data-to={to} />,
  }
})
```

The redirect test now verifies the target path without triggering the real Navigate behavior:

```jsx
it('redirects to /login when currentUser is null and loading is false', () => {
  useAuth.mockReturnValue({ currentUser: null, loading: false })

  renderWithRouter(
    <PrivateRoute><div>Protected Content</div></PrivateRoute>
  )

  expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/login')
})
```

---

## Task 10: Final Test Results

### Assistant

> Tool calls: **Bash** `npm test`

**All 73 tests pass in 3.5 seconds:**

| Test File | Tests | Time |
|-----------|-------|------|
| firestore.test.js | 24 | <1s |
| useFirestore.test.jsx | 25 | ~1.3s |
| Login.test.jsx | 5 | <1s |
| Navbar.test.jsx | 16 | <1s |
| PrivateRoute.test.jsx | 3 | <1s |
| **Total** | **73** | **~3.5s** |

---

## Task 11: Update Documentation

### User

Update PROJECT-STATUS.md and ARCHITECTURE.md to reflect what we built this session for Phase 4.
Next Steps to write:
Start Phase 5: Study Session Tracker
Install testing tools: npm install: save-dev jest @testing-library/react @testing-library/jest-dom

### Assistant

> Tool calls: **Edit** `PROJECT-STATUS.md`, **Edit** `ARCHITECTURE.md`

Updated both files:

**PROJECT-STATUS.md:**

| Section | Changes |
|---------|---------|
| **Testing** | 24 → 73 tests. Added Firestore service test suite (24 tests) and hooks test suite (25 tests). Noted global Firebase SDK mock in setup.js and Navigate mock fix for OOM. |
| **Cloud Database** | Marked as working — database created in Firebase Console, security rules deployed, data layer smoke-tested end-to-end. |
| **Known Issues** | Cleared — no outstanding issues. |
| **Next Steps** | Start Phase 5 — Study Session Tracker. Install testing tools: `npm install --save-dev jest @testing-library/react @testing-library/jest-dom`. |

**ARCHITECTURE.md:**

| Section | Changes |
|---------|---------|
| **Key Files** | Added `src/services/firestore.test.js` (24 tests — paths, fields, ordering, empty results) |
| **Key Files** | Added `src/hooks/useFirestore.test.jsx` (25 tests — shapes, loading/error, null uid, mutations, refetch) |
| **Key Files** | Updated `src/test/setup.js` description (global Firebase SDK mock to prevent heavy module loading) |
| **Key Files** | Updated `src/components/PrivateRoute.test.jsx` description (Navigate mock to fix jsdom OOM) |

---

## Summary of Changes This Session

### Files Created
| File | Purpose |
|------|---------|
| `src/services/firestore.js` | Firestore CRUD functions for sessions, assignments, pomodoro |
| `src/hooks/useFirestore.js` | Custom React hooks wrapping the service layer |
| `firestore.rules` | Firestore security rules (deny-all default + per-user ownership) |
| `src/services/firestore.test.js` | 24 unit tests for service layer |
| `src/hooks/useFirestore.test.jsx` | 25 unit tests for hooks |

### Files Modified
| File | Changes |
|------|---------|
| `src/test/setup.js` | Added global Firebase SDK mock to prevent heavy module loading |
| `src/components/PrivateRoute.test.jsx` | Mocked Navigate to fix jsdom OOM, improved redirect assertion |
| `PROJECT-STATUS.md` | Updated testing count, database status, next steps |
| `ARCHITECTURE.md` | Added new file descriptions, updated test file descriptions |
| `src/pages/Sessions.jsx` | Temporarily modified for smoke test, then reverted to stub |

### Key Decisions
1. **Subcollection structure** (`users/{uid}/sessions`) over top-level collections — natural per-user isolation, simpler security rules
2. **Service + hooks separation** — service layer handles raw Firestore SDK calls, hooks manage React state (loading, error, refetch)
3. **Re-fetch after mutation** instead of optimistic updates — simpler, guarantees consistency with server state
4. **Global Firebase mock in test setup** — prevents all test workers from loading the heavy Firebase SDK, reduced test runtime from 144s to 3.5s
5. **Navigate mock in PrivateRoute tests** — avoids React Router v7 infinite processing in jsdom while still verifying redirect target

### Test Results
- **73 tests passing** (24 Firestore service + 25 Firestore hooks + 16 Navbar + 5 Login + 3 PrivateRoute)
- All tests run with Vitest + React Testing Library
