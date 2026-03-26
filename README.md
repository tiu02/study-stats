# StudyStats

## Project description
StudyStats enables students and scholars to boost productivity and study habits. Users can track study sessions, manage deadlines, use a Pomodoro timer, and view weekly progress summarizing total hours studied, sessions completed, and due dates.

--

## Planned Features:
- Study Session Tracker: Create, edit, and delete study sessions with subject, duration (hours + minutes input), date, notes, user-assigned color, and status (complete, in progress, incomplete). Color-coded left border on session cards, status badges, and subject autocomplete from prior sessions. All sessions stored in Firestore per user with field-level security rules.
- Pomodoro Timer: Timer to set work vs break. Ex: 50 min work/10 min break. Timer has automatic session logging to Firestore when a cycle of work/break is completed, tracked daily.
- Assignment Deadline Tracker: Add due dates for assignments, with to-do list to mark as completed when done, color-coded by urgency.
- Weekly Summary Dashboard: Home page showing total hours studied weekly, sessions completed, upcoming assignments due this week, and overdue count.
- Search & Filter Sessions: Filter sessions by subject, date range, or completion status.
- User Authentication: Sign up, log in, and log out using Firebase Auth. Unauthenticated users are redirected to login. Session persists on refresh.
- Cloud Database: Replaces localStorage using Firestore. Each user sees only their own account and data, private per account. Security rules enforce field-level validation, type checking, and size limits.

--

## Tech Stack
- Frontend Framework: React 19 + Vite 7
- Routing: React Router v7
- Authentication: Firebase Auth (Email/Password)
- Database: Firebase Firestore
- Date Utilities: date-fns
- Styling: CSS Modules
- Testing: Vitest + React Testing Library
- Deployment: Netlify (connected to Github)
- AI Dev Tool: Claude Code (VSCode Extension)

--
 ## Setup Instructions

 ## Known Bugs & Limitations

- Search and Filter function not implemented
- Material Icons loaded via Google Fonts CDN requires internet connection. Icons will not render offline.
- Pomodoro timer state is intentionally lost on page navigation, logout, or modal close (state lives in the modal component, not Firestore). A `beforeunload` warning fires when the timer is running, but navigating within the SPA (React Router) does not trigger `beforeunload`. Closing the timer modal while the timer is paused also silently resets it — forceStop is called on modal close by design.
- `forceStart()` remains in PomodoroTimer's `useImperativeHandle` but is no longer called anywhere — `confirmStopAndStart` now uses the `autoStart` prop + modal swap instead. Safe to remove in a cleanup pass.

--

## What I learned
I learned about which Claude model and level of effort i should use for which tasks. From this project, I felt like Claude Opus was more efficient at debugging and suggesting better alternatives than Sonnet. I also learned that some of the prompts became automated, like for example, how frequently I asked Claude to update the ARCHITECTURE.md and PROJECT-STATUS.md for context management, and at the later phases, I noticed it would automatically add it to its to do list while unit testing, without me prompting.
