## Current State

- Deployment: Live at https://study-stats.netlify.app/
- Firebase: Configured (SDK installed, env vars set in `.env.local`)
- User Authentication: Working (login, signup, logout, session persistence, protected routes, inline field validation, password requirements enforcement, user-not-found prompt with signup link)
- Testing: Working (Vitest + React Testing Library — 8 tests passing for PrivateRoute and Login)
- Cloud Database: Not started (Firestore SDK configured, but database not yet created in Firebase Console)
- Study Session Tracker: Not started
- Pomodoro Timer: Not started
- Assignment Deadline Tracker: Not started
- Weekly Summary Dashboard: Not started

## Known Issues

- Firestore security rules: Database will be created in test mode (open read/write). Must set per-user rules before deploying data features to prevent unauthorized access.
- PrivateRoute not yet applied: Exists but no routes use it yet. Must wrap future authenticated pages (dashboard, sessions, timer, deadlines) to prevent unauthenticated access.

## Next Steps

1. Start Phase 3: Navbar Shell + Stub Routes
2. Go to Firebase Console > Firestore > Create database (test mode)
