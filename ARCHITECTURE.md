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
- `src/App.jsx` — React Router routes: `/` (public), `/login`, `/signup`.
- `src/App.css` — Landing page styles (indigo color scheme).
- `src/index.css` — Global base styles and resets.
- `src/firebase.js` — Initializes Firebase App, Auth, and Firestore. Exports: `app`, `auth`, `db`. Config values read from `VITE_`-prefixed env vars in `.env.local`.
- `src/context/AuthContext.jsx` — Auth provider using `onAuthStateChanged`. Exports `useAuth()` hook providing: `currentUser`, `loading`, `login()`, `signup()`, `logout()`.
- `src/components/PrivateRoute.jsx` — Wrapper component that redirects to `/login` if not authenticated. Shows loading spinner while auth state is resolving.
- `src/pages/Landing.jsx` — Public landing/home page. Shows login/signup links when logged out, user email and logout when logged in.
- `src/pages/Login.jsx` — Email/password login form with inline field validation, Firebase error handling, and user-not-found prompt with signup link.
- `src/pages/Signup.jsx` — Registration form with password confirmation, inline field validation, and live password requirements hint (uppercase, lowercase, number, special character, length).
- `src/pages/Auth.css` — Shared styles for Login and Signup pages, field errors, password hints, and loading spinner.
- `src/test/setup.js` — Test setup file, imports jest-dom matchers.
- `src/components/PrivateRoute.test.jsx` — Unit tests for PrivateRoute (loading, authenticated, unauthenticated).
- `src/pages/Login.test.jsx` — Render and behavior tests for Login (inputs, button, errors, user-not-found).
- `vite.config.js` — Vite config with Vitest test configuration (jsdom environment, globals).

## Folder Structure

```
src/
  assets/        — Static assets (images, SVGs)
  components/    — Reusable UI components (PrivateRoute)
  context/       — React context providers (AuthContext)
  hooks/         — Custom React hooks
  pages/         — Route-level page components + page styles
  test/          — Test setup files
  utils/         — Helper/utility functions
  firebase.js    — Firebase config & initialization
  App.jsx        — Router setup
  App.css        — Landing page styles
  index.css      — Global base styles
  main.jsx       — App entry point
```

## Data Model

- (Firestore collections not yet created — database needs to be set up in Firebase Console)
