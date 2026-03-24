## Tech Stack

- Frontend: React 19 + Vite 7
- Routing: React Router v7
- Authentication: Firebase Auth (Email/Password)
- Database: Firebase Firestore
- Date Utilities: date-fns
- Icons: Material Symbols Outlined (Google Fonts CDN)
- Testing: Vitest + React Testing Library
- Deployment: Netlify (connected to GitHub)

## Key Files

- `src/main.jsx` — Entry point. Wraps app in `BrowserRouter` > `AuthProvider`.
- `src/App.jsx` — React Router routes: `/` (public), `/login`, `/signup`, `/dashboard`, `/sessions`, `/pomodoro`, `/assignments` (protected), `*` (404). Renders Navbar above all routes.
- `src/App.css` — Landing page styles (indigo color scheme, feature cards with icons, responsive grid).
- `src/index.css` — Global base styles and resets (light theme, clean reset — Vite boilerplate removed).
- `src/firebase.js` — Initializes Firebase App, Auth, and Firestore. Exports: `app`, `auth`, `db`. Config values read from `VITE_`-prefixed env vars in `.env.local`.
- `src/context/AuthContext.jsx` — Auth provider using `onAuthStateChanged`. Exports `useAuth()` hook providing: `currentUser`, `loading`, `login()`, `signup()`, `logout()`.
- `src/components/Icons.jsx` — Shared SVG outline icon components (DashboardIcon, SessionsIcon, AssignmentsIcon, PomodoroIcon, ProfileIcon). Used by Navbar and Landing.
- `src/components/Navbar.jsx` — Sticky navigation bar with logo, centered nav links with outline icons (logged in: Dashboard, Sessions, Assignments, Pomodoro + Logout + profile icon; logged out: Log In, Sign Up). Hamburger menu on mobile, no hamburger when logged out.
- `src/components/Navbar.css` — Navbar styles: sticky positioning, hamburger toggle with animated open/close icon, centered desktop links, mobile dropdown with aligned icons, logged-out single-row layout, 44px min-height logout touch target.
- `src/components/SessionForm.jsx` — Reusable session form for add/edit. Fields: subject (text with datalist autocomplete, placeholder hint, 75-char limit), color (8-swatch preset picker with distinct hues), duration (hours + minutes side-by-side inputs), date (date picker), status (select: complete/in-progress/incomplete), notes (optional textarea). Inline validation with length limits, duration >24h triggers overlay warning modal with focus trap matching delete modal pattern, hard cap at 2 weeks. `noValidate` suppresses browser tooltip validation. Accepts `initialData` prop for edit mode, `subjects` prop for autocomplete suggestions, `formId` prop for unique ARIA IDs. All field errors linked via `aria-describedby`. Cancel buttons light gray, primary buttons indigo. Button order: Cancel left, primary right, right-aligned.
- `src/components/SessionForm.css` — Session form styles: color swatch picker with selected ring and focus-visible indicator, duration h/m field layout with unit labels, custom select dropdown arrow via `appearance: none` with SVG chevron and inner padding, field errors, light-gray cancel buttons, right-aligned action buttons, self-contained duration warning modal overlay (z-index 300, amber confirm button, focus trap), mobile swatch gap adjustment, mobile 16px input font-size to prevent iOS auto-zoom, mobile flex-equal-width form buttons.
- `src/components/PrivateRoute.jsx` — Wrapper component that redirects to `/login` with return-path state if not authenticated. Shows loading spinner while auth state is resolving.
- `src/pages/Landing.jsx` — Public landing/home page. Shows "Get Started" button (→ /signup) when logged out, "Start Studying" button (→ /sessions) when logged in. Feature cards with SVG outline icons link to respective pages.
- `src/pages/Dashboard.jsx` — Stub page with styled layout.
- `src/pages/Sessions.jsx` — Full study session tracker page. Restructured card layout: Row 1 title-group (subject ellipsis + status badge) on left + Material Icon edit/delete buttons on right, Row 2 date + enlarged separator dot + duration, Row 3 notes with 2-line clamp and right-aligned gray "Show more" toggle. Lightened card background tint (0.04 opacity, AA-verified). All actions (add, edit, delete) via centered modal overlays with focus trap, Escape key close, and dimmed backdrop. Delete modal uses `role="alertdialog"` and stays centered on mobile via `modal-overlay-centered` class. Modal component accepts `className` prop for per-instance overrides. Session list uses `<ul>/<li>` for screen reader semantics. Loading spinner with `role="status"`. Error banner and empty state. Computes unique subjects via `useMemo` for autocomplete datalist.
- `src/pages/Pomodoro.jsx` — Stub page with styled layout.
- `src/pages/Assignments.jsx` — Stub page with styled layout.
- `src/pages/Sessions.css` — Sessions page styles: restructured card layout with lightened color-tinted backgrounds, title-group wrapper for subject+badge grouping, subject ellipsis truncation, Material Icon button styles, status badge pills (green/amber/red), date+duration meta row with enlarged separator dot, notes 2-line clamp with right-aligned gray "Show more" toggle, card hover lift/shadow, 640px max-width list, modal overlay with backdrop and focus styles, delete modal with improved spacing and light-gray cancel buttons, `modal-overlay-centered` class for mobile delete modal centering, spinner animation, mobile responsive breakpoints with increased icon button gap.
- `src/pages/Stub.css` — Shared styles for stub pages (indigo heading, consistent page layout).
- `src/pages/NotFound.jsx` — 404 error page with warning icon, heading, message, and styled "Back to Home" button.
- `src/pages/NotFound.css` — 404 page styles.
- `src/pages/Login.jsx` — Email/password login form with inline field validation, Firebase error handling, invalid-credential prompt with signup link, return-path redirect after login, ARIA attributes for accessibility.
- `src/pages/Signup.jsx` — Registration form with password confirmation, inline field validation, live password requirements hint, ARIA attributes for accessibility.
- `src/pages/Auth.css` — Shared styles for Login and Signup pages, field errors, password hints, loading spinner, autofill contrast fix, focus-visible rings on submit buttons (including disabled state), mobile 16px input font-size to prevent iOS auto-zoom.
- `src/test/setup.js` — Test setup file. Imports jest-dom matchers and globally mocks Firebase SDK (firebase/app, firebase/auth, firebase/firestore) to prevent heavy module loading in test workers.
- `src/components/PrivateRoute.test.jsx` — Unit tests for PrivateRoute (loading, authenticated, unauthenticated redirect). Mocks React Router v7 Navigate to avoid jsdom OOM.
- `src/pages/Login.test.jsx` — Render and behavior tests for Login (inputs, button, errors, invalid-credential with signup link).
- `src/components/Navbar.test.jsx` — Render and behavior tests for Navbar (logged-out state, logged-in state, logo, hamburger toggle, logout with error handling).
- `src/services/firestore.test.js` — Unit tests for Firestore service (24 tests). Verifies correct subcollection paths, document field mapping, sort orders, empty results, CRUD operations.
- `src/hooks/useFirestore.test.jsx` — Unit tests for Firestore hooks (25 tests). Verifies return shapes, loading/error state, null uid handling, mutation error capture, uid change refetch.
- `src/services/firestore.js` — Firestore CRUD functions for sessions, assignments, and pomodoro. All paths scoped to `users/{uid}/{collection}`. `addSession` stores subject, duration, notes, date, color, and status with defaults. `updateSession` filters through a field whitelist before writing. Exports: `addSession()`, `getSessions()`, `updateSession()`, `deleteSession()`, `addAssignment()`, `getAssignments()`, `updateAssignment()`, `deleteAssignment()`, `logPomodoroSession()`, `getPomodoroLogs()`.
- `src/hooks/useFirestore.js` — Custom React hooks wrapping the Firestore service. Exports: `useSessions(uid)`, `useAssignments(uid)`, `usePomodoro(uid)`. Each returns data array, `loading`, `error`, mutation functions, and `refresh()`. Mutations return `true`/`false` for success/failure. Errors mapped to user-friendly messages via `friendlyError()` helper.
- `firestore.rules` — Firestore security rules. Denies all access by default. Per-collection rules under `users/{userId}` enforce `isOwner()` auth check, `hasAll`+`hasOnly` for required/allowed fields, type validation, size limits (75-char subject cap), enum validation for session status, and `createdAt == request.time` for server timestamp integrity. Pomodoro docs are immutable (update denied).
- `index.html` — App shell. Loads Material Symbols Outlined from Google Fonts CDN for edit/delete/add icons.
- `public/_redirects` — Netlify SPA redirect rule. Sends all routes to `index.html` so React Router handles client-side routing and 404s.
- `vite.config.js` — Vite config with Vitest test configuration (jsdom environment, globals).

## Folder Structure

```
src/
  assets/        — Static assets (images, SVGs)
  components/    — Reusable UI components (Navbar, PrivateRoute, SessionForm)
  context/       — React context providers (AuthContext)
  hooks/         — Custom React hooks
  pages/         — Route-level page components + page styles
  test/          — Test setup files
  utils/         — Helper/utility functions
  firebase.js    — Firebase config & initialization
  App.jsx        — Router setup + Navbar
  App.css        — Landing page styles
  index.css      — Global base styles
  main.jsx       — App entry point
```

## Data Model

All user data lives in subcollections under `users/{uid}`:

| Collection | Path | Fields |
|---|---|---|
| sessions | `users/{uid}/sessions/{id}` | `subject` (string), `duration` (number, minutes), `notes` (string), `date` (timestamp), `color` (string, hex), `status` (string: `complete` \| `in-progress` \| `incomplete`), `createdAt` (server timestamp) |
| assignments | `users/{uid}/assignments/{id}` | `title` (string), `subject` (string), `dueDate` (timestamp), `completed` (boolean), `createdAt` (server timestamp) |
| pomodoro | `users/{uid}/pomodoro/{id}` | `workMinutes` (number), `breakMinutes` (number), `completedAt` (server timestamp) |
