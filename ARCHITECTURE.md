## Tech Stack

- Frontend: React 19 + Vite 7
- Routing: React Router v7
- Authentication: Firebase Auth (Email/Password)
- Database: Firebase Firestore
- Date Utilities: date-fns
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
- `src/components/Navbar.css` — Navbar styles: sticky positioning, hamburger toggle with animated open/close icon, centered desktop links, mobile dropdown with aligned icons, logged-out single-row layout.
- `src/components/PrivateRoute.jsx` — Wrapper component that redirects to `/login` with return-path state if not authenticated. Shows loading spinner while auth state is resolving.
- `src/pages/Landing.jsx` — Public landing/home page. Shows "Get Started" button (→ /signup) when logged out, "Start Studying" button (→ /sessions) when logged in. Feature cards with SVG outline icons link to respective pages.
- `src/pages/Dashboard.jsx` — Stub page with styled layout.
- `src/pages/Sessions.jsx` — Stub page with styled layout.
- `src/pages/Pomodoro.jsx` — Stub page with styled layout.
- `src/pages/Assignments.jsx` — Stub page with styled layout.
- `src/pages/Stub.css` — Shared styles for stub pages (indigo heading, consistent page layout).
- `src/pages/NotFound.jsx` — 404 error page with warning icon, heading, message, and styled "Back to Home" button.
- `src/pages/NotFound.css` — 404 page styles.
- `src/pages/Login.jsx` — Email/password login form with inline field validation, Firebase error handling, invalid-credential prompt with signup link, return-path redirect after login, ARIA attributes for accessibility.
- `src/pages/Signup.jsx` — Registration form with password confirmation, inline field validation, live password requirements hint, ARIA attributes for accessibility.
- `src/pages/Auth.css` — Shared styles for Login and Signup pages, field errors, password hints, loading spinner, autofill contrast fix.
- `src/test/setup.js` — Test setup file. Imports jest-dom matchers and globally mocks Firebase SDK (firebase/app, firebase/auth, firebase/firestore) to prevent heavy module loading in test workers.
- `src/components/PrivateRoute.test.jsx` — Unit tests for PrivateRoute (loading, authenticated, unauthenticated redirect). Mocks React Router v7 Navigate to avoid jsdom OOM.
- `src/pages/Login.test.jsx` — Render and behavior tests for Login (inputs, button, errors, invalid-credential with signup link).
- `src/components/Navbar.test.jsx` — Render and behavior tests for Navbar (logged-out state, logged-in state, logo, hamburger toggle, logout with error handling).
- `src/services/firestore.test.js` — Unit tests for Firestore service (24 tests). Verifies correct subcollection paths, document field mapping, sort orders, empty results, CRUD operations.
- `src/hooks/useFirestore.test.jsx` — Unit tests for Firestore hooks (25 tests). Verifies return shapes, loading/error state, null uid handling, mutation error capture, uid change refetch.
- `src/services/firestore.js` — Firestore CRUD functions for sessions, assignments, and pomodoro. All paths scoped to `users/{uid}/{collection}`. Exports: `addSession()`, `getSessions()`, `updateSession()`, `deleteSession()`, `addAssignment()`, `getAssignments()`, `updateAssignment()`, `deleteAssignment()`, `logPomodoroSession()`, `getPomodoroLogs()`.
- `src/hooks/useFirestore.js` — Custom React hooks wrapping the Firestore service. Exports: `useSessions(uid)`, `useAssignments(uid)`, `usePomodoro(uid)`. Each returns data array, `loading`, `error`, mutation functions, and `refresh()`.
- `firestore.rules` — Firestore security rules. Denies all access by default, then allows read/write on `users/{userId}/**` only when `request.auth.uid == userId`.
- `public/_redirects` — Netlify SPA redirect rule. Sends all routes to `index.html` so React Router handles client-side routing and 404s.
- `vite.config.js` — Vite config with Vitest test configuration (jsdom environment, globals).

## Folder Structure

```
src/
  assets/        — Static assets (images, SVGs)
  components/    — Reusable UI components (Navbar, PrivateRoute)
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
| sessions | `users/{uid}/sessions/{id}` | `subject` (string), `duration` (number, minutes), `notes` (string), `date` (timestamp), `createdAt` (server timestamp) |
| assignments | `users/{uid}/assignments/{id}` | `title` (string), `subject` (string), `dueDate` (timestamp), `completed` (boolean), `createdAt` (server timestamp) |
| pomodoro | `users/{uid}/pomodoro/{id}` | `workMinutes` (number), `breakMinutes` (number), `completedAt` (server timestamp) |
