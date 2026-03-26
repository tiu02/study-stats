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

 ## Known 