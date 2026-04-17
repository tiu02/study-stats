# StudyStats
--
## Week 8 Midterm

## Project description
StudyStats enables students and scholars to boost productivity and study habits. Users can track study sessions, manage deadlines, use a Pomodoro timer, and view weekly progress summarizing study stats and streak, all in realtime cloud sync.

--

## Features:
- **Study Session Tracker:**
  - Create, edit, & delete study sessions with subject, duration (hours + minutes), date, notes, user-selected color, and status (complete, in progress, incomplete).
  - Color-coded left border on session cards, status badges, and subject autocomplete from prior sessions. 
  - All sessions stored in Firestore per user with field-level security rules.

- **Search & Filter Sessions:**
  - Filter sessions by subject, date range, and completion status.

- **Assignment Deadline Tracker:**
  - Track ssignments with due dates, color-coded by urgency indicators.
  - Checkbox to quickly mark as complete.
  - Template from duplicating cards.
  - Logged time display.

  - **Pomodoro Timer:**
  - Timer to set work vs break, integrated into Assignments cards (Ex: 50 min work/10 min break).
  - Timer has automatic session logging to Firestore when a cycle of work/break is completed, tracked daily.

- **Weekly Summary Dashboard:**
  - Home page showing stat cards total hours studied weekly, sessions completed, upcoming assignments due this week, overdue count, and study streak.
  - Weekly progress bar with color indicators & confetti on progress completion
  - Daily/weekly/monthly toggle for upcoming deadlines and recent sessions.

- **User Authentication:**
  - Sign up, log in, and log out using Firebase Auth. 
  - On protected routes, users not logged in are redirected to login.
  - Session persists on refresh.

- **Cloud Database:**
  - Replaces localStorage using Firestore. 
  - Each user sees only their own account and data, private per account. 
  - Security rules enforce field-level validation, type checking, and size limits.


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

### Prerequisites
- Node.js 18+
- A Firebase project with Auth (Email/Password) and Firestore enabled

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/tiu02/study-stats/
   cd study-stats
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the project root with your own Firebase config: (make sure to add to .gitignore)
   ```
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   ```

4. Deploy Firestore security rules (requires Firebase CLI) or manually copy-paste it into Firestore rules online:
   ```bash
   firebase deploy --only firestore:rules
   ```

5. Start the dev server:
   ```bash
   npm run dev
   ```

6. Run tests:
   ```bash
   npm test
   ```
   315 tests across 18 test files. All passing.

### Deployment
The app is deployed on Netlify with the same `VITE_` environment variables configured in the Netlify dashboard. A `public/_redirects` file handles SPA routing so React Router manages all client-side routes.

 ## Known Bugs & Limitations

- Material Icons loaded via Google Fonts CDN — requires internet connection. Icons will not render offline.
- Pomodoro timer state is intentionally lost on page navigation, logout, or modal close (state lives in the modal component, not Firestore).
- A `beforeunload` warning fires when the timer is running, but navigating within the SPA (React Router) does not trigger `beforeunload`.
- Closing the timer modal while the timer is paused also silently resets it — forceStop is called on modal close by design.
- `forceStart()` remains in PomodoroTimer's `useImperativeHandle` but is no longer called anywhere — `confirmStopAndStart` now uses the `autoStart` prop + modal swap instead. Safe to remove in a cleanup pass.
- Remaining test coverage gaps: SessionForm, DatePicker, and DateRangePicker have no dedicated test files. All three are exercised indirectly (DateRangePicker via Sessions.test.jsx filter tests; DatePicker mocked in AssignmentForm.test.jsx).

--

## What I learned
I learned about which Claude model and level of effort I should use for which tasks. From this project, I felt like Claude Opus was more efficient at debugging and suggesting better alternatives than Sonnet. I also learned that some of the prompts became automated, like for example, how frequently I asked Claude to update the ARCHITECTURE.md and PROJECT-STATUS.md for context management, and at the later phases, I noticed it would automatically add it to its to do list while unit testing, without me prompting.

--
--

## Week 12 APIs (ONLY NEW INFO)

## Feature: Study Vibe
- **API 1: Motivational Quote** 
  - Dashboard sidebar feature combining two external APIs. 
  - Displays random motivational quote from ZenQuotes API, with results cached in localStorage for 24 hours.
  - 30-quote local fallback if API is offline.

- **API 2: Study Music**
  - Study music player which uses Netlify serverless function to search Youtube to return 3 random results.
  - Custom search field for users to find their own music.
  - Click thumbnail to open video embedded inline.
  - Shuffle button to find other videos while mood preset is selected.

--

## Tech Stack
- Serverless Functions: Netlify Functions (YouTube API proxy)
- External APIs: YouTube Data API v3, ZenQuotes API

--

## Setup Instructions
### YouTube API Key (required for Study Vibe music search)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project → Enable **YouTube Data API v3**
3. Create an API key under **APIs & Services → Credentials**
4. Add it to `.env.local`:
YOUTUBE_API_KEY=your-youtube-api-key


5. For production, add `YOUTUBE_API_KEY` to your Netlify dashboard under
**Site configuration → Environment variables**

> The key is read server-side by the Netlify Function only. It is never exposed in
> the browser or included in the built JavaScript bundle.

--

### Prerequisites

### Deployment
The app is deployed on Netlify with the same `VITE_` environment variables configured in the Netlify dashboard. A `public/_redirects` file handles SPA routing so React Router manages all client-side routes.

 ## Known Bugs & Limitations
- `music_note_2` and `star_shine` may not be valid Material Symbols Outlined ligatures — verify rendering in production; if either renders as fallback text, swap to confirmed icons (`music_note` and `auto_awesome` respectively).
- ZenQuotes API reliability unknown — if it returns an error, the 30-quote local fallback pool activates silently. Quotes cycle randomly so refresh always returns a different quote.
- Netlify Functions require `netlify dev` for local testing; `npm run dev` (Vite only) cannot reach serverless functions and will fall back to LOCAL_QUOTES for quotes, and show an error for music search.
- localStorage mood cache keys are tied to mood `key` values — renaming a mood key (e.g. `hiphop` → `rnb`) leaves a stale orphaned key in localStorage. Old keys expire after 30 min TTL or can be cleared manually.
- `videoPaused` state in `StudyVibeMusic` tracks whether the YouTube embed is paused, but can desync from actual player state if YouTube auto-pauses internally (ad, connectivity drop, user interacts within the iframe). Fixing this requires the full YouTube IFrame API `onStateChange` event listener, which is not implemented.

--

