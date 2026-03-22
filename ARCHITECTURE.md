## Tech Stack

- Frontend: React 19 + Vite 7
- Routing: React Router v7
- Authentication: Firebase Auth (Email/Password)
- Database: Firebase Firestore
- Date Utilities: date-fns
- Deployment: Netlify (connected to GitHub)

## Key Files

- `src/main.jsx` — Entry point. Wraps app in `BrowserRouter` > `AuthProvider`.
- `src/App.jsx` — React Router routes: `/login`, `/signup`, `/` (protected).
- `src/App.css` — Landing page styles (indigo color scheme).
- `src/index.css` — Global base styles and resets.
- `src/firebase.js` — Initializes Firebase App, Auth, and Firestore. Exports: `app`, `auth`, `db`. Config values read from `VITE_`-prefixed env vars in `.env.local`.
- `src/context/AuthContext.jsx` — Auth provider using `onAuthStateChanged`. Exports `useAuth()` hook providing: `currentUser`, `loading`, `login()`, `signup()`, `logout()`.
- `src/components/PrivateRoute.jsx` — Wrapper component that redirects to `/login` if not authenticated. Shows loading spinner while auth state is resolving.
- `src/pages/Landing.jsx` — Landing/home page (protected). Shows signed-in user email and logout button.
- `src/pages/Login.jsx` — Email/password login form with inline Firebase error handling.
- `src/pages/Signup.jsx` — Registration form with password confirmation and inline error handling.
- `src/pages/Auth.css` — Shared styles for Login and Signup pages, plus loading spinner.

## Folder Structure

```
src/
  assets/        — Static assets (images, SVGs)
  components/    — Reusable UI components (PrivateRoute)
  context/       — React context providers (AuthContext)
  hooks/         — Custom React hooks
  pages/         — Route-level page components + page styles
  utils/         — Helper/utility functions
  firebase.js    — Firebase config & initialization
  App.jsx        — Router setup
  App.css        — Landing page styles
  index.css      — Global base styles
  main.jsx       — App entry point
```

## Data Model

- (Firestore collections not yet created — database needs to be set up in Firebase Console)
