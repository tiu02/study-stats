# Current State

### Deployment: 
- Live at https://study-stats.netlify.app/
  - (Netlify env vars configured, SPA redirect via `public/_redirects`)

- **Netlify Serverless Functions**: Configured
  - `netlify.toml` — build command `npm run build`, publish `dist`, functions directory `netlify/functions/`
  - `netlify/functions/youtube-search.js` — proxies YouTube Data API v3 search; reads `YOUTUBE_API_KEY` from `process.env`; validates/caps query; returns `{ items: [{ videoId, title, channelTitle, thumbnail }] }`; maps 401/403/network errors to friendly responses
  - `netlify/functions/quotes.js` — proxies type.fit quotes API server-side to avoid browser CORS restrictions; no API key required; sets `Cache-Control: public, max-age=3600`
  - `netlify-cli` added as devDependency; `netlify:dev` script added to `package.json` for local function testing
  - `YOUTUBE_API_KEY` must be set in `.env.local` (local) and Netlify dashboard environment variables (production)

- **Study Vibe — Quote Widget**: In Progress (Phase 4)
  - Dashboard restructured to two-column layout: full-width top (heading, stat cards, progress bar) + `dashboard-main` left column (toggle + lists) + `dashboard-sidebar` right column (sticky on desktop, stacks below lists on mobile at ≤768px)
  - `StudyVibeQuote` component: fetches quotes via `/.netlify/functions/quotes`; 24h localStorage cache (`study_vibe_quote`); crossfade refresh (280ms); picks random quote from full array in memory on refresh (no re-fetch); 3-line clamp with Show more/less toggle (isClamped measured via scrollHeight); author + toggle on same line (author left, toggle right via `margin-left: auto`); left accent bar styling (3px indigo-to-purple gradient border); 15-quote local fallback pool when function unreachable; loading skeleton with shimmer animation
  - `music_note_2` icon + indigo-to-purple gradient "Study Vibe" title in card header

- **Firebase**: Configured
  - (SDK installed, env vars set in `.env.local` and Netlify environment variables)

- **User Authentication**: Working
  - signup
  - login
  - logout with error handling
  - password requirements enforcement
  - inline field validation
  - invalid-credential prompt with signup link
  - protected routes with return-path redirect
  - session persistence
  - Phase 12A redirect fixes: after login redirects to return-path or `/dashboard` (not `/`); after signup redirects to `/dashboard`; already-logged-in users visiting `/login` or `/signup` redirect to `/dashboard`

- **Testing**: Working
  - (Vitest + React Testing Library — 296 tests passing across 16 test files: PrivateRoute, Login, Signup, Navbar, Firestore service, Firestore hooks, Modal component, format utilities, PomodoroTimer, Sessions, Assignments, CustomSelect, AssignmentForm, Landing, NotFound, Dashboard).
  - Global Firebase SDK mock in test setup prevents heavy module loading.
  - React Router v7 Navigate mocked in PrivateRoute/Signup tests to avoid jsdom OOM.
  - vi.useFakeTimers() + vi.setSystemTime() used in format tests to pin "now" for deterministic getUrgency assertions.
  - vi.useFakeTimers() + vi.advanceTimersByTime() used in PomodoroTimer tests for tick progression and phase transitions
  - Date.now() faked via Vitest fake timers for timestamp-based elapsed calculations.
  - Navbar test updated to assert Pomodoro link is absent (removed in Phase 7).
  - Sessions filter tests use vi.useFakeTimers() + userEvent.setup({ advanceTimers }) for debounce testing.
  - CustomSelect interaction tested via selectCustomOption helper (click trigger → click option by label) because user.selectOptions() only works on native selects
  - filter-clear restart_alt button uses aria-label="Clear" to match /^clear$/i test assertion.
  - AssignmentForm tests mock DatePicker as a simple button that fires onChange.
  - Assignments tests mock AssignmentForm and PomodoroTimer (forwardRef async factory) to isolate page-level state.
  - Landing tests no longer mock Icons (Icons.jsx deleted; Landing uses Material Symbols inline); stale `vi.mock('../components/Icons')` block removed from Landing.test.jsx.
  - Phase 12A: Signup.test.jsx updated — redirect assertions changed from `/` to `/dashboard`; stale "Start Studying" button tests in Landing.test.jsx replaced with accurate `useEffect` redirect test.
  
- **Cloud Database**: Working 
  - Firestore database created
  - security rules deployed with field-level validation
  - data layer built with CRUD service module
  - custom React hooks for sessions/assignments/pomodoro
  - smoke-tested end-to-end

- **Security Hardening:** Firestore rules enforce field-level validation on both create and update 
  - (hasAll + hasOnly for required/allowed fields, type checks, size limits including 40-char subject cap on both sessions and assignments, enum validation for status, server timestamp verification).
  - Assignment update rule now validates all field types and sizes (previously only checked affectedKeys). 
  - Dead pomodoro collection rules removed (timer writes to sessions/assignments, not a separate collection). 
  - Service layer uses field whitelist on updates. Friendly error mapping hides internal Firebase messages.

- **Navbar & Routing**: Working
  - sticky navbar
  - centered nav links on desktop
  - hamburger menu with Material icons on mobile (grid_view / assignment / menu_book)
  - nav link order: Dashboard → Assignments → Sessions (matches user flow: create assignments before logging sessions)
  - profile button uses `person` icon; dropdown shows only user name (no redundant icon)
  - mobile nav links: icon + label aligned via `inline-flex` + `line-height:1`; gap 0.65rem; active state is color+weight only (no underline bleed onto icon)
  - conditional layout for logged-in/logged-out states
  - logout error handling with try/catch
  - 44px min-height touch target on logout button.
  - 6 routes total — `/`, `/login`, `/signup`, `/dashboard`, `/sessions`, `/assignments` — 3 protected nav links (Dashboard, Assignments, Sessions)
  - /pomodoro route and nav link removed in Phase 7.

- **Stub Pages**: Dashboard only 
  - (Pomodoro stub deleted in Phase 7)
  
- **404 Page**: Working 
  - styled error page with icon and back-to-home button for unknown routes
  - Netlify SPA redirect configured

- **Accessibility**: WCAG 2.1 AA improvements applied 
  - ARIA labels
  - role attributes
  - focus-visible indicators on all interactive elements including color swatches and auth buttons
  - contrast fixes
  - keyboard navigation for feature cards
  - screen reader error announcements
  - aria-describedby linking field errors to inputs
  - role="status" on loading spinners
  - role="alertdialog" with aria-describedby on delete and duration-warning modals
  - focus trap in all modals
  - Escape key closes modals
  - focus restored to trigger element on modal close
  - aria-pressed on color swatches
  - 44px min touch targets on all interactive elements including icon buttons/color swatches/show-more toggle
  - noValidate on session form suppresses browser tooltip validation

- **CSS Styling**: Polished 
  - Vite boilerplate removed
  - sticky navbar
  - SVG outline icons
  - responsive mobile layout with 2rem clearspace
  - consistent spacing/padding across all pages
  - session card hover lift/shadow
  - 640px max-width card list
  - long subject word-break in delete modal
  - lightened card background tint with AA-verified text contrast
  - status badge grouped next to subject via title-group wrapper
  - 2-line notes clamp with right-aligned gray "Show more" toggle
  - enlarged separator dot between date and duration
  - light-gray cancel buttons across all modals and forms
  - custom select dropdown arrow with inner padding
  - delete modal improved spacing and mobile centering
  - mobile 16px input font-size to prevent iOS auto-zoom
  - mobile form buttons flex-equal width
  - more distinct color presets for card borders
  - Phase 9B polish: unified icon weight/color across all dropdowns and clear buttons (wght 200, #6b7280)
  - CustomSelect replaces all native selects, DatePicker replaces native date input in SessionForm
  - inline clear buttons on search bar/subject/notes fields
  - edit/delete button gap set to 0 on mobile
  - filter result count margin tightened
  - custom color swatch moved to first position in color row for on-screen picker alignment. 
  - Phase 10 micro-animation pass: @keyframes fadeIn (opacity 0→1, translateY 8px→0, 0.25s) applied to all 6 page containers (Landing, Sessions, Assignments, Dashboard, Auth, NotFound)
  - Landing feature cards gained hover lift transform: translateY(-2px) to match Sessions/Assignments/Dashboard card pattern. 
  - Phase 10 consistency pass: AssignmentForm Due Date replaced with custom DatePicker (matching SessionForm)
  - AssignmentForm subject field wrapped in sf-field-wrap with inline × clear button (matching SessionForm)
  - SessionForm.css color-custom-swatch fixed
    - display:block→flex (icon now centered)
    - border color #2c4777→#9ca3af (on-palette gray)
    - added .color-custom-icon white+shadow+filled-variation styles (matching AssignmentForm.css). 
  - Phase 10B polish: assignment card title changed from single-line ellipsis to 2-line clamp
  - title-row badge alignment set to flex-start (pins to first line of wrapped title)
  - Timer button moved from actions row to meta row (far right, margin-left:auto) so it sits inline with due date context
  - Pomodoro timer overlay modal centered via margin:0 auto on .pomodoro-modal-box (was left-aligned inside 520px modal-content container). 
  - Console error sweep: useFirestore.js console.error gated behind import.meta.env.DEV (suppressed in production)
  - DatePicker and DateRangePicker calendar day keys changed from day.getDate() to year-month-day composite to prevent cross-month reconciliation collisions
  - 44px touch targets audited and applied across Navbar, CustomSelect, DatePicker, DateRangePicker, PomodoroTimer, Dashboard, Auth, NotFound, SessionForm, AssignmentForm
  - modal-overlay-centered class used on all small/confirm modals for consistent vertical centering on mobile. 
  - Phase 11 hover consistency pass: stat-card (Dashboard) and feature-card (Landing) hover styles aligned to match session/assignment card reference
    - box-shadow 0 4px 12px rgba(99,102,241,0.15)
    - translateY(-1px)
    - transition 0.2s
  - Phase 10C icon + nav polish: dashboard icon changed from `dashboard` → `grid_view` in Navbar and Landing feature card; all custom SVG icon components removed (Icons.jsx deleted — replaced by Material Symbols throughout)
  - Dashboard stat cards: `justify-content:center` added to base `.stat-card` so all cards vertically center their content (previously only hours card had this on mobile)
  - Dashboard mobile stat grid: 3-column layout at ≤480px — Hours card on left spans 2 rows via `grid-row:span 2`; Sessions/Deadlines fill top-right; Streak/Overdue fill bottom-right (CSS `nth-child` order swap keeps DOM order correct for desktop)
  - Hours stat card: split display on mobile — large `Xh` value + secondary `.stat-card-subvalue` for remaining minutes; subvalue hidden on desktop to keep all 5 cards structurally identical for vertical alignment

- **Study Session Tracker**: Working 
  - full CRUD with Firestore
  - Phase 5 — card layout: 
    - Row 1: title-group with 12px colored class-dot + h2 subject title (ellipsis) + edit/delete icon buttons
    - Row 2: date + enlarged separator + duration + separator + status icon (Material Symbol check_circle/pending/cancel) + Pomodoro badge (timer icon + "Pomodoro" label, indigo, shown when session.assignmentId is non-null)
    - Row 3: notes 2-line clamp with "Show more" toggle (whitespace-only notes suppressed). 
  - White card background (no tint), color-coded left border. 
  - Hours+minutes duration input with 0–59 minute validation (number spinners hidden via CSS)
  - 7 urgency-safe color presets (no red/amber/green) + custom color picker (moved to first position in row)
  - subject autocomplete (datalist indicator hidden via CSS)
  - all actions via centered modal overlays with focus trap and dimmed backdrop
  - duration-over-24h warning as overlay modal
  - double-submit protection
  - Firestore errors surfaced inside modals via formError prop. 
  - SessionForm uses custom DatePicker component for date selection and CustomSelect for status dropdown. 
  - Subject and notes fields have inline × clear buttons (sf-field-wrap pattern). Subject text truncates with ellipsis when unfocused.


- **Assignment Deadline Tracker**: Working 
  - full CRUD with Firestore
  - Phase 6 — assignment cards with:
    - quick-complete checkbox
    - class/color badge pill
    - assignment title (2-line clamp — shows full second line instead of mid-word ellipsis)
    - urgency indicators via warning icon + colored due date text (red ≤2 days/overdue, amber ≤5 days)
    - logged time display in meta row
    - secondary indigo "Timer" button pinned to far right of meta row (below due date)
    - duplicate-as-template button
    - all actions via shared Modal overlays
  - AssignmentForm with:
    - subject/color picker + title + due date (custom DatePicker, matching SessionForm)
    - classMap autocomplete with auto-color selection for known classes
    - inline × clear button on subject field
  - Completed section with show more/less chevron toggle

  - **Pomodoro Timer**: Working 
  - Phase 7 — accessed via a secondary "Timer" button in the actions row of each active assignment card. Clicking opens a page-level modal overlay with:
    - a large centered SVG ring (140px, CSS-controlled size)
    - configurable work/break duration inputs
    - play/pause/reset controls
    - assignment name shown as context in the modal header. 
  - Timestamp-based calculation (Date.now() vs stored startedAt) prevents drift when tab is backgrounded. 
  - Work/break phases, pause/resume with accumulated elapsed tracking. 
  - On work cycle complete: 1.5s hold on depleted ring before transitioning to break idle
  - Toast appears only after addSession write succeeds
  - distinguishes addSession failure vs updateAssignment failure in error messages. 
  - Single-timer enforcement: starting a second timer opens a "Stop & Start" conflict modal
    - confirming stops the running timer and opens the new assignment's modal with auto-start. 
  - Browser Notification API permission requested on first start.
  - beforeunload warning when timer is running. 
  - /pomodoro stub route removed — timer is modal-based per the architectural decision in DRAFT-PLAN.md.

- **Weekly Summary Dashboard**: Working 
  - Phase 8 — five stat cards (Hours This Week, Sessions This Week, Upcoming Deadlines, Overdue, Study Streak with flame icon)
  - weekly assignment progress bar with red/amber/green color transitions and CSS confetti pseudo-element animation at 100%
  - daily/weekly/monthly toggle with `chevron_left`/`chevron_right` date navigation and date range label (clicking active tab resets to current period)
  - Recent Sessions list (up to 5, compact cards with class badge pill, duration, date)
   - Upcoming Deadlines list (up to 5 incomplete assignments, class badge pill, urgency warning icon + colored due date)
   - empty states with outlined navigation shortcuts to /sessions and /assignments. 
   - Stat cards are clickable — Hours/Sessions/Streak navigate to /sessions; 
   - Upcoming/Overdue navigate to /assignments. 
   - All lists filtered from already-fetched data via date-fns with no additional Firestore reads.

- **Search & Filter Sessions**: Working 
  - (Phase 9 — redesigned toolbar layout on Sessions page. Search input stays on the left at all times with inline × clear button (gray, matches site style). 
  - Sort and Filter are separate icon-only buttons on the right. 
  - Sort dropdown: Newest first / Oldest first / Subject A–Z. 
  - Filter dropdown panel: 
    - Subject dropdown (CustomSelect, indigo-active when filter set)
    - Status dropdown (CustomSelect)
    - combined date range via custom DateRangePicker calendar (click start date then end date; shows month grid, range highlight, today indicator)
    - clear button removed — reset via icon-only restart_alt button pinned to bottom-right of filter panel. 
  - All filtering and sorting is client-side AND logic on the already-fetched sessions array. 
  - Active filter count badge on filter button; filter button turns indigo when filters are active. 
  - Result count ("Showing X of Y sessions") shown when any search or filter is active. 
  - "No sessions match your filters" empty state is distinct from the new-user empty state (icon, different message, inline "Clear all filters" button). 
  - Filter dropdown: 240px fixed width
  - Subject/Status use CustomSelect component with ellipsis truncation. 
  - Firestore Timestamps handled via `.toDate()` check. 
  - 30 tests in Sessions.test.jsx covering search debounce, sort (newest/oldest/subject), filter controls render, subject/status filters, AND logic, result count, empty states, clear button, filter count badge, and Timestamp handling.)

---

# Known Issues
- Material Icons loaded via Google Fonts CDN — requires internet connection. Icons will not render offline.
- Pomodoro timer state is intentionally lost on page navigation, logout, or modal close (state lives in the modal component, not Firestore). 
- A `beforeunload` warning fires when the timer is running, but navigating within the SPA (React Router) does not trigger `beforeunload`. 
- Closing the timer modal while the timer is paused also silently resets it — forceStop is called on modal close by design.
- `forceStart()` remains in PomodoroTimer's `useImperativeHandle` but is no longer called anywhere — `confirmStopAndStart` now uses the `autoStart` prop + modal swap instead. Safe to remove in a cleanup pass.
- Remaining test coverage gaps: SessionForm, DatePicker, and DateRangePicker have no dedicated test files. All three are exercised indirectly (DateRangePicker via Sessions.test.jsx filter tests; DatePicker mocked in AssignmentForm.test.jsx).
- `music_note_2` may not be a valid Material Symbols Outlined ligature — verify rendering in production; swap to a confirmed icon (e.g. `headphones`) if it renders as fallback text.
- type.fit quotes API has CORS restrictions from the browser — proxied through `/.netlify/functions/quotes`. Requires `netlify dev` for local testing; `npm run dev` alone will not reach the function.
- 15-quote local fallback pool activates silently when the Netlify function is unreachable (offline or cold start). Quotes cycle randomly so refresh always returns a different quote.
- Quote truncation (3-line clamp + Show more) not yet verified in browser — requires `netlify dev` + long-quote localStorage test to confirm `isClamped` detection works correctly.

## Next Steps
1. Complete Phase 4: Study Vibe card — verify quote truncation/Show more, confirm `music_note_2` icon renders, test with `netlify dev`.
2. Start Phase 5: YouTube Music API — add study music component to the Dashboard.