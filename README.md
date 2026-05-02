# StudyStats

[![Netlify Status](https://api.netlify.com/api/v1/badges/46e83da8-5369-4b97-8776-93d36d422142/deploy-status)](https://app.netlify.com/sites/study-stats/deploys)
![Tests](https://img.shields.io/badge/tests-315%20passing-brightgreen)
[![GitHub](https://img.shields.io/badge/github-tiu02%2Fstudy--stats-blue?logo=github)](https://github.com/tiu02/study-stats)

**Live Demo:** https://study-stats.netlify.app/
**Demo Credentials:** `test@example.com` / `Password.123`

## Project description
StudyStats enables students and scholars to boost productivity and study habits. Users can track study sessions, manage deadlines, use a Pomodoro timer, and view weekly progress summarizing study stats and streak, all in realtime cloud sync.

## Features:
- **Study Session Tracker:**
  - Create, edit, & delete study sessions with subject, duration (hours + minutes), date, notes, user-selected color, and status (complete, in progress, incomplete).
  - Color-coded left border on session cards, status badges, and subject autocomplete from prior sessions. 
  - All sessions stored in Firestore per user with field-level security rules.

- **Search & Filter Sessions:**
  - Filter sessions by subject, date range, and completion status.

- **Assignment Deadline Tracker:**
  - Track Assignments with due dates, color-coded by urgency indicators.
  - Checkbox to quickly mark as complete.
  - Template from duplicating cards.
  - Logged time display.

- **Pomodoro Timer:**
  - Timer to set work vs break, integrated into Assignments cards (Ex: 50 min work/10 min break).
  - Automatically logs a study session to Firestore when a work cycle completes, and increments the assignment's logged time.

- **Weekly Summary Dashboard:**
  - Home page showing stat cards total hours studied weekly, sessions completed, upcoming assignments due this week, overdue count, and study streak.
  - Weekly progress bar with color indicators & confetti on progress completion
  - Daily/weekly/monthly toggle for upcoming deadlines and recent sessions.

- **Landing Page:**
  - Public home page with feature cards linking to each section of the app.
  - "Get Started" button routes to signup; logged-in users are redirected to the dashboard.

- **404 Page:**
  - Styled error page with icon and "Back to Home" button for unknown routes.

- **User Authentication:**
  - Sign up, log in, and log out using Firebase Auth. 
  - On protected routes, users not logged in are redirected to login.
  - Session persists on refresh.

- **Cloud Database:**
  - All data stored in Firestore.
  - Each user sees only their own account and data, private per account. 
  - Security rules enforce field-level validation, type checking, and size limits.


## Feature: Study Vibe
- Dashboard sidebar feature combining two external APIs. 
- **Motivational Quote:**
  - Displays random motivational quote from ZenQuotes API, with results cached in localStorage for 24 hours.
  - Refresh button to get different quote.
  - 30-quote local fallback if API is offline.

- **Study Music:**
  - Study music player which uses Netlify serverless function to search Youtube to return 3 random results.
  - Seven mood presets (Lo-fi, R&B, Jazz, Piano, Classical, Ambient, Nature) and a custom search field.
  - Click thumbnail to open video embedded inline.
  - Shuffle button to find other videos while mood preset is selected.

## Tech Stack
- **Frontend Framework:** React 19 + Vite 7
- **Routing:** React Router v7
- **Authentication:** Firebase Auth (Email/Password)
- **Database:** Firebase Firestore
- **Date Utilities:** date-fns
- **Styling:** CSS
- **Testing:** Vitest + React Testing Library
- **Serverless Functions:** Netlify Functions (YouTube API proxy + ZenQuotes CORS proxy)
- **External APIs:**
  - **[ZenQuotes API](https://zenquotes.io/):** For motivational quotes. No API key.
  - **[YouTube Data API v3](https://developers.google.com/youtube/v3):** Study music search results. API key is serverside only.
- **Deployment:** Netlify (connected to Github)
- **AI Dev Tool:** Claude Code (VSCode Extension)

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

   YOUTUBE_API_KEY=your-youtube-api-key
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

### Local Development - Netlify Functions
- `netlify-cli` installed as a dev dependency. Use it instead of `npm run dev` when you need the serverless functions to work:
```bash
netlify dev
```
This runs Vite + both serverless functions. Music search requires `YOUTUBE_API_KEY` in `.env.local`.
- **Note:** `npm run dev` (Vite only) cannot reach the serverless functions. The quote widget will fall back to local quotes and music search will show an error.

### YouTube API Key (required for Study Vibe music search)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project → Enable **YouTube Data API v3** under APIs & Services
3. Create an API key under **APIs & Services → Credentials**
4. Add it to `.env.local` in the project root:
   ```
   YOUTUBE_API_KEY=your-youtube-api-key
   ```
5. For production, add `YOUTUBE_API_KEY` to your Netlify dashboard under **Site configuration → Environment variables**


### Deployment
The app is deployed on Netlify with the same `VITE_` environment variables plus `YOUTUBE_API_KEY` configured in the Netlify dashboard under **Site configuration → Environment variables**. A `public/_redirects` file handles SPA routing so React Router manages all client-side routes.

## Known Limitations
- Material Icons loaded via Google Fonts CDN — requires internet connection. Icons will not render offline.
- Pomodoro timer state is intentionally lost on page navigation, logout, or modal close (state lives in the modal component, not Firestore).
- SPA navigation (React Router) does not trigger `beforeunload`, so the timer warning only fires on full page unloads (tab close, hard refresh).
- ZenQuotes API may occasionally be unavailable — a 30-quote local fallback pool activates silently when this happens.

## Week 8 What I learned 
I learned about which Claude model and level of effort I should use for which tasks. From this project, I felt like Claude Opus was more efficient at debugging and suggesting better alternatives than Sonnet. I also learned that some of the prompts became automated, like for example, how frequently I asked Claude to update the ARCHITECTURE.md and PROJECT-STATUS.md for context management, and at the later phases, I noticed it would automatically add it to its to do list while unit testing, without me prompting.

## Week 12 Reflection
1. What did you build and why? Which option did you pick? What made you choose it?
- I picked Option C because I felt adding external APIs would help increase user retention on my site through adding a new feature to keep users engaged and motivated to keep studying. For that, I planned with Claude Code (in Transcript 1), and it suggested having motivational quotes, but kept pairing it with different APIs, like for news or dictionary. I felt those didn't match my site or the feature's goal, so I thought about pairing motivational quotes with music, since many students listen to music to help focus.

2. What surprised you? Was anything easier or harder than expected? Did the LLM/API behave differently than you anticipated?
- It surprised me how easy it was to implement the YouTube Data API for the music video, which took me under 5 minutes to figure out. 
- The Quotes API was much harder for me to figure out due to all the unexpected issues I ran into. I started off using the original quote API Claude recommended me (type.fit), but it caused me a lot of back and forth with Claude since I kept seeing the same 5 quotes instead of random ones. I learned that API was effectively defunct (Transcript 5), so I had Clause switch to ZenQuotes, which returns 50 random quotes per call. 
- The YouTube API caught me off guard with HTML entities in video titles, like & returning as amp; (Transcript 5). I had to ask Claude to decode it in the serverless function before adding results to frontend.

3. What did you learn about how these services work? If you used Ollama, what was it like running a model locally? If you used a cloud API, what was the experience of managing keys and handling errors?
- I learned that using Netlify serverless function is very useful in different ways. For the Quotes API, the serverless function was useful to avoid CORS (Cross-Origin Resource Sharing), which causes browser blocks for fetching data from different domains. So, the function was used as a proxy to handle server-to-server requests. For YouTube Data API, the serverless function is used to hide the API key. Both uses of Netlify functions ensure security. 
- Managing the keys was the easier part for me. It definitely helps that I already experienced having to use API keys and add env variables to Netlify due to Week 8 for Firebase API, so I knew what to expect. Handling errors was more difficult as I was struggling with the results from try.fit quotes API before realizing it was defunct.

4. What would you do differently next time? If you had another week, what would you improve or try instead?
- Next time, I would add a way to track the quote usage, as currently there isn't a way to see how close the app is to hitting the limit of YouTube API 100 searches per 10,000 daily units (which was mentioned in YouTube's Quota Calculator page).
- If I had another week, I would improve the Study Vibe feature by adding further customizability. I think maybe adding a mood feature or custom emojis for the site to feel more personable to users. A classmate in the Week 8 discussion said my site feels too clean right now and I agree.
