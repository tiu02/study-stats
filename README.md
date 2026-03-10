# StudyStats

## Project description
StudyStats enables students and scholars to boost productivity and study habits. Users can track study sessions, manage deadlines, use a Pomodoro timer, and view weekly progress summarizing total hours studied, sessions completed, and due dates.

--

## Planned Features:
- Study Session Tracker: Create, edit, delete study sessions with subject, duration, and notes. All sessions stored in Firestore per user.
- Pomodoro timer: Timer to set work vs break. Ex: 50 min work/10 min break. Timer has automatic session logging to Firestore when a cycle of work/break is completed, tracked daily. 
- Assignment Deadline Tracker: Add due dates for assignments, with to-do list to mark as completed when done, color-coded by urgency.
- Weekly Summary Dashboard: Home page showing total hours studied weekly, sessions completed, upcoming assignments due this week, and overdue count. 
- User Authentication: Sign up, log in, and log out using Firebase Auth. Unauthenticated users are redirected to login. Session persists on refresh.
- Cloud Database: Replaces localStorage using Firestore. Each user sees only their own account and data.

--

## Tech Stack
- Frontend Framework: React 18 + Vite
- Routing: React Router v6
- Authentication: Firebase Auth (Email/Password)
- Database: Firebase Firestore
- Date Utilities: date-fns
- Styling: CSS Modules
- Deployment: Netlify (connected to Github)
- AI Dev Tool: Claude Code (VSCode Extension)

--
